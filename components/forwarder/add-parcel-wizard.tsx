"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { PARCEL_IMAGE_MAX_BYTES, normalizeImageContentType } from "@/lib/image-file-types";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  calculatePrice,
  CURRENCY_SYMBOL,
  PRICING_TYPE_LABEL,
  type ShipmentPricingFields,
  type PricingResult,
} from "@/lib/pricing";
import type { Country, TransportMode } from "@/app/generated/prisma/enums";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import {
  ParcelContentSelection,
  type ParcelContentLine,
} from "@/components/client/parcel-content-selection";
import { toE164 } from "@/lib/phone-e164";

// ─── Types ────────────────────────────────────────────────────────────────────

type FoundClient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  country: string;
  city: string | null;
  recipients: FoundRecipient[];
};

type FoundRecipient = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  country: string;
  isDefault: boolean;
};

type WizardState = {
  client: FoundClient | null;
  recipientId: string;
  newRecipient: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    country: string;
  } | null;
  items: ParcelContentLine[];
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
  /** Fichiers images sélectionnés — uploadés après création du colis */
  imageFiles: File[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Client", "Destinataire", "Contenu", "Dimensions", "Photos", "Récapitulatif"];

// ─── Pricing helpers ──────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function parseOptionalPositiveFloat(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

type PriceEstimateView = {
  hasPricing: boolean;
  result: PricingResult | null;
  missingHint: string | null;
};

function ParcelPriceEstimateBlock({ view }: { view: PriceEstimateView }) {
  const { hasPricing, result, missingHint } = view;
  if (!hasPricing) return null;

  if (result) {
    const sym = CURRENCY_SYMBOL[result.currency];
    return (
      <div className="rounded-[var(--hh-radius-md)] border border-hh-saffron/30 bg-hh-saffron-lt/50 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
          Estimation indicative
        </p>
        <p className="mt-1 text-[22px] font-semibold tabular-nums text-hh-earth-dk">
          {formatMoney(result.calculatedPrice)}{" "}
          <span className="text-[16px] font-medium text-hh-muted">{sym}</span>
        </p>
        <p className="mt-1 text-[11px] text-hh-muted">
          {PRICING_TYPE_LABEL[result.pricingType]} · non contractuel
        </p>
      </div>
    );
  }

  if (missingHint) {
    return (
      <div className="rounded-[var(--hh-radius-md)] border border-hh-sand-dk/25 bg-hh-sand/50 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
          Estimation indicative
        </p>
        <p className="mt-1.5 text-[12px] text-hh-muted">{missingHint}</p>
      </div>
    );
  }

  return null;
}

/** Données de tarification du shipment passées en props au wizard */
export type WizardShipmentPricing = ShipmentPricingFields & {
  destinationCountry: Country;
  transportMode: TransportMode;
};

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20";

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function AddParcelWizard({
  shipmentId,
  forwarderCode5,
  backUrl,
  shipmentPricing,
}: {
  shipmentId: string;
  forwarderCode5: string;
  backUrl: string;
  /** Si défini, affiche une estimation de prix dans l'étape Dimensions. */
  shipmentPricing?: WizardShipmentPricing | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingNewRecipient, setAddingNewRecipient] = useState(false);

  const [state, setState] = useState<WizardState>({
    client: null,
    recipientId: "",
    newRecipient: null,
    items: [],
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    description: "",
    imageFiles: [],
  });

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  function onClientFound(client: FoundClient) {
    update({ client, recipientId: client.recipients[0]?.id ?? "", newRecipient: null });
    setAddingNewRecipient(client.recipients.length === 0);
    setStep(1);
  }

  function canAdvance(): boolean {
    if (step === 0) return !!state.client;
    if (step === 1) {
      if (addingNewRecipient) {
        const r = state.newRecipient;
        if (!r?.firstName?.trim() || !r?.lastName?.trim() || !r?.city?.trim() || !r?.country)
          return false;
        return !!toE164(r.country as Country, r.phone ?? "");
      }
      return !!state.recipientId;
    }
    if (step === 2) return state.items.length > 0;
    // étape Photos (4) : toujours passable (optionnel)
    return true;
  }

  async function handleSubmit() {
    if (!state.client) return;
    setSubmitting(true);
    setError(null);
    try {
      let recipientId = state.recipientId;

      if (addingNewRecipient && state.newRecipient) {
        const nr = state.newRecipient;
        const e164 = toE164(nr.country as Country, nr.phone);
        if (!e164) {
          setError("Numéro du destinataire invalide pour ce pays.");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/forwarder/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: state.client.id, ...nr, phone: e164 }),
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok || !data.id) {
          setError(data.error ?? "Impossible de créer le destinataire.");
          setSubmitting(false);
          return;
        }
        recipientId = data.id;
      }

      function parsePos(raw: string): number | undefined {
        const n = parseFloat(raw.replace(",", "."));
        return Number.isFinite(n) && n > 0 ? n : undefined;
      }

      const res = await fetch("/api/forwarder/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: state.client.id,
          shipmentId,
          recipientId: addingNewRecipient ? undefined : recipientId,
          newRecipient: addingNewRecipient ? state.newRecipient : undefined,
          items: state.items,
          weightKg: parsePos(state.weightKg),
          lengthCm: parsePos(state.lengthCm),
          widthCm: parsePos(state.widthCm),
          heightCm: parsePos(state.heightCm),
          description: state.description || undefined,
        }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) {
        setError(json.error ?? "Erreur lors de la création du colis.");
        setSubmitting(false);
        return;
      }

      // Upload images si présentes
      if (state.imageFiles.length > 0) {
        const fd = new FormData();
        for (const f of state.imageFiles) fd.append("files", f);
        await fetch(`/api/forwarder/parcels/${json.id}/upload-images`, {
          method: "POST",
          body: fd,
        }).catch(() => {
          // Non bloquant — le colis est créé, les photos peuvent être ajoutées plus tard
        });
      }

      router.push(backUrl);
    } catch {
      setError("Erreur réseau. Réessaie.");
      setSubmitting(false);
    }
  }

  const priceEstimateView = useMemo((): PriceEstimateView => {
    if (!shipmentPricing?.pricingType) {
      return { hasPricing: false, result: null, missingHint: null };
    }
    const result = calculatePrice(shipmentPricing, {
      destinationCountry: shipmentPricing.destinationCountry,
      transportMode: shipmentPricing.transportMode,
      weightKg: parseOptionalPositiveFloat(state.weightKg),
      lengthCm: parseOptionalPositiveFloat(state.lengthCm),
      widthCm: parseOptionalPositiveFloat(state.widthCm),
      heightCm: parseOptionalPositiveFloat(state.heightCm),
    });
    if (result) return { hasPricing: true, result, missingHint: null };
    let missingHint: string | null = null;
    switch (shipmentPricing.pricingType) {
      case "WEIGHT_KG":
        missingHint = "Indiquez le poids estimé (kg) pour afficher une estimation.";
        break;
      case "VOLUMETRIC":
        missingHint = "Indiquez longueur, largeur et hauteur pour une estimation volumétrique.";
        break;
      default:
        missingHint = "Données de tarification incomplètes.";
    }
    return { hasPricing: true, result: null, missingHint };
  }, [
    shipmentPricing,
    state.weightKg,
    state.lengthCm,
    state.widthCm,
    state.heightCm,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de progression */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-colors",
                i < step
                  ? "bg-hh-savane text-white"
                  : i === step
                    ? "bg-hh-saffron text-white"
                    : "bg-hh-sand-dk/40 text-hh-muted",
              )}
            >
              {i < step ? <Check size={12} strokeWidth={2.5} /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[10px] sm:block",
                i === step ? "font-medium text-hh-saffron-dk" : "text-hh-muted",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Contenu de l'étape */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white p-5 ring-1 ring-hh-sand-dk/20">
        {step === 0 && (
          <StepSearchClient forwarderCode5={forwarderCode5} onClientFound={onClientFound} />
        )}
        {step === 1 && state.client && (
          <StepRecipient
            client={state.client}
            state={state}
            update={update}
            addingNew={addingNewRecipient}
            setAddingNew={setAddingNewRecipient}
          />
        )}
        {step === 2 && (
          <ParcelContentSelection
            items={state.items}
            onItemsChange={(items) => update({ items })}
          />
        )}
        {step === 3 && (
          <StepDimensions
            state={state}
            update={update}
            priceEstimateView={priceEstimateView}
          />
        )}
        {step === 4 && (
          <StepPhotos
            files={state.imageFiles}
            onChange={(imageFiles) => update({ imageFiles })}
          />
        )}
        {step === 5 && state.client && (
          <StepSummary state={state} addingNewRecipient={addingNewRecipient} />
        )}
      </div>

      {error && (
        <p className="text-[13px] text-hh-kola" role="alert">
          {error}
        </p>
      )}

      {/* Navigation — masquée à l'étape 0 (gérée dans StepSearchClient) */}
      {step > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 rounded-[var(--hh-radius-md)] px-3 py-2 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-earth-lt"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Retour
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Continuer
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-savane px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} strokeWidth={2} />
              )}
              {submitting ? "Création…" : "Créer le colis"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 0: Search client ────────────────────────────────────────────────────

function StepSearchClient({
  forwarderCode5,
  onClientFound,
}: {
  forwarderCode5: string;
  onClientFound: (client: FoundClient) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundClient[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "create">("search");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "FR",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function normalizeSearchQuery(raw: string): string {
    const t = raw.trim();
    if (t.includes("@")) return t;
    const hasPlus = t.startsWith("+");
    const digits = t.replace(/\D/g, "");
    return hasPlus ? `+${digits}` : digits;
  }

  async function handleSearch() {
    const q = normalizeSearchQuery(query);
    if (q.length < 3) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/forwarder/clients/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as FoundClient[] | { error: string };
      if (!res.ok || !Array.isArray(data)) {
        setSearchError("Erreur lors de la recherche.");
        return;
      }
      setResults(data);
    } catch {
      setSearchError("Erreur réseau.");
    } finally {
      setSearching(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/forwarder/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code5: forwarderCode5 }),
      });
      const data = (await res.json()) as FoundClient & { error?: string };
      if (!res.ok || !data.id) {
        setCreateError(data.error ?? "Impossible de créer le client.");
        return;
      }
      onClientFound({ ...data, recipients: [] });
    } catch {
      setCreateError("Erreur réseau.");
    } finally {
      setCreating(false);
    }
  }

  const patchForm = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  if (mode === "create") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMode("search")}
          className="flex items-center gap-1.5 self-start text-[12px] text-hh-muted hover:text-hh-earth-dk"
        >
          <ArrowLeft size={13} className="inline" />
          Retour à la recherche
        </button>

        <div>
          <h2 className="text-[16px] font-medium text-hh-earth-dk">Créer un client</h2>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            Un email de bienvenue lui sera envoyé avec ses accès.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">Prénom *</label>
            <input
              className={inputClass}
              value={form.firstName}
              onChange={(e) => patchForm({ firstName: e.target.value })}
              placeholder="Jean"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">Nom *</label>
            <input
              className={inputClass}
              value={form.lastName}
              onChange={(e) => patchForm({ lastName: e.target.value })}
              placeholder="Diallo"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-hh-muted">Email *</label>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => patchForm({ email: e.target.value })}
            placeholder="jean@exemple.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-hh-muted">Pays du client *</label>
          <select
            className={inputClass}
            value={form.country}
            onChange={(e) => patchForm({ country: e.target.value })}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-hh-muted">Téléphone *</label>
          <PhoneCountryField
            id="fap-client-phone"
            country={form.country as Country}
            nationalFormatted={form.phone}
            onNationalChange={(v) => patchForm({ phone: v })}
            inputClassName={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-hh-muted">Ville *</label>
          <input
            className={inputClass}
            value={form.city}
            onChange={(e) => patchForm({ city: e.target.value })}
            placeholder="Montréal"
          />
        </div>

        {createError && (
          <p className="text-[12px] text-hh-kola" role="alert">
            {createError}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={
            creating ||
            !form.firstName.trim() ||
            !form.lastName.trim() ||
            !form.email.trim() ||
            !form.phone.trim() ||
            !form.city.trim()
          }
          className="flex items-center justify-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {creating ? "Création…" : "Créer et continuer"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Rechercher le client</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Cherche par email ou numéro de téléphone.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className={cn(inputClass, "flex-1")}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
          placeholder="email ou téléphone…"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching || normalizeSearchQuery(query).length < 3}
          className="flex h-10 items-center gap-1.5 rounded-[var(--hh-radius-md)] bg-hh-saffron px-3 text-[13px] font-medium text-white disabled:opacity-40"
        >
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
        </button>
      </div>

      {searchError && (
        <p className="text-[12px] text-hh-kola" role="alert">
          {searchError}
        </p>
      )}

      {results !== null && (
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3 text-[13px] text-hh-muted">
              Aucun client trouvé pour cette recherche.
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onClientFound(c)}
                className="flex items-center justify-between rounded-[var(--hh-radius-md)] border border-hh-sand-dk/25 bg-hh-sand/50 px-4 py-3 text-left transition-colors hover:border-hh-saffron/40 hover:bg-hh-saffron-lt/50"
              >
                <div>
                  <p className="text-[14px] font-medium text-hh-earth-dk">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-[12px] text-hh-muted">
                    {c.email ?? c.phone ?? "—"}
                    {c.city ? ` · ${c.city}` : ""}
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-hh-saffron" />
              </button>
            ))
          )}
        </div>
      )}

      <div className="border-t border-hh-sand-dk/15 pt-3">
        <button
          type="button"
          onClick={() => setMode("create")}
          className="flex items-center gap-2 text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          <UserPlus size={14} strokeWidth={2} />
          Créer / inviter un nouveau client
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Recipient ────────────────────────────────────────────────────────

function StepRecipient({
  client,
  state,
  update,
  addingNew,
  setAddingNew,
}: {
  client: FoundClient;
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  addingNew: boolean;
  setAddingNew: (v: boolean) => void;
}) {
  const nr = state.newRecipient ?? {
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    country: "FR",
  };

  const patchNr = useCallback(
    (patch: Partial<typeof nr>) =>
      update({ newRecipient: { ...(state.newRecipient ?? nr), ...patch } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.newRecipient, update],
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Destinataire</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Pour{" "}
          <span className="font-medium">
            {client.firstName} {client.lastName}
          </span>
        </p>
      </div>

      {!addingNew && client.recipients.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {client.recipients.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => update({ recipientId: r.id })}
                className={cn(
                  "flex items-center justify-between rounded-[var(--hh-radius-md)] border-2 px-3 py-2.5 text-left transition-colors",
                  state.recipientId === r.id
                    ? "border-hh-saffron bg-hh-saffron-lt"
                    : "border-transparent bg-hh-sand hover:border-hh-sand-dk",
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-hh-earth-dk">
                    {r.firstName} {r.lastName}
                    {r.isDefault && (
                      <span className="ml-2 rounded-full bg-hh-saffron-lt px-2 py-0.5 text-[10px] text-hh-saffron-dk">
                        défaut
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-hh-muted">
                    {r.city} · {r.phone}
                  </p>
                </div>
                {state.recipientId === r.id && (
                  <Check size={15} strokeWidth={2} className="text-hh-saffron" />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-2 self-start text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
          >
            <Plus size={13} strokeWidth={2} />
            Nouveau destinataire
          </button>
        </>
      )}

      {addingNew && (
        <div className="flex flex-col gap-3">
          {client.recipients.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="flex items-center gap-1.5 self-start text-[12px] text-hh-muted hover:text-hh-earth-dk"
            >
              <ArrowLeft size={12} />
              Choisir existant
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-hh-muted">Prénom *</label>
              <input
                className={inputClass}
                value={nr.firstName}
                onChange={(e) => patchNr({ firstName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-hh-muted">Nom *</label>
              <input
                className={inputClass}
                value={nr.lastName}
                onChange={(e) => patchNr({ lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">Pays de livraison *</label>
            <select
              className={inputClass}
              value={nr.country}
              onChange={(e) => patchNr({ country: e.target.value })}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">Téléphone *</label>
            <PhoneCountryField
              id="fap-recipient-phone"
              country={nr.country as Country}
              nationalFormatted={nr.phone}
              onNationalChange={(v) => patchNr({ phone: v })}
              inputClassName={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">Ville *</label>
            <input
              className={inputClass}
              value={nr.city}
              onChange={(e) => patchNr({ city: e.target.value })}
              placeholder="Conakry"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Dimensions ───────────────────────────────────────────────────────

function StepDimensions({
  state,
  update,
  priceEstimateView,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  priceEstimateView: PriceEstimateView;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Poids & dimensions</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">Optionnel — utile pour la tarification.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-hh-muted">Poids estimé (kg)</label>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          min="0.1"
          step="0.1"
          placeholder="Ex: 3.5"
          value={state.weightKg}
          onChange={(e) => update({ weightKg: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { key: "lengthCm", label: "Longueur (cm)", placeholder: "L" },
            { key: "widthCm", label: "Largeur (cm)", placeholder: "l" },
            { key: "heightCm", label: "Hauteur (cm)", placeholder: "H" },
          ] as const
        ).map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">{label}</label>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              placeholder={placeholder}
              value={state[key]}
              onChange={(e) => update({ [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-hh-muted">Description (optionnel)</label>
        <textarea
          className="min-h-[72px] w-full resize-none rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 py-2.5 text-[14px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
          placeholder="Ex: Vêtements d'été, chaussures…"
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
        />
      </div>

      <ParcelPriceEstimateBlock view={priceEstimateView} />
    </div>
  );
}

// ─── Step 4: Photos ───────────────────────────────────────────────────────────

function StepPhotos({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX = 10;

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const incoming = Array.from(list);
    const remaining = MAX - files.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX} photos.`);
      return;
    }
    const valid: File[] = [];
    for (const f of incoming.slice(0, remaining)) {
      if (f.size > PARCEL_IMAGE_MAX_BYTES) {
        setError(`"${f.name}" dépasse ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo.`);
        continue;
      }
      if (!normalizeImageContentType(f)) {
        setError(`"${f.name}" : format non supporté (JPEG, PNG, WebP).`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onChange([...files, ...valid]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Photos du colis</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Optionnel — jusqu&apos;à {MAX} photos (JPEG, PNG, WebP · max{" "}
          {Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo chacune).
        </p>
      </div>

      {/* Grille de prévisualisation */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((f, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {files.length < MAX && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hh-sand-dk/50 text-hh-muted transition-colors hover:border-hh-saffron/50 hover:text-hh-saffron-dk"
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>
      )}

      {files.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-hh-sand-dk/50 py-10 transition-colors hover:border-hh-saffron/50 hover:bg-hh-saffron-lt/30"
        >
          <ImagePlus size={28} strokeWidth={1.2} className="text-hh-saffron/70" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-hh-earth-dk/70">
              Ajouter des photos
            </p>
            <p className="text-[11px] text-hh-muted">Appuyez pour sélectionner</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-[12px] text-hh-kola" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Step 5: Summary ──────────────────────────────────────────────────────────

function StepSummary({
  state,
  addingNewRecipient,
}: {
  state: WizardState;
  addingNewRecipient: boolean;
}) {
  const recipient = addingNewRecipient
    ? state.newRecipient
    : state.client?.recipients.find((r) => r.id === state.recipientId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Récapitulatif</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">Vérifie avant de créer.</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">Client</p>
          <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">
            {state.client?.firstName} {state.client?.lastName}
          </p>
          <p className="text-[12px] text-hh-muted">{state.client?.email ?? state.client?.phone}</p>
        </div>

        <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">
            Destinataire
          </p>
          {recipient ? (
            <>
              <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">
                {recipient.firstName} {recipient.lastName}
              </p>
              <p className="text-[12px] text-hh-muted">
                {recipient.city} · {recipient.phone}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[13px] text-hh-kola">Destinataire manquant</p>
          )}
        </div>

        <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">Contenu</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {state.items.map((item) => (
              <span
                key={item.category}
                className="rounded-full bg-white px-2.5 py-0.5 text-[12px] text-hh-earth-dk ring-1 ring-hh-sand-dk/30"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {(state.weightKg || state.description) && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">Détails</p>
            {state.weightKg && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                Poids : <span className="font-medium">{state.weightKg} kg</span>
              </p>
            )}
            {(state.lengthCm || state.widthCm || state.heightCm) && (
              <p className="mt-0.5 text-[13px] text-hh-earth-dk">
                Dimensions :{" "}
                <span className="font-medium">
                  {[state.lengthCm || "—", state.widthCm || "—", state.heightCm || "—"].join(
                    " × ",
                  )}{" "}
                  cm
                </span>
              </p>
            )}
            {state.description && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">{state.description}</p>
            )}
          </div>
        )}

        {state.imageFiles.length > 0 && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">
              Photos
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.imageFiles.map((f, i) => (
                <div
                  key={i}
                  className="relative size-14 overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[var(--hh-radius-md)] bg-hh-saffron-lt px-4 py-3">
          <div className="flex items-center gap-2">
            <Package size={14} strokeWidth={1.5} className="text-hh-saffron" />
            <p className="text-[13px] font-medium text-hh-saffron-dk">
              Le colis sera directement affecté à cet envoi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
