"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Country } from "@/app/generated/prisma/enums";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { toE164 } from "@/lib/phone-e164";

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 text-[15px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20";

export function AddRecipientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    country: "FR",
    address: "",
    isDefault: false,
  });

  const recipientCountry = form.country as Country;

  const onPhoneNationalChange = useCallback((v: string) => {
    setForm((f) => ({ ...f, phone: v }));
  }, []);

  function update(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.firstName || !form.lastName || !form.city) {
      setError("Prénom, nom et ville sont obligatoires.");
      return;
    }
    const e164 = toE164(recipientCountry, form.phone);
    if (!e164) {
      setError("Numéro de téléphone invalide pour le pays choisi.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: e164,
        city: form.city.trim(),
        country: form.country,
        address: form.address.trim() || undefined,
        isDefault: form.isDefault,
      }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'ajout.");
      setSubmitting(false);
      return;
    }
    router.push("/client/recipients");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[var(--hh-radius-lg)] bg-white p-5 ring-1 ring-hh-sand-dk/20"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-hh-muted">
            Prénom *
          </label>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder=""
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-hh-muted">Nom *</label>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
            placeholder=""
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-hh-muted">Pays *</label>
        <select
          className={inputClass}
          value={form.country}
          onChange={(e) => update({ country: e.target.value })}
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-hh-muted">
          Indicatif du téléphone aligné sur ce pays.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-[12px] font-medium text-hh-muted"
          htmlFor="recipient-phone"
        >
          Téléphone *
        </label>
        <PhoneCountryField
          id="recipient-phone"
          country={recipientCountry}
          nationalFormatted={form.phone}
          onNationalChange={onPhoneNationalChange}
          disabled={submitting}
          inputClassName={inputClass}
        />
        <p className="text-[11px] text-hh-muted">
          Saisie limitée (14 chiffres côté numéro national, hors indicatif).
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-hh-muted">Ville *</label>
        <input
          className={inputClass}
          value={form.city}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="Conakry"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[12px] font-medium text-hh-muted">
          Adresse (optionnel)
        </label>
        <input
          className={inputClass}
          value={form.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="Quartier Ratoma, Rue 12"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-hh-sand-dk accent-hh-saffron"
          checked={form.isDefault}
          onChange={(e) => update({ isDefault: e.target.checked })}
        />
        <span className="text-[13px] text-hh-earth-dk">
          Définir comme destinataire par défaut
        </span>
      </label>

      {error && (
        <p className="text-[13px] text-hh-kola" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-10 w-full rounded-[var(--hh-radius-md)] bg-hh-saffron text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Enregistrement…" : "Ajouter le proche"}
      </button>
    </form>
  );
}
