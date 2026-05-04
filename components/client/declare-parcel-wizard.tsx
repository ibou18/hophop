"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Package,
  Plus,
  X,
} from "lucide-react";
import type { Recipient } from "@/app/generated/prisma/client";
import type { ClientForwarderRow } from "@/lib/client-data";
import { uploadParcelImagesViaApi } from "@/lib/client/parcel-image-upload";
import {
  normalizeImageContentType,
  PARCEL_IMAGE_MAX_BYTES,
} from "@/lib/image-file-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "CLOTHING" | "ELECTRONICS" | "FOOD" | "COSMETICS" | "DOCUMENTS" | "OTHER";

type ParcelItem = {
  name: string;
  quantity: number;
  category: Category;
};

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
  items: ParcelItem[];
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
  /** Fichiers + URL d’aperçu blob (créée à l’ajout, révoquée à la suppression / démontage). */
  imageEntries: { file: File; previewUrl: string }[];
};

const CATEGORIES: { value: Category; icon: string; label: string }[] = [
  { value: "CLOTHING",    icon: "👕", label: "Vêtements"   },
  { value: "ELECTRONICS", icon: "📱", label: "Électronique" },
  { value: "COSMETICS",   icon: "🧴", label: "Cosmétiques"  },
  { value: "FOOD",        icon: "🍱", label: "Alimentaire"  },
  { value: "DOCUMENTS",   icon: "📄", label: "Documents"    },
  { value: "OTHER",       icon: "📦", label: "Autre"        },
];

const STEPS = [
  "Destinataire",
  "Contenu",
  "Dimensions",
  "Récapitulatif",
];

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20";

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function DeclareParcelWizard({
  recipients,
  forwarders,
}: {
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Envoi…");
  const [addingNew, setAddingNew] = useState(recipients.length === 0);

  const defaultRecipient = recipients.find((r) => r.isDefault);

  const [state, setState] = useState<WizardState>({
    forwarderId: forwarders[0]?.id ?? "",
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

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  function canAdvance(): boolean {
    if (step === 0) {
      if (!state.forwarderId) return false;
      if (addingNew) {
        const r = state.newRecipient;
        return !!(r?.firstName && r?.lastName && r?.phone && r?.city && r?.country);
      }
      return !!state.recipientId;
    }
    if (step === 1) return state.items.length > 0;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSubmitLabel("Création du colis…");
    try {
      let recipientId = state.recipientId;

      if (addingNew && state.newRecipient) {
        const res = await fetch("/api/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...state.newRecipient, isDefault: recipients.length === 0 }),
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
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-colors",
                i < step
                  ? "bg-hh-savane text-white"
                  : i === step
                  ? "bg-hh-saffron text-white"
                  : "bg-hh-sand-dk/40 text-hh-muted"
              )}
            >
              {i < step ? <Check size={13} strokeWidth={2.5} /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[10px] sm:block",
                i === step ? "font-medium text-hh-saffron-dk" : "text-hh-muted"
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
            state={state}
            update={update}
            addingNew={addingNew}
            setAddingNew={setAddingNew}
          />
        )}
        {step === 1 && (
          <StepContent items={state.items} setItems={(items) => update({ items })} />
        )}
        {step === 2 && (
          <StepDimensions
            weightKg={state.weightKg}
            lengthCm={state.lengthCm}
            widthCm={state.widthCm}
            heightCm={state.heightCm}
            description={state.description}
            imageEntries={state.imageEntries}
            update={update}
          />
        )}
        {step === 3 && (
          <StepSummary
            state={state}
            recipients={recipients}
            forwarders={forwarders}
            addingNew={addingNew}
          />
        )}
      </div>

      {error && (
        <p className="text-[13px] text-hh-kola" role="alert">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className={cn(
            "flex items-center gap-2 rounded-[var(--hh-radius-md)] px-4 py-2.5 text-[14px] font-medium transition-colors",
            step === 0
              ? "pointer-events-none opacity-0"
              : "text-hh-earth-dk hover:bg-hh-earth-lt"
          )}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continuer
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-savane px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? submitLabel : "Déclarer le colis"}
            {!submitting && <Check size={16} strokeWidth={2} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Recipient ─────────────────────────────────────────────────────────

function StepRecipient({
  recipients,
  forwarders,
  state,
  update,
  addingNew,
  setAddingNew,
}: {
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
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

  function updateNr(patch: Partial<typeof nr>) {
    update({ newRecipient: { ...nr, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Forwarder selector — only shown when client has multiple forwarders */}
      {forwarders.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-hh-muted">Via quel transitaire ?</p>
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
                    : "border-transparent bg-hh-sand hover:border-hh-sand-dk"
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-hh-earth-dk">{f.name}</p>
                  <p className="text-[12px] text-hh-muted">{f.city}</p>
                </div>
                {state.forwarderId === f.id && (
                  <Check size={15} strokeWidth={2} className="shrink-0 text-hh-saffron" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">Destinataire</h2>
        <p className="mt-0.5 text-[13px] text-hh-muted">
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
                  "flex items-center justify-between rounded-[var(--hh-radius-md)] border-2 px-4 py-3 text-left transition-colors",
                  state.recipientId === r.id
                    ? "border-hh-saffron bg-hh-saffron-lt"
                    : "border-transparent bg-hh-sand hover:border-hh-sand-dk"
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-hh-earth-dk">
                    {r.firstName} {r.lastName}
                    {r.isDefault && (
                      <span className="ml-2 rounded-full bg-hh-saffron-lt px-2 py-0.5 text-[11px] text-hh-saffron-dk">
                        défaut
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12px] text-hh-muted">
                    {r.city} · {r.phone}
                  </p>
                </div>
                {state.recipientId === r.id && (
                  <Check size={16} strokeWidth={2} className="text-hh-saffron" />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-2 self-start text-[13px] font-medium text-hh-saffron-dk hover:underline underline-offset-2"
          >
            <Plus size={14} strokeWidth={2} />
            Ajouter un nouveau proche
          </button>
        </>
      )}

      {addingNew && (
        <div className="flex flex-col gap-3">
          {recipients.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="flex items-center gap-1.5 self-start text-[13px] text-hh-muted hover:text-hh-earth-dk"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              Choisir un proche existant
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-hh-muted">Prénom *</label>
              <input
                className={inputClass}
                value={nr.firstName}
                onChange={(e) => updateNr({ firstName: e.target.value })}
                placeholder="Mamadou"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-hh-muted">Nom *</label>
              <input
                className={inputClass}
                value={nr.lastName}
                onChange={(e) => updateNr({ lastName: e.target.value })}
                placeholder="Diallo"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-hh-muted">Téléphone *</label>
            <input
              className={inputClass}
              type="tel"
              value={nr.phone}
              onChange={(e) => updateNr({ phone: e.target.value })}
              placeholder="+224 6XX XXX XXX"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-hh-muted">Pays *</label>
              <select
                className={inputClass}
                value={nr.country}
                onChange={(e) => updateNr({ country: e.target.value })}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-hh-muted">Ville *</label>
              <input
                className={inputClass}
                value={nr.city}
                onChange={(e) => updateNr({ city: e.target.value })}
                placeholder="Conakry"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Content ───────────────────────────────────────────────────────────

function StepContent({
  items,
  setItems,
}: {
  items: ParcelItem[];
  setItems: (items: ParcelItem[]) => void;
}) {
  function toggleCategory(cat: Category) {
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

  function updateQuantity(cat: Category, delta: number) {
    setItems(
      items.map((item) =>
        item.category === cat
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">Contenu du colis</h2>
        <p className="mt-0.5 text-[13px] text-hh-muted">
          Sélectionne les catégories (plusieurs possibles).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => {
          const selected = items.find((i) => i.category === cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors",
                selected
                  ? "border-hh-saffron bg-hh-saffron-lt"
                  : "border-transparent bg-hh-sand hover:border-hh-sand-dk"
              )}
            >
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span
                className={cn(
                  "text-[12px]",
                  selected ? "font-medium text-hh-saffron-dk" : "text-hh-muted"
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
          <p className="text-[12px] font-medium text-hh-muted">Quantités</p>
          {items.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded-[var(--hh-radius-md)] bg-hh-sand px-3 py-2"
            >
              <span className="text-[14px] text-hh-earth-dk">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.category, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Minus size={13} strokeWidth={2} />
                </button>
                <span className="w-6 text-center text-[14px] font-medium text-hh-earth-dk">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.category, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Plus size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Dimensions (optional) ────────────────────────────────────────────

function StepDimensions({
  weightKg,
  lengthCm,
  widthCm,
  heightCm,
  description,
  imageEntries,
  update,
}: {
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  description: string;
  imageEntries: { file: File; previewUrl: string }[];
  update: (p: Partial<WizardState>) => void;
}) {
  const [photoUploadErr, setPhotoUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remainingPhotos = Math.max(0, 8 - imageEntries.length);

  function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const next = [...imageEntries];
    for (const file of Array.from(list)) {
      if (next.length >= 8) break;
      if (file.size > PARCEL_IMAGE_MAX_BYTES) {
        setPhotoUploadErr(
          `Photo trop volumineuse (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).`,
        );
        continue;
      }
      if (!normalizeImageContentType(file)) {
        setPhotoUploadErr("Format non pris en charge (JPEG, PNG, WebP, GIF).");
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
      setPhotoUploadErr(null);
    }
    update({ imageEntries: next });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">
          Poids, dimensions & photos
        </h2>
        <p className="mt-0.5 text-[13px] text-hh-muted">
          Ces informations sont optionnelles mais utiles pour le transitaire.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-hh-muted">
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
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-hh-muted">
            Longueur (cm)
          </label>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            placeholder="L"
            value={lengthCm}
            onChange={(e) => update({ lengthCm: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-hh-muted">
            Largeur (cm)
          </label>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            placeholder="l"
            value={widthCm}
            onChange={(e) => update({ widthCm: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-hh-muted">
            Hauteur (cm)
          </label>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            placeholder="H"
            value={heightCm}
            onChange={(e) => update({ heightCm: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-medium text-hh-muted">
          Photos du colis (optionnel, max 8 — envoyées après création du colis)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          tabIndex={-1}
          disabled={remainingPhotos === 0}
          onChange={(e) => addPhotos(e.target.files)}
        />
        <button
          type="button"
          disabled={remainingPhotos === 0}
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-fit rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-hh-sand px-4 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand-dk/25 disabled:opacity-40"
        >
          Choisir des photos
        </button>
        <p className="text-[11px] text-hh-muted">
          Les fichiers sont enregistrés sur ton appareil jusqu’à la déclaration ; l’upload vers ton S3 se fait ensuite automatiquement.
        </p>
        {photoUploadErr ? (
          <p className="text-[12px] text-hh-kola" role="alert">
            {photoUploadErr}
          </p>
        ) : null}
        {imageEntries.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {imageEntries.map((entry, index) => (
              <li
                key={entry.previewUrl}
                className="relative h-16 w-16 overflow-hidden rounded-lg ring-1 ring-hh-sand-dk/30"
              >
                <img
                  src={entry.previewUrl}
                  alt=""
                  className="block size-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  onClick={() => {
                    URL.revokeObjectURL(entry.previewUrl);
                    update({
                      imageEntries: imageEntries.filter((_, i) => i !== index),
                    });
                  }}
                  className="absolute right-0.5 top-0.5 flex size-6 items-center justify-center rounded-full bg-hh-earth-dk/80 text-white hover:bg-hh-earth-dk"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-hh-muted">
          Description libre (optionnel)
        </label>
        <textarea
          className="min-h-[80px] w-full resize-none rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 py-2.5 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
          placeholder="Ex: Vêtements d'été pour enfants, chaussures…"
          value={description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Step 4: Summary ───────────────────────────────────────────────────────────

function StepSummary({
  state,
  recipients,
  forwarders,
  addingNew,
}: {
  state: WizardState;
  recipients: Recipient[];
  forwarders: ClientForwarderRow[];
  addingNew: boolean;
}) {
  const recipient = addingNew
    ? state.newRecipient
    : recipients.find((r) => r.id === state.recipientId);
  const forwarder = forwarders.find((f) => f.id === state.forwarderId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">Récapitulatif</h2>
        <p className="mt-0.5 text-[13px] text-hh-muted">
          Vérifie les informations avant de déclarer.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {forwarder && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Transitaire
            </p>
            <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">{forwarder.name}</p>
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
            <p className="mt-1 text-[13px] text-hh-kola">Destinataire manquant</p>
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
                {item.quantity > 1 ? `${item.quantity}× ` : ""}
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
                  {[state.lengthCm || "—", state.widthCm || "—", state.heightCm || "—"].join(
                    " × ",
                  )}{" "}
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

        <div className="rounded-[var(--hh-radius-md)] bg-hh-saffron-lt px-4 py-3">
          <div className="flex items-center gap-2">
            <Package size={15} strokeWidth={1.5} className="text-hh-saffron" />
            <p className="text-[13px] font-medium text-hh-saffron-dk">
              Un code de suivi sera généré automatiquement.
            </p>
          </div>
          <p className="mt-1 text-[12px] text-hh-muted">
            Au clic sur « Déclarer », le colis est créé puis les photos sont envoyées vers ton stockage et liées au colis dans l’ordre.
          </p>
        </div>
      </div>
    </div>
  );
}
