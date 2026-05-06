"use client";

import type { PricingType, Currency } from "@/app/generated/prisma/enums";
import { PRICING_TYPE_LABEL, CURRENCY_LABEL } from "@/lib/pricing";

export interface ShipmentPricingState {
  pricingType: PricingType | "";
  ratePerKg: string;
  ratePerBox: string;
  flatRate: string;
  ratePerVolume: string;
  ratePerVehicle: string;
  volumeDivisor: string;
  minimumCharge: string;
  currency: Currency;
}

export const DEFAULT_SHIPMENT_PRICING: ShipmentPricingState = {
  pricingType: "",
  ratePerKg: "",
  ratePerBox: "",
  flatRate: "",
  ratePerVolume: "",
  ratePerVehicle: "",
  volumeDivisor: "5000",
  minimumCharge: "0",
  currency: "CAD",
};

/** Convertit l'état du formulaire en payload API (champs nullables). */
export function pricingStateToPayload(s: ShipmentPricingState) {
  if (!s.pricingType) {
    return {
      pricingType: null,
      ratePerKg: null,
      ratePerBox: null,
      flatRate: null,
      ratePerVolume: null,
      ratePerVehicle: null,
      volumeDivisor: 5000,
      minimumCharge: 0,
    };
  }
  return {
    pricingType: s.pricingType,
    ratePerKg: s.ratePerKg ? parseFloat(s.ratePerKg) : null,
    ratePerBox: s.ratePerBox ? parseFloat(s.ratePerBox) : null,
    flatRate: s.flatRate ? parseFloat(s.flatRate) : null,
    ratePerVolume: s.ratePerVolume ? parseFloat(s.ratePerVolume) : null,
    ratePerVehicle: s.ratePerVehicle ? parseFloat(s.ratePerVehicle) : null,
    volumeDivisor: s.volumeDivisor ? parseFloat(s.volumeDivisor) : 5000,
    minimumCharge: s.minimumCharge ? parseFloat(s.minimumCharge) : 0,
    currency: s.currency,
  };
}

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";

const selectClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-hh-muted">{hint}</p>}
    </div>
  );
}

const PARCEL_PRICING_TYPES: PricingType[] = ["WEIGHT_KG", "PER_BOX", "VOLUMETRIC", "FLAT"];

export function ShipmentPricingSection({
  value,
  onChange,
  disabled,
}: {
  value: ShipmentPricingState;
  onChange: (next: ShipmentPricingState) => void;
  disabled?: boolean;
}) {
  function set(key: keyof ShipmentPricingState, val: string) {
    onChange({ ...value, [key]: val });
  }

  const pt = value.pricingType;

  return (
    <div className="space-y-4 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-hh-sand/40 p-4">
      <div>
        <p className="text-[13px] font-medium text-hh-earth-dk">
          Tarification des colis
        </p>
        <p className="mt-0.5 text-[12px] text-hh-muted">
          Prioritaire sur la grille globale. Laisse vide pour utiliser les tarifs configurés.
        </p>
      </div>

      <Field label="Méthode de tarification">
        <select
          value={pt}
          onChange={(e) => set("pricingType", e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">— Sélectionner une méthode —</option>
          {PARCEL_PRICING_TYPES.map((k) => (
            <option key={k} value={k}>
              {PRICING_TYPE_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>

      {pt && pt !== "PER_VEHICLE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pt === "WEIGHT_KG" && (
            <Field label="Prix par kilo" hint="ex. 4.50">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.ratePerKg}
                onChange={(e) => set("ratePerKg", e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
          )}
          {pt === "PER_BOX" && (
            <Field label="Prix par carton" hint="ex. 45.00">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.ratePerBox}
                onChange={(e) => set("ratePerBox", e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
          )}
          {pt === "FLAT" && (
            <Field label="Prix fixe par colis" hint="ex. 30.00">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.flatRate}
                onChange={(e) => set("flatRate", e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
          )}
          {pt === "VOLUMETRIC" && (
            <>
              <Field label="Prix par unité volumétrique" hint="ex. 4.00">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value.ratePerVolume}
                  onChange={(e) => set("ratePerVolume", e.target.value)}
                  disabled={disabled}
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>
              <Field label="Diviseur volumétrique" hint="Aérien = 5000, maritime = 1000">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={value.volumeDivisor}
                  onChange={(e) => set("volumeDivisor", e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          <Field label="Minimum facturé" hint="0 = aucun minimum">
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.minimumCharge}
              onChange={(e) => set("minimumCharge", e.target.value)}
              disabled={disabled}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>

          <Field label="Devise">
            <select
              value={value.currency}
              onChange={(e) => set("currency", e.target.value as Currency)}
              disabled={disabled}
              className={selectClass}
            >
              {(Object.keys(CURRENCY_LABEL) as Currency[]).map((k) => (
                <option key={k} value={k}>
                  {CURRENCY_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}
