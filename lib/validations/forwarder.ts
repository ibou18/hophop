import { z } from "zod";

const country = z.enum([
  "CA",
  "FR",
  "GN",
  "SN",
  "CI",
  "CM",
] as const);

export const createForwarderSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  country: country,
  city: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
});

export const patchForwarderSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  country: country.optional(),
  city: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  addressFormatted: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  paymentEnabled: z.boolean().optional(),
  stripeAccountId: z.string().nullable().optional(),
});
