import type {
  CartonSize,
  Country,
  Currency,
  DrumSize,
  PricingType,
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
  rateDrumSmall: number | null;
  rateDrumMedium: number | null;
  rateDrumLarge: number | null;
  rateCartonSmall: number | null;
  rateCartonMedium: number | null;
  rateCartonLarge: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
}

export interface PricingInput {
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  /** Pour `PER_DRUM` — palier petit / moyen / grand fût */
  drumSize?: DrumSize | null;
  /** Pour `PER_SIZED_CARTON` — palier petit / moyen / grand carton */
  cartonSize?: CartonSize | null;
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
    case "PER_DRUM": {
      const size = input.drumSize;
      if (!size) return null;
      const rate =
        size === "SMALL"
          ? pricing.rateDrumSmall
          : size === "MEDIUM"
            ? pricing.rateDrumMedium
            : pricing.rateDrumLarge;
      if (rate == null || !Number.isFinite(rate)) return null;
      raw = rate;
      break;
    }
    case "PER_SIZED_CARTON": {
      const size = input.cartonSize;
      if (!size) return null;
      const rate =
        size === "SMALL"
          ? pricing.rateCartonSmall
          : size === "MEDIUM"
            ? pricing.rateCartonMedium
            : pricing.rateCartonLarge;
      if (rate == null || !Number.isFinite(rate)) return null;
      raw = rate;
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
    rateDrumSmall: null,
    rateDrumMedium: null,
    rateDrumLarge: null,
    rateCartonSmall: null,
    rateCartonMedium: null,
    rateCartonLarge: null,
    volumeDivisor: shipment.volumeDivisor,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
  };
  return calculatePrice(pricing, {
    destinationCountry: shipment.destinationCountry,
    transportMode: shipment.transportMode,
  });
}

/** Champs envoi pour tarif fût (3 paliers). */
export type ShipmentDrumTariffInput = {
  acceptsDrums: boolean;
  rateDrumSmall: number | null;
  rateDrumMedium: number | null;
  rateDrumLarge: number | null;
  minimumCharge: number;
  currency: Currency;
  destinationCountry: Country;
  transportMode: TransportMode;
};

/** Prix transport fût selon la taille déclarée. Null si envoi sans fûts ou tarif manquant. */
export function drumTariffFromShipment(
  shipment: ShipmentDrumTariffInput,
  size: DrumSize,
): PricingResult | null {
  if (!shipment.acceptsDrums) return null;
  const pricing: ShipmentPricingFields = {
    pricingType: "PER_DRUM",
    ratePerKg: null,
    ratePerBox: null,
    flatRate: null,
    ratePerVolume: null,
    ratePerVehicle: null,
    rateDrumSmall: shipment.rateDrumSmall,
    rateDrumMedium: shipment.rateDrumMedium,
    rateDrumLarge: shipment.rateDrumLarge,
    rateCartonSmall: null,
    rateCartonMedium: null,
    rateCartonLarge: null,
    volumeDivisor: 5000,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
  };
  return calculatePrice(pricing, {
    drumSize: size,
    destinationCountry: shipment.destinationCountry,
    transportMode: shipment.transportMode,
  });
}

/** Champs envoi pour tarif carton par taille (3 paliers). */
export type ShipmentSizedCartonTariffInput = {
  acceptsSizedCartons: boolean;
  rateCartonSmall: number | null;
  rateCartonMedium: number | null;
  rateCartonLarge: number | null;
  minimumCharge: number;
  currency: Currency;
  destinationCountry: Country;
  transportMode: TransportMode;
};

/** Prix transport carton standard selon la taille déclarée. */
export function sizedCartonTariffFromShipment(
  shipment: ShipmentSizedCartonTariffInput,
  size: CartonSize,
): PricingResult | null {
  if (!shipment.acceptsSizedCartons) return null;
  const pricing: ShipmentPricingFields = {
    pricingType: "PER_SIZED_CARTON",
    ratePerKg: null,
    ratePerBox: null,
    flatRate: null,
    ratePerVolume: null,
    ratePerVehicle: null,
    rateDrumSmall: null,
    rateDrumMedium: null,
    rateDrumLarge: null,
    rateCartonSmall: shipment.rateCartonSmall,
    rateCartonMedium: shipment.rateCartonMedium,
    rateCartonLarge: shipment.rateCartonLarge,
    volumeDivisor: 5000,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
  };
  return calculatePrice(pricing, {
    cartonSize: size,
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
  PER_DRUM: "Par fût (taille)",
  PER_SIZED_CARTON: "Par carton (taille)",
};

export const DRUM_SIZE_LABEL_FR: Record<DrumSize, string> = {
  SMALL: "Petit fût",
  MEDIUM: "Fût moyen",
  LARGE: "Grand fût",
};

export const CARTON_SIZE_LABEL_FR: Record<CartonSize, string> = {
  SMALL: "Petit carton",
  MEDIUM: "Carton moyen",
  LARGE: "Grand carton",
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
