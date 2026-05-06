import { z } from "zod";
import { Country } from "@/app/generated/prisma/enums";

/** Aligné sur l’enum Prisma `Country` (évite les listes en dur incomplètes). */
const country = z.nativeEnum(Country);
const transportMode = z.enum(["AIR", "SEA", "ROAD", "CONTAINER", "RORO"] as const);
const pricingType = z.enum(["WEIGHT_KG", "PER_BOX", "VOLUMETRIC", "FLAT", "PER_VEHICLE"] as const);
const currency = z.enum(["EUR", "CAD", "XOF", "XAF", "GNF"] as const);

/** Champs communs de tarification d'un envoi (optionnels). */
const shipmentPricingFields = {
  pricingType: pricingType.nullable().optional(),
  ratePerKg: z.number().positive().nullable().optional(),
  ratePerBox: z.number().positive().nullable().optional(),
  flatRate: z.number().positive().nullable().optional(),
  ratePerVolume: z.number().positive().nullable().optional(),
  ratePerVehicle: z.number().positive().nullable().optional(),
  volumeDivisor: z.number().positive().optional(),
  minimumCharge: z.number().nonnegative().optional(),
  currency: currency.optional(),
};

const latSchema = z.number().finite().min(-90).max(90);
const lngSchema = z.number().finite().min(-180).max(180);

export const createShipmentSchema = z
  .object({
    originCountry: country,
    destinationCountry: country,
    transportMode: transportMode.default("AIR"),
    originCity: z.string().optional(),
    destinationCity: z.string().optional(),
    originLatitude: latSchema.optional(),
    originLongitude: lngSchema.optional(),
    destinationLatitude: latSchema.optional(),
    destinationLongitude: lngSchema.optional(),
    departureDate: z.coerce.date({
      message: "La date d’envoi est requise",
    }),
    arrivalDate: z.coerce.date().optional(),
    notes: z.string().optional(),
    acceptsVehicles: z.boolean().optional(),
    ...shipmentPricingFields,
  })
  .refine(
    (data) => {
      const hasLat = data.originLatitude !== undefined;
      const hasLng = data.originLongitude !== undefined;
      return hasLat === hasLng;
    },
    { message: "Latitude et longitude de départ requises ensemble", path: ["originLatitude"] },
  )
  .refine(
    (data) => {
      const hasLat = data.destinationLatitude !== undefined;
      const hasLng = data.destinationLongitude !== undefined;
      return hasLat === hasLng;
    },
    {
      message: "Latitude et longitude de destination requises ensemble",
      path: ["destinationLatitude"],
    },
  )
  .refine(
    (data) => {
      const dep = data.departureDate.getTime();
      const min = startOfTodayUtcMs();
      return dep >= min;
    },
    {
      message:
        "La date d’envoi doit être aujourd’hui (UTC) ou une date ultérieure",
      path: ["departureDate"],
    },
  );

/** Minuit UTC du jour courant en timestamp (comparaison avec Date complète). */
function startOfTodayUtcMs(): number {
  const now = new Date();
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0,
  );
}

export const patchShipmentSchema = z.object({
  status: z
    .enum(["DRAFT", "CONFIRMED", "IN_TRANSIT", "ARRIVED", "CLOSED"] as const)
    .optional(),
  transportMode: transportMode.optional(),
  originCity: z.string().nullable().optional(),
  destinationCity: z.string().nullable().optional(),
  originLatitude: latSchema.nullable().optional(),
  originLongitude: lngSchema.nullable().optional(),
  destinationLatitude: latSchema.nullable().optional(),
  destinationLongitude: lngSchema.nullable().optional(),
  departureDate: z.coerce.date().nullable().optional(),
  arrivalDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  acceptsVehicles: z.boolean().optional(),
  ...shipmentPricingFields,
});

export const patchShipmentParcelsSchema = z.object({
  parcelIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["assign", "unassign"]).default("assign"),
});
