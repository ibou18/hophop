import type { ForwarderTariff } from "@/app/generated/prisma/client";
import type { Country, PricingType, Currency, TransportMode } from "@/app/generated/prisma/enums";

// ── Tarification issue d'un Shipment ─────────────────────────────────────────
// Sous-ensemble des champs Shipment nécessaires au calcul de prix.
export interface ShipmentPricingFields {
  pricingType: PricingType | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
}

export interface PricingInput {
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  destinationCountry: Country;
  transportMode: TransportMode;
}

export interface PricingResult {
  calculatedPrice: number;
  pricingType: PricingType;
  currency: Currency;
  tariffId: string;
}

/**
 * Résout le tarif applicable selon la priorité :
 * 1. pays spécifique + mode spécifique
 * 2. pays spécifique + tous modes (transportMode null)
 * 3. tous pays (null) + mode spécifique
 * 4. tous pays (null) + tous modes (null) — tarif global
 */
export function resolveTariff(
  tariffs: ForwarderTariff[],
  destinationCountry: Country,
  transportMode: TransportMode,
): ForwarderTariff | null {
  const active = tariffs.filter((t) => t.isActive);

  return (
    active.find(
      (t) => t.destinationCountry === destinationCountry && t.transportMode === transportMode,
    ) ??
    active.find(
      (t) => t.destinationCountry === destinationCountry && t.transportMode === null,
    ) ??
    active.find(
      (t) => t.destinationCountry === null && t.transportMode === transportMode,
    ) ??
    active.find(
      (t) => t.destinationCountry === null && t.transportMode === null,
    ) ??
    null
  );
}

/**
 * Calcule le prix à partir d'un tarif et des caractéristiques du colis.
 * Retourne null si les données sont insuffisantes pour le type de calcul.
 */
export function calculatePrice(
  tariff: ForwarderTariff,
  input: PricingInput,
): PricingResult | null {
  let raw: number | null = null;

  switch (tariff.pricingType) {
    case "WEIGHT_KG": {
      const kg = input.weightKg;
      if (
        kg == null ||
        !Number.isFinite(kg) ||
        kg <= 0 ||
        tariff.ratePerKg == null ||
        !Number.isFinite(tariff.ratePerKg)
      ) {
        return null;
      }
      raw = kg * tariff.ratePerKg;
      break;
    }
    case "PER_BOX": {
      if (tariff.ratePerBox == null || !Number.isFinite(tariff.ratePerBox)) {
        return null;
      }
      raw = tariff.ratePerBox;
      break;
    }
    case "FLAT": {
      if (tariff.flatRate == null || !Number.isFinite(tariff.flatRate)) {
        return null;
      }
      raw = tariff.flatRate;
      break;
    }
    case "VOLUMETRIC": {
      if (
        input.lengthCm == null ||
        input.widthCm == null ||
        input.heightCm == null ||
        !Number.isFinite(input.lengthCm) ||
        !Number.isFinite(input.widthCm) ||
        !Number.isFinite(input.heightCm) ||
        tariff.ratePerVolume == null ||
        !Number.isFinite(tariff.ratePerVolume)
      ) {
        return null;
      }
      const volumetricWeight =
        (input.lengthCm * input.widthCm * input.heightCm) / tariff.volumeDivisor;
      raw = volumetricWeight * tariff.ratePerVolume;
      break;
    }
  }

  if (raw === null) return null;

  const calculatedPrice = Math.max(raw, tariff.minimumCharge);

  return {
    calculatedPrice: Math.round(calculatedPrice * 100) / 100,
    pricingType: tariff.pricingType,
    currency: tariff.currency,
    tariffId: tariff.id,
  };
}

/**
 * Calcule le prix à partir des champs de tarification d'un Shipment.
 * Même logique que calculatePrice(tariff, input) mais sans l'id du tarif.
 */
export function calculatePriceFromShipment(
  pricing: ShipmentPricingFields,
  input: PricingInput,
): Omit<PricingResult, "tariffId"> | null {
  if (!pricing.pricingType) return null;

  // Déléguer à calculatePrice en construisant un objet compatible ForwarderTariff
  const fakeTariff = {
    id: "__shipment__",
    pricingType: pricing.pricingType,
    ratePerKg: pricing.ratePerKg,
    ratePerBox: pricing.ratePerBox,
    flatRate: pricing.flatRate,
    ratePerVolume: pricing.ratePerVolume,
    volumeDivisor: pricing.volumeDivisor,
    minimumCharge: pricing.minimumCharge,
    currency: pricing.currency,
  } as ForwarderTariff;

  const result = calculatePrice(fakeTariff, input);
  if (!result) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tariffId: _id, ...rest } = result;
  return rest;
}

/**
 * Point d'entrée principal : résout le tarif puis calcule le prix.
 * Priorité : tarification spécifique du shipment → grille globale ForwarderTariff.
 */
export function resolveAndCalculate(
  tariffs: ForwarderTariff[],
  input: PricingInput,
  shipmentPricing?: ShipmentPricingFields | null,
): PricingResult | null {
  // 1. Tarification propre au shipment (priorité absolue)
  if (shipmentPricing?.pricingType) {
    const result = calculatePriceFromShipment(shipmentPricing, input);
    if (result) return { ...result, tariffId: "__shipment__" };
  }

  // 2. Grille globale ForwarderTariff
  const tariff = resolveTariff(tariffs, input.destinationCountry, input.transportMode);
  if (!tariff) return null;
  return calculatePrice(tariff, input);
}

/** Label lisible pour l'affichage dans l'UI */
export const PRICING_TYPE_LABEL: Record<PricingType, string> = {
  WEIGHT_KG: "Au kilo",
  PER_BOX: "Au carton",
  VOLUMETRIC: "Volumétrique",
  FLAT: "Prix fixe",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  EUR: "Euro (€)",
  CAD: "Dollar canadien (CAD)",
  XOF: "Franc CFA UEMOA (XOF)",
  XAF: "Franc CFA CEMAC (XAF)",
  GNF: "Franc guinéen (GNF)",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  CAD: "CA$",
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "FG",
};
