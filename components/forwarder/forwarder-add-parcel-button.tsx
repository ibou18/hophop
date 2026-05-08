"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { toE164 } from "@/lib/phone-e164";
import type { Country } from "@/app/generated/prisma/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category =
  | "CLOTHING"
  | "ELECTRONICS"
  | "FOOD"
  | "COSMETICS"
  | "DOCUMENTS"
  | "OTHER";

type ParcelItem = { name: string; quantity: number; category: Category };

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
  items: ParcelItem[];
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; icon: string; label: string }[] = [
  { value: "CLOTHING", icon: "👕", label: "Vêtements" },
  { value: "ELECTRONICS", icon: "📱", label: "Électronique" },
  { value: "COSMETICS", icon: "🧴", label: "Cosmétiques" },
  { value: "FOOD", icon: "🍱", label: "Alimentaire" },
  { value: "DOCUMENTS", icon: "📄", label: "Documents" },
  { value: "OTHER", icon: "📦", label: "Autre" },
];

const STEPS = ["Client", "Destinataire", "Contenu", "Dimensions", "Récapitulatif"];

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20";

// ─── Main component ────────────────────────────────────────────────────────────

export function ForwarderAddParcelButton({
  shipmentId,
  forwarderCode5,
}: {
  shipmentId: string;
  forwarderCode5: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
      >
        <Plus size={14} strokeWidth={2.5} />
        Ajouter un colis client
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[min(92vh,760px)] overflow-y-auto sm:max-w-lg"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-[16px] text-hh-earth-dk">
              Ajouter un colis client
            </DialogTitle>
          </DialogHeader>
          {open && (
            <WizardBody
              shipmentId={shipmentId}
              forwarderCode5={forwarderCode5}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Wizard body ──────────────────────────────────────────────────────────────

function WizardBody({
  shipmentId,
  forwarderCode5,
  onClose,
}: {
  shipmentId: string;
  forwarderCode5: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  });

  const [addingNewRecipient, setAddingNewRecipient] = useState(false);

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
        if (!r?.firstName?.trim() || !r?.lastName?.trim() || !r?.city?.trim() || !r?.country) return false;
        const e164 = toE164(r.country as Country, r.phone ?? "");
        return !!e164;
      }
      return !!state.recipientId;
    }
    if (step === 2) return state.items.length > 0;
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

      router.refresh();
      onClose();
    } catch {
      setError("Erreur réseau. Réessaie.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                i < step
                  ? "bg-hh-savane text-white"
                  : i === step
                    ? "bg-hh-saffron text-white"
                    : "bg-hh-sand-dk/40 text-hh-muted",
              )}
            >
              {i < step ? <Check size={11} strokeWidth={2.5} /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[9px] sm:block",
                i === step ? "font-medium text-hh-saffron-dk" : "text-hh-muted",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 ring-1 ring-hh-sand-dk/20">
        {step === 0 && (
          <StepSearchClient
            forwarderCode5={forwarderCode5}
            onClientFound={onClientFound}
          />
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
          <StepContent
            items={state.items}
            setItems={(items) => update({ items })}
          />
        )}
        {step === 3 && (
          <StepDimensions state={state} update={update} />
        )}
        {step === 4 && state.client && (
          <StepSummary
            state={state}
            addingNewRecipient={addingNewRecipient}
          />
        )}
      </div>

      {error && (
        <p className="text-[13px] text-hh-kola" role="alert">
          {error}
        </p>
      )}

      {/* Navigation — masqué à l'étape 0 (gérée dans StepSearchClient) */}
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

  // Quick-create state
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

  async function handleSearch() {
    const q = query.trim();
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("search")}
            className="text-[12px] text-hh-muted hover:text-hh-earth-dk"
          >
            <ArrowLeft size={13} className="inline mr-1" />
            Retour à la recherche
          </button>
        </div>

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
          disabled={searching || query.trim().length < 3}
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
          className="flex items-center gap-2 text-[13px] font-medium text-hh-saffron-dk hover:underline underline-offset-2"
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
    [state.newRecipient, nr, update],
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
            className="flex items-center gap-2 self-start text-[13px] font-medium text-hh-saffron-dk hover:underline underline-offset-2"
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

// ─── Step 2: Content ──────────────────────────────────────────────────────────

function StepContent({
  items,
  setItems,
}: {
  items: ParcelItem[];
  setItems: (items: ParcelItem[]) => void;
}) {
  function toggle(cat: Category) {
    const existing = items.find((i) => i.category === cat);
    if (existing) {
      setItems(items.filter((i) => i.category !== cat));
    } else {
      setItems([
        ...items,
        { category: cat, name: CATEGORIES.find((c) => c.value === cat)!.label, quantity: 1 },
      ]);
    }
  }

  function updateQty(cat: Category, delta: number) {
    setItems(
      items.map((item) =>
        item.category === cat
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">Contenu du colis</h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">Sélectionne les catégories.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => {
          const selected = items.find((i) => i.category === cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors",
                selected
                  ? "border-hh-saffron bg-hh-saffron-lt"
                  : "border-transparent bg-hh-sand hover:border-hh-sand-dk",
              )}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <span
                className={cn(
                  "text-[11px]",
                  selected ? "font-medium text-hh-saffron-dk" : "text-hh-muted",
                )}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-hh-sand-dk/15 pt-3">
          <p className="text-[11px] font-medium text-hh-muted">Quantités</p>
          {items.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded-[var(--hh-radius-md)] bg-hh-sand px-3 py-2"
            >
              <span className="text-[13px] text-hh-earth-dk">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(item.category, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <span className="w-5 text-center text-[13px] font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.category, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Dimensions ───────────────────────────────────────────────────────

function StepDimensions({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
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
    </div>
  );
}

// ─── Step 4: Summary ──────────────────────────────────────────────────────────

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
                {item.quantity > 1 ? `${item.quantity}× ` : ""}
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
