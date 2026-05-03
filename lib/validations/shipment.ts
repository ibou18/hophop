import { z } from "zod";

const country = z.enum(["CA", "FR", "GN", "SN", "CI", "CM"] as const);

export const createShipmentSchema = z.object({
  originCountry: country,
  destinationCountry: country,
  destinationCity: z.string().optional(),
  departureDate: z.coerce.date().optional(),
  arrivalDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const patchShipmentSchema = z.object({
  status: z
    .enum(["DRAFT", "CONFIRMED", "IN_TRANSIT", "ARRIVED", "CLOSED"] as const)
    .optional(),
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
