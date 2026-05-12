"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Recipient } from "@/app/generated/prisma/client";
import type { Country, TransportMode } from "@/app/generated/prisma/enums";
import type { ClientForwarderRow } from "@/lib/client-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { toE164 } from "@/lib/phone-e164";
import { uploadParcelImagesViaApi } from "@/lib/client/parcel-image-upload";
import {
  normalizeImageContentType,
  PARCEL_IMAGE_MAX_BYTES,
} from "@/lib/image-file-types";
import {
  calculatePrice,
  CURRENCY_SYMBOL,
  PRICING_TYPE_LABEL,
  type PricingResult,
  type ShipmentPricingFields,
} from "@/lib/pricing";
import { TRANSPORT_MODE_LABEL } from "@/lib/transport-mode";
import type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";
import {
  ParcelContentSelection,
  parcelContentLinesFromAiCategories,
  type ParcelContentLine,
} from "@/components/client/parcel-content-selection";

export type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardState = {
  forwarderId: string;
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
  /** Fichiers + URL d’aperçu blob (créée à l’ajout, révoquée à la suppression / démontage). */
  imageEntries: { file: File; previewUrl: string }[];
};

const STEPS = [
  "Destinataire",
  "Photos",
  "Contenu",
  "Dimensions",
  "Récapitulatif",
];

const PARCEL_PHOTOS_MAX = 10;

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20";

function formatDateInfo(iso: string | null): string {
  if (!iso) return "date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

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

function ParcelPriceEstimateBlock({
  view,
  transportModeLabel,
}: {
  view: PriceEstimateView;
  transportModeLabel: string;
}) {
  const { hasPricing, result, missingHint } = view;

  if (!hasPricing) {
    return (
      <div className="rounded-[var(--hh-radius-md)] border border-dashed border-hh-sand-dk/35 bg-hh-sand/40 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
          Tarif indicatif
        </p>
        <p className="mt-1.5 text-[12px] text-hh-muted">
          Le tarif sera confirmé par le transitaire après acceptation de votre
          colis.
        </p>
      </div>
    );
  }

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
          {PRICING_TYPE_LABEL[result.pricingType]} · mode {transportModeLabel} ·
          non contractuel
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

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function DeclareParcelWizard({
  recipients,
  forwarders,
  initialForwarderId,
  targetShipmentId,
  targetShipmentSummary,
}: {
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
  /** Prérempli depuis `/client/declare?forwarder=CODE5` */
  initialForwarderId?: string;
  /** Envoi visé — après création du colis, demande d’intégration automatique (si l’envoi accepte encore les demandes) */
  targetShipmentId?: string;
  /** Détails de l’envoi (route, dates, tarification) depuis la page transitaire */
  targetShipmentSummary?: TargetShipmentSummary;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Envoi…");
  const [addingNew, setAddingNew] = useState(recipients.length === 0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiAlert, setAiAlert] = useState<string | null>(null);

  const defaultRecipient = recipients.find((r) => r.isDefault);

  const defaultForwarderId =
    initialForwarderId && forwarders.some((f) => f.id === initialForwarderId)
      ? initialForwarderId
      : (forwarders[0]?.id ?? "");

  const [state, setState] = useState<WizardState>({
    forwarderId: defaultForwarderId,
    recipientId: defaultRecipient?.id ?? recipients[0]?.id ?? "",
    newRecipient: null,
    items: [],
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    description: "",
    imageEntries: [],
  });

  const imageEntriesRef = useRef(state.imageEntries);
  useEffect(() => {
    imageEntriesRef.current = state.imageEntries;
  });
  useEffect(() => {
    return () => {
      imageEntriesRef.current.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    };
  }, []);

  /** Sans `?envoi=`, l’estimation utilise le mode Avion. Les grilles « maritime/route seulement » exigent une règle couvrant AIR ou tous les modes (mode vide en admin). */
  const transportMode: TransportMode =
    targetShipmentSummary?.transportMode ?? "AIR";
  const transportModeLabel = TRANSPORT_MODE_LABEL[transportMode];

  /** Contexte envoi depuis la page transitaire (`?envoi=`) : transitaire déjà choisi. */
  const showForwarderPicker =
    forwarders.length > 1 && targetShipmentSummary == null;

  const priceEstimateView = useMemo((): PriceEstimateView => {
    // Estimation disponible seulement si l'envoi a une tarification définie
    const s = targetShipmentSummary;
    if (!s?.pricingType) {
      return { hasPricing: false, result: null, missingHint: null };
    }

    const pricing: ShipmentPricingFields = {
      pricingType: s.pricingType,
      ratePerKg: s.ratePerKg ?? null,
      ratePerBox: s.ratePerBox ?? null,
      flatRate: s.flatRate ?? null,
      ratePerVolume: s.ratePerVolume ?? null,
      ratePerVehicle: s.ratePerVehicle ?? null,
      volumeDivisor: s.volumeDivisor ?? 5000,
      minimumCharge: s.minimumCharge ?? 0,
      currency: s.currency ?? "EUR",
    };

    const w = parseOptionalPositiveFloat(state.weightKg);
    const L = parseOptionalPositiveFloat(state.lengthCm);
    const W = parseOptionalPositiveFloat(state.widthCm);
    const H = parseOptionalPositiveFloat(state.heightCm);

    const result = calculatePrice(pricing, {
      destinationCountry: s.destinationCountry,
      transportMode: transportMode,
      weightKg: w,
      lengthCm: L,
      widthCm: W,
      heightCm: H,
    });

    if (result) {
      return { hasPricing: true, result, missingHint: null };
    }

    let missingHint: string | null = null;
    switch (s.pricingType) {
      case "WEIGHT_KG":
        missingHint =
          "Indiquez le poids estimé (kg) pour afficher une estimation.";
        break;
      case "VOLUMETRIC":
        missingHint =
          "Indiquez longueur, largeur et hauteur (cm) pour une estimation volumétrique.";
        break;
      default:
        missingHint =
          "Les données de tarification sont incomplètes — contactez le transitaire.";
    }
    return { hasPricing: true, result: null, missingHint };
  }, [
    targetShipmentSummary,
    state.weightKg,
    state.lengthCm,
    state.widthCm,
    state.heightCm,
    transportMode,
  ]);

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const patchNewRecipient = useCallback(
    (patch: Partial<NonNullable<WizardState["newRecipient"]>>) => {
      setState((s) => {
        const base = s.newRecipient ?? {
          firstName: "",
          lastName: "",
          phone: "",
          city: "",
          country: "FR",
        };
        return { ...s, newRecipient: { ...base, ...patch } };
      });
    },
    [],
  );

  async function analyzePhotoWithAI(file: File) {
    setAiLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          if (result) resolve(result);
          else reject(new Error("empty"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/ai/analyze-parcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
        }),
      });
      if (!res.ok) return;

      const data = (await res.json()) as {
        description?: string;
        estimatedWeightKg?: number | null;
        categories?: unknown;
        customsAlert?: string | null;
      };

      let suggested = false;
      setState((prev) => {
        const patch: Partial<WizardState> = {};
        if (data.description && !prev.description.trim()) {
          patch.description = data.description;
          suggested = true;
        }
        if (data.estimatedWeightKg != null && !prev.weightKg) {
          patch.weightKg = String(data.estimatedWeightKg);
          suggested = true;
        }
        if (
          Array.isArray(data.categories) &&
          data.categories.length > 0 &&
          prev.items.length === 0
        ) {
          const newItems = parcelContentLinesFromAiCategories(data.categories);
          if (newItems.length) {
            patch.items = newItems;
            suggested = true;
          }
        }
        return { ...prev, ...patch };
      });
      if (data.customsAlert) setAiAlert(data.customsAlert);
      if (suggested) setAiSuggested(true);
    } catch {
      // silent fail
    } finally {
      setAiLoading(false);
    }
  }

  function canAdvance(): boolean {
    if (step === 0) {
      if (!state.forwarderId) return false;
      if (addingNew) {
        const r = state.newRecipient;
        if (
          !r?.firstName?.trim() ||
          !r?.lastName?.trim() ||
          !r?.city?.trim() ||
          !r?.country
        ) {
          return false;
        }
        const e164 = toE164(r.country as Country, r.phone ?? "");
        return !!e164;
      }
      return !!state.recipientId;
    }
    if (step === 1) return true; // Photos : optionnel
    if (step === 2) return state.items.length > 0; // Contenu : requis
    // Dimensions : optionnel
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSubmitLabel("Création du colis…");
    try {
      let recipientId = state.recipientId;

      if (addingNew && state.newRecipient) {
        const nr = state.newRecipient;
        const e164 = toE164(nr.country as Country, nr.phone);
        if (!e164) {
          setError("Numéro de téléphone invalide pour le pays choisi.");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...nr,
            phone: e164,
            isDefault: recipients.length === 0,
          }),
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok || !data.id) {
          setError(data.error ?? "Impossible de créer le destinataire.");
          setSubmitting(false);
          return;
        }
        recipientId = data.id;
      }

      function optionalPositiveFloat(raw: string): number | undefined {
        const t = raw.trim();
        if (!t) return undefined;
        const n = parseFloat(t.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) return undefined;
        return n;
      }

      const lengthCm = optionalPositiveFloat(state.lengthCm);
      const widthCm = optionalPositiveFloat(state.widthCm);
      const heightCm = optionalPositiveFloat(state.heightCm);

      const body: Record<string, unknown> = {
        forwarderId: state.forwarderId,
        recipientId,
        items: state.items,
        description: state.description || undefined,
        weightKg: state.weightKg ? parseFloat(state.weightKg) : undefined,
        ...(lengthCm !== undefined ? { lengthCm } : {}),
        ...(widthCm !== undefined ? { widthCm } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
      };

      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const parcelJson = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !parcelJson.id) {
        setError(parcelJson.error ?? "Erreur lors de la déclaration.");
        setSubmitting(false);
        return;
      }

      const parcelId = parcelJson.id;

      if (state.imageEntries.length > 0) {
        setSubmitLabel("Envoi des photos…");
        const uploadResult = await uploadParcelImagesViaApi(
          parcelId,
          state.imageEntries.map((e) => e.file),
        );
        if (!uploadResult.ok) {
          setError(
            `${uploadResult.error} Le colis a bien été créé ; les photos peuvent être ajoutées plus tard si besoin.`,
          );
        }
      }

      if (targetShipmentId) {
        setSubmitLabel("Intégration à l'envoi…");
        const reqRes = await fetch(
          `/api/shipments/${targetShipmentId}/requests`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ parcelId }),
          },
        );
        if (!reqRes.ok) {
          setError(
          "Colis enregistré. L'affectation à cet envoi a échoué — ouvre la fiche colis pour réessayer.",
          );
        }
      }

      router.push(`/client/parcels/${parcelId}`);
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setSubmitting(false);
      setSubmitLabel("Envoi…");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {(targetShipmentSummary || initialForwarderId) && (
        <div className="rounded-[var(--hh-radius-lg)] border border-hh-saffron/25 bg-hh-saffron-lt/60 px-4 py-3 text-sm text-hh-nuit">
          {targetShipmentSummary ? (
            <>
              <p className="font-medium text-hh-earth-dk">Envoi concerné</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                <span className="font-semibold text-hh-nuit">
                  {countryLabelFr(targetShipmentSummary.originCountry)}
                </span>
                <span className="text-hh-muted" aria-hidden>
                  →
                </span>
                <span className="font-semibold text-hh-nuit">
                  {targetShipmentSummary.destinationCity
                    ? `${targetShipmentSummary.destinationCity}, `
                    : ""}
                  {countryLabelFr(targetShipmentSummary.destinationCountry)}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-[13px] text-hh-muted">
                <li>
                  <span className="text-hh-nuit/80">Départ prévu : </span>
                  {formatDateInfo(targetShipmentSummary.departureDate)}
                </li>
                {targetShipmentSummary.arrivalDate ? (
                  <li>
                    <span className="text-hh-nuit/80">Arrivée estimée : </span>
                    {formatDateInfo(targetShipmentSummary.arrivalDate)}
                  </li>
                ) : null}
              </ul>
              <p className="mt-2 border-t border-hh-saffron/20 pt-2 font-mono text-[11px] text-hh-muted">
                Réf. interne : {targetShipmentSummary.reference}
              </p>
              {targetShipmentId ? (
                <span className="mt-2 block text-[13px] text-hh-muted">
                  Après la déclaration, une demande pour intégrer ce colis à cet
                  envoi sera envoyée au transitaire.
                </span>
              ) : (
                <span className="mt-2 block text-[13px] text-amber-800">
                  Cet envoi n&apos;accepte plus de nouvelles demandes
                  automatiques — vous pouvez quand même déclarer votre colis et
                  contacter le transitaire si besoin.
                </span>
              )}
            </>
          ) : (
            <span>
              Transitaire présélectionné depuis la page publique — vous pouvez
              le changer à l&apos;étape 1 si besoin.
            </span>
          )}
        </div>
      )}

      {/* Barre de progression — même logique que le wizard transitaire */}
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

      {/* Step card */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white p-5 ring-1 ring-hh-sand-dk/20">
        {step === 0 && (
          <StepRecipient
            recipients={recipients}
            forwarders={forwarders}
            showForwarderPicker={showForwarderPicker}
            state={state}
            update={update}
            patchNewRecipient={patchNewRecipient}
            addingNew={addingNew}
            setAddingNew={setAddingNew}
          />
        )}
        {step === 1 && (
          <StepPhotos
            imageEntries={state.imageEntries}
            update={update}
            onFirstPhoto={(file) => void analyzePhotoWithAI(file)}
          />
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-medium text-hh-earth-dk">
                  Contenu du colis
                </h2>
                <p className="mt-0.5 text-[12px] text-hh-muted">
                  Sélectionne une ou plusieurs catégories.
                </p>
              </div>
              {aiLoading && (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-hh-saffron/10 px-3 py-1.5 text-[11px] font-medium text-hh-saffron-dk">
                  <Loader2 size={11} className="animate-spin" />
                  Analyse IA…
                </div>
              )}
              {aiSuggested && !aiLoading && (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
                  <Sparkles size={11} />
                  Pré-rempli par l&apos;IA
                  <button
                    type="button"
                    onClick={() => setAiSuggested(false)}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
            {aiLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-hh-saffron/20 bg-hh-saffron/6 px-4 py-3">
                <Loader2
                  size={16}
                  className="animate-spin shrink-0 text-hh-saffron"
                />
                <div>
                  <p className="text-[13px] font-semibold text-hh-saffron-dk">
                    Analyse en cours…
                  </p>
                  <p className="text-[11px] text-hh-saffron-dk/70">
                    L&apos;IA lit votre photo et remplit le contenu
                    automatiquement.
                  </p>
                </div>
              </div>
            )}
            {aiAlert && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <span className="mt-0.5 text-[14px]">⚠️</span>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-amber-800">
                    Alerte douanière
                  </p>
                  <p className="text-[12px] text-amber-700">{aiAlert}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiAlert(null)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <ParcelContentSelection
              items={state.items}
              onItemsChange={(items) => update({ items })}
              showIntro={false}
            />
          </div>
        )}
        {step === 3 && (
          <StepDimensions
            weightKg={state.weightKg}
            lengthCm={state.lengthCm}
            widthCm={state.widthCm}
            heightCm={state.heightCm}
            description={state.description}
            update={update}
            priceEstimateView={priceEstimateView}
            transportModeLabel={transportModeLabel}
          />
        )}
        {step === 4 && (
          <StepSummary
            state={state}
            recipients={recipients}
            forwarders={forwarders}
            addingNew={addingNew}
            priceEstimateView={priceEstimateView}
            transportModeLabel={transportModeLabel}
          />
        )}
      </div>

      {error && (
        <p className="text-[13px] text-hh-kola" role="alert">
          {error}
        </p>
      )}

      {/* Navigation — alignée sur le wizard transitaire */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--hh-radius-md)] px-3 py-2 text-[13px] font-medium transition-colors",
            step === 0
              ? "pointer-events-none opacity-0"
              : "text-hh-earth-dk hover:bg-hh-earth-lt",
          )}
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
            {submitting ? submitLabel : "Déclarer le colis"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 0: Recipient ─────────────────────────────────────────────────────────

function StepRecipient({
  recipients,
  forwarders,
  showForwarderPicker,
  state,
  update,
  patchNewRecipient,
  addingNew,
  setAddingNew,
}: {
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
  /** Faux si arrivée depuis une page envoi transitaire (transitaire déjà implicite). */
  showForwarderPicker: boolean;
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  patchNewRecipient: (
    p: Partial<NonNullable<WizardState["newRecipient"]>>,
  ) => void;
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

  function updateNr(patch: Partial<typeof nr>) {
    patchNewRecipient(patch);
  }

  const onPhoneNationalChange = useCallback(
    (v: string) => {
      patchNewRecipient({ phone: v });
    },
    [patchNewRecipient],
  );

  const recipientCountry = nr.country as Country;

  return (
    <div className="flex flex-col gap-4">
      {showForwarderPicker && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Transitaire
          </p>
          <div className="flex flex-col gap-1.5">
            {forwarders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => update({ forwarderId: f.id })}
                className={cn(
                  "flex items-center justify-between rounded-[var(--hh-radius-md)] border-2 px-3 py-2.5 text-left transition-colors",
                  state.forwarderId === f.id
                    ? "border-hh-saffron bg-hh-saffron-lt"
                    : "border-transparent bg-hh-sand hover:border-hh-sand-dk",
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-hh-earth-dk">
                    {f.name}
                  </p>
                  <p className="text-[12px] text-hh-muted">{f.city}</p>
                </div>
                {state.forwarderId === f.id && (
                  <Check
                    size={15}
                    strokeWidth={2}
                    className="shrink-0 text-hh-saffron"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">
          Destinataire
        </h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Qui recevra ce colis ?
        </p>
      </div>

      {!addingNew && recipients.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {recipients.map((r) => (
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
                  <Check
                    size={15}
                    strokeWidth={2}
                    className="text-hh-saffron"
                  />
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
          {recipients.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="flex items-center gap-1.5 self-start text-[12px] text-hh-muted hover:text-hh-earth-dk"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Choisir existant
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-hh-muted">
                Prénom *
              </label>
              <input
                className={inputClass}
                value={nr.firstName}
                onChange={(e) => updateNr({ firstName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-hh-muted">
                Nom *
              </label>
              <input
                className={inputClass}
                value={nr.lastName}
                onChange={(e) => updateNr({ lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] font-medium text-hh-muted"
              htmlFor="nr-country"
            >
              Pays de livraison *
            </label>
            <select
              id="nr-country"
              className={inputClass}
              value={nr.country}
              onChange={(e) => updateNr({ country: e.target.value })}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] font-medium text-hh-muted"
              htmlFor="nr-phone"
            >
              Téléphone *
            </label>
            <PhoneCountryField
              id="nr-phone"
              country={recipientCountry}
              nationalFormatted={nr.phone}
              onNationalChange={onPhoneNationalChange}
              inputClassName={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] font-medium text-hh-muted"
              htmlFor="nr-city"
            >
              Ville *
            </label>
            <input
              id="nr-city"
              className={inputClass}
              value={nr.city}
              onChange={(e) => updateNr({ city: e.target.value })}
              placeholder="Conakry"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Dimensions ───────────────────────────────────────────────────────

function StepDimensions({
  weightKg,
  lengthCm,
  widthCm,
  heightCm,
  description,
  update,
  priceEstimateView,
  transportModeLabel,
}: {
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
  update: (p: Partial<WizardState>) => void;
  priceEstimateView: PriceEstimateView;
  transportModeLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">
          Poids & dimensions
        </h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Siaisir les dimensions et le poids du colis approximatifs.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-hh-muted">
          Poids estimé (kg)
        </label>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          min="0.1"
          step="0.1"
          placeholder="Ex: 3.5"
          value={weightKg}
          onChange={(e) => update({ weightKg: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            {
              key: "lengthCm" as const,
              label: "Longueur (cm)",
              placeholder: "L",
            },
            {
              key: "widthCm" as const,
              label: "Largeur (cm)",
              placeholder: "l",
            },
            {
              key: "heightCm" as const,
              label: "Hauteur (cm)",
              placeholder: "H",
            },
          ] as const
        ).map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-hh-muted">
              {label}
            </label>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              placeholder={placeholder}
              value={
                key === "lengthCm"
                  ? lengthCm
                  : key === "widthCm"
                    ? widthCm
                    : heightCm
              }
              onChange={(e) => update({ [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-hh-muted">
          Description (optionnel)
        </label>
        <textarea
          className="min-h-[72px] w-full resize-none rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 py-2.5 text-[14px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
          placeholder="Ex: Vêtements d'été, chaussures…"
          value={description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
        />
      </div>

      <ParcelPriceEstimateBlock
        view={priceEstimateView}
        transportModeLabel={transportModeLabel}
      />
    </div>
  );
}

// ─── Step 3: Photos ─────────────────────────────────────────────────────────────

function StepPhotos({
  imageEntries,
  update,
  onFirstPhoto,
}: {
  imageEntries: { file: File; previewUrl: string }[];
  update: (p: Partial<WizardState>) => void;
  onFirstPhoto?: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setLocalError(null);
    const incoming = Array.from(list);
    const remaining = PARCEL_PHOTOS_MAX - imageEntries.length;
    if (remaining <= 0) {
      setLocalError(`Maximum ${PARCEL_PHOTOS_MAX} photos.`);
      return;
    }
    const valid: { file: File; previewUrl: string }[] = [];
    for (const f of incoming.slice(0, remaining)) {
      if (f.size > PARCEL_IMAGE_MAX_BYTES) {
        setLocalError(
          `"${f.name}" dépasse ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo.`,
        );
        continue;
      }
      if (!normalizeImageContentType(f)) {
        setLocalError(`"${f.name}" : format non supporté (JPEG, PNG, WebP).`);
        continue;
      }
      valid.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (valid.length) {
      const isFirst = imageEntries.length === 0;
      update({ imageEntries: [...imageEntries, ...valid] });
      if (isFirst && valid[0] && onFirstPhoto) onFirstPhoto(valid[0].file);
      setLocalError(null);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    const entry = imageEntries[index];
    if (entry) URL.revokeObjectURL(entry.previewUrl);
    update({ imageEntries: imageEntries.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-medium text-hh-earth-dk">
            Photos du colis
          </h2>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            Optionnel · jusqu&apos;à {PARCEL_PHOTOS_MAX} photos (JPEG, PNG, WebP
            · max {Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-hh-saffron/8 px-2.5 py-1 text-[10px] font-semibold text-hh-saffron-dk">
          <Sparkles size={10} />
          Analyse IA
        </div>
      </div>

      {imageEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imageEntries.map((entry, i) => (
            <div
              key={entry.previewUrl}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.previewUrl}
                alt={entry.file.name}
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
          {imageEntries.length < PARCEL_PHOTOS_MAX && (
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

      {imageEntries.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-hh-sand-dk/50 py-10 transition-colors hover:border-hh-saffron/50 hover:bg-hh-saffron-lt/30"
        >
          <ImagePlus
            size={28}
            strokeWidth={1.2}
            className="text-hh-saffron/70"
          />
          <div className="text-center">
            <p className="text-[14px] font-medium text-hh-earth-dk/70">
              Ajouter des photos
            </p>
            <p className="mt-0.5 text-[11px] text-hh-muted">
              L&apos;IA analysera le contenu automatiquement ✨
            </p>
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

      {localError && (
        <p className="text-[12px] text-hh-kola" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Summary ───────────────────────────────────────────────────────────

function StepSummary({
  state,
  recipients,
  forwarders,
  addingNew,
  priceEstimateView,
  transportModeLabel,
}: {
  state: WizardState;
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
  addingNew: boolean;
  priceEstimateView: PriceEstimateView;
  transportModeLabel: string;
}) {
  const recipient = addingNew
    ? state.newRecipient
    : recipients.find((r) => r.id === state.recipientId);
  const forwarder = forwarders.find((f) => f.id === state.forwarderId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-medium text-hh-earth-dk">
          Récapitulatif
        </h2>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Vérifie les informations avant de déclarer.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {forwarder && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Transitaire
            </p>
            <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">
              {forwarder.name}
            </p>
          </div>
        )}
        <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Destinataire
          </p>
          {recipient ? (
            <>
              <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">
                {recipient.firstName} {recipient.lastName}
              </p>
              {"phone" in recipient && (
                <p className="text-[12px] text-hh-muted">
                  {"city" in recipient ? `${recipient.city} · ` : ""}
                  {recipient.phone}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[13px] text-hh-kola">
              Destinataire manquant
            </p>
          )}
        </div>

        <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Contenu
          </p>
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

        {(state.weightKg ||
          state.description ||
          state.lengthCm ||
          state.widthCm ||
          state.heightCm ||
          state.imageEntries.length > 0) && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Détails
            </p>
            {state.weightKg && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                Poids : <span className="font-medium">{state.weightKg} kg</span>
              </p>
            )}
            {(state.lengthCm || state.widthCm || state.heightCm) && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                Dimensions (L × l × H) :{" "}
                <span className="font-medium">
                  {[
                    state.lengthCm || "—",
                    state.widthCm || "—",
                    state.heightCm || "—",
                  ].join(" × ")}{" "}
                  cm
                </span>
              </p>
            )}
            {state.description && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                {state.description}
              </p>
            )}
            {state.imageEntries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {state.imageEntries.map((entry) => (
                  <div
                    key={entry.previewUrl}
                    className="relative h-14 w-14 overflow-hidden rounded-md ring-1 ring-hh-sand-dk/25"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.previewUrl}
                      alt=""
                      className="block size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ParcelPriceEstimateBlock
          view={priceEstimateView}
          transportModeLabel={transportModeLabel}
        />

        <div className="rounded-[var(--hh-radius-md)] bg-hh-saffron-lt px-4 py-3">
          <div className="flex items-center gap-2">
            <Package size={15} strokeWidth={1.5} className="text-hh-saffron" />
            <p className="text-[13px] font-medium text-hh-saffron-dk">
              Un code de suivi sera généré automatiquement.
            </p>
          </div>
          <p className="mt-1 text-[12px] text-hh-muted">
            Au clic sur « Déclarer », le colis est créé puis les photos de
            l&apos;étape précédente sont envoyées et liées au colis dans
            l&apos;ordre.
          </p>
        </div>
      </div>
    </div>
  );
}
