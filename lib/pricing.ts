import type {
  Country,
  PricingType,
  Currency,
  TransportMode,
} from "@/app/generated/prisma/enums";

// ── Champs de tarification portés par un Shipment ────────────────────────────

export interface ShipmentPricingFields {
  pricingType: PricingType | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  ratePerVehicle: number | null;
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
}

/**
 * Calcule le prix à partir des champs de tarification d'un Shipment.
 * Retourne null si les données sont insuffisantes (poids manquant, etc.)
 */
export function calculatePrice(
  pricing: ShipmentPricingFields,
  input: PricingInput,
): PricingResult | null {
  if (!pricing.pricingType) return null;

  let raw: number | null = null;

  switch (pricing.pricingType) {
    case "WEIGHT_KG": {
      const kg = input.weightKg;
      if (
        kg == null ||
        !Number.isFinite(kg) ||
        kg <= 0 ||
        pricing.ratePerKg == null ||
        !Number.isFinite(pricing.ratePerKg)
      ) {
        return null;
      }
      raw = kg * pricing.ratePerKg;
      break;
    }
    case "PER_BOX": {
      if (pricing.ratePerBox == null || !Number.isFinite(pricing.ratePerBox)) {
        return null;
      }
      raw = pricing.ratePerBox;
      break;
    }
    case "FLAT": {
      if (pricing.flatRate == null || !Number.isFinite(pricing.flatRate)) {
        return null;
      }
      raw = pricing.flatRate;
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
        pricing.ratePerVolume == null ||
        !Number.isFinite(pricing.ratePerVolume)
      ) {
        return null;
      }
      const volumetricWeight =
        (input.lengthCm * input.widthCm * input.heightCm) /
        pricing.volumeDivisor;
      raw = volumetricWeight * pricing.ratePerVolume;
      break;
    }
    case "PER_VEHICLE": {
      if (pricing.ratePerVehicle == null || !Number.isFinite(pricing.ratePerVehicle)) {
        return null;
      }
      raw = pricing.ratePerVehicle;
      break;
    }
  }

  if (raw === null) return null;

  return {
    calculatedPrice: Math.round(Math.max(raw, pricing.minimumCharge) * 100) / 100,
    pricingType: pricing.pricingType,
    currency: pricing.currency,
  };
}

/** Champs shipment nécessaires pour tarif véhicule (PER_VEHICLE / ratePerVehicle). */
export type ShipmentVehicleTariffInput = {
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  ratePerVehicle: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
  destinationCountry: Country;
  transportMode: TransportMode;
};

/** Prix transport véhicule depuis `ratePerVehicle` + devise/minimum de l'envoi. Null si pas de tarif véhicule. */
export function vehicleTariffFromShipment(
  shipment: ShipmentVehicleTariffInput,
): PricingResult | null {
  if (
    shipment.ratePerVehicle == null ||
    !Number.isFinite(shipment.ratePerVehicle)
  ) {
    return null;
  }
  const pricing: ShipmentPricingFields = {
    pricingType: "PER_VEHICLE",
    ratePerKg: shipment.ratePerKg,
    ratePerBox: shipment.ratePerBox,
    flatRate: shipment.flatRate,
    ratePerVolume: shipment.ratePerVolume,
    ratePerVehicle: shipment.ratePerVehicle,
    volumeDivisor: shipment.volumeDivisor,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
  };
  return calculatePrice(pricing, {
    destinationCountry: shipment.destinationCountry,
    transportMode: shipment.transportMode,
  });
}

/** Label lisible pour l'affichage dans l'UI */
export const PRICING_TYPE_LABEL: Record<PricingType, string> = {
  WEIGHT_KG: "Au kilo",
  PER_BOX: "Au carton",
  VOLUMETRIC: "Volumétrique",
  FLAT: "Prix fixe",
  PER_VEHICLE: "Par véhicule",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  EUR: "Euro (€)",
  CAD: "Dollar canadien (CAD)",
  XOF: "Franc CFA UEMOA (XOF)",
  XAF: "Franc CFA CEMAC (XAF)",
  GNF: "Franc guinéen (GNF)",
  NGN: "Naira (NGN)",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  CAD: "CA$",
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "FG",
  NGN: "₦",
};
