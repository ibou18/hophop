import { z } from "zod";

const country = z.enum(["CA", "FR", "GN", "SN", "CI", "CM"] as const);
const transportMode = z.enum(["AIR", "SEA", "ROAD"] as const);

export const createShipmentSchema = z
  .object({
    originCountry: country,
    destinationCountry: country,
    transportMode: transportMode.default("AIR"),
    destinationCity: z.string().optional(),
    departureDate: z.coerce.date({
      message: "La date d’envoi est requise",
    }),
    arrivalDate: z.coerce.date().optional(),
    notes: z.string().optional(),
  })
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
  destinationCity: z.string().nullable().optional(),
  departureDate: z.coerce.date().nullable().optional(),
  arrivalDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const patchShipmentParcelsSchema = z.object({
  parcelIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["assign", "unassign"]).default("assign"),
});
