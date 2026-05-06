import type { Country, Currency, PricingType, TransportMode } from "@/app/generated/prisma/enums";

/** Résumé d’envoi pour déclaration (`?envoi=`) — tarifs et métadonnées. */
export type TargetShipmentSummary = {
  reference: string;
  originCountry: Country;
  destinationCountry: Country;
  destinationCity: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  transportMode?: TransportMode;
  /** Envoi conteneur / RORO acceptant les véhicules */
  acceptsVehicles?: boolean;
  pricingType?: PricingType | null;
  ratePerKg?: number | null;
  ratePerBox?: number | null;
  flatRate?: number | null;
  ratePerVolume?: number | null;
  ratePerVehicle?: number | null;
  volumeDivisor?: number;
  minimumCharge?: number;
  currency?: Currency;
};
