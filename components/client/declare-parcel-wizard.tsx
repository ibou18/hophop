"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { ArrowLeft, ArrowRight, Check, Plus, Minus, Package } from "lucide-react";
import type { Recipient } from "@/app/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "CLOTHING" | "ELECTRONICS" | "FOOD" | "COSMETICS" | "DOCUMENTS" | "OTHER";

type ParcelItem = {
  name: string;
  quantity: number;
  category: Category;
};

type WizardState = {
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
  description: string;
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
}: {
  recipients: Recipient[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingNew, setAddingNew] = useState(recipients.length === 0);

  const defaultRecipient = recipients.find((r) => r.isDefault);

  const [state, setState] = useState<WizardState>({
    recipientId: defaultRecipient?.id ?? recipients[0]?.id ?? "",
    newRecipient: null,
    items: [],
    weightKg: "",
    description: "",
  });

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  function canAdvance(): boolean {
    if (step === 0) {
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
    try {
      let recipientId = state.recipientId;

      // Create new recipient if needed
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

      const body: Record<string, unknown> = {
        recipientId,
        items: state.items,
        description: state.description || undefined,
        weightKg: state.weightKg ? parseFloat(state.weightKg) : undefined,
      };

      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Erreur lors de la déclaration.");
        setSubmitting(false);
        return;
      }
      router.push(`/client/parcels/${data.id}`);
    } catch {
      setError("Une erreur réseau est survenue.");
      setSubmitting(false);
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
            description={state.description}
            update={update}
          />
        )}
        {step === 3 && (
          <StepSummary
            state={state}
            recipients={recipients}
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
            {submitting ? "Envoi…" : "Déclarer le colis"}
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
  state,
  update,
  addingNew,
  setAddingNew,
}: {
  recipients: Recipient[];
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
  description,
  update,
}: {
  weightKg: string;
  description: string;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">
          Poids & description
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
  addingNew,
}: {
  state: WizardState;
  recipients: Recipient[];
  addingNew: boolean;
}) {
  const recipient = addingNew
    ? state.newRecipient
    : recipients.find((r) => r.id === state.recipientId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[17px] font-medium text-hh-earth-dk">Récapitulatif</h2>
        <p className="mt-0.5 text-[13px] text-hh-muted">
          Vérifie les informations avant de déclarer.
        </p>
      </div>

      <div className="flex flex-col gap-3">
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

        {(state.weightKg || state.description) && (
          <div className="rounded-[var(--hh-radius-md)] bg-hh-sand px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Détails
            </p>
            {state.weightKg && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                Poids : <span className="font-medium">{state.weightKg} kg</span>
              </p>
            )}
            {state.description && (
              <p className="mt-1 text-[13px] text-hh-earth-dk">
                {state.description}
              </p>
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
            Tu pourras imprimer l'étiquette et partager le QR code avec le destinataire.
          </p>
        </div>
      </div>
    </div>
  );
}
