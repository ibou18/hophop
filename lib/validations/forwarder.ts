import { z } from "zod";
import { toE164 } from "@/lib/phone-e164";

const country = z.enum(["CA", "FR", "GN", "SN", "CI", "CM"] as const);

const emptyPhone = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const forwarderRegistrationFieldsSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(5, { message: "Au moins 5 caractères (min. 5)" })
    .max(72, {
      message: "Maximum 72 caractères (limite technique du hachage)",
    }),
  phone: z.preprocess(emptyPhone, z.string().optional()),
  country: country,
  city: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
});

export type ForwarderRegistrationFormInput = z.infer<
  typeof forwarderRegistrationFieldsSchema
>;

export const createForwarderSchema = forwarderRegistrationFieldsSchema
  .superRefine((data, ctx) => {
    const raw = data.phone?.trim();
    if (!raw) return;
    const e164 = toE164(data.country, raw);
    if (!e164) {
      ctx.addIssue({
        code: "custom",
        message: "Numéro invalide pour ce pays",
        path: ["phone"],
      });
    }
  })
  .transform((data) => {
    const raw = data.phone?.trim();
    return {
      ...data,
      phone: raw ? toE164(data.country, raw)! : undefined,
    };
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
  locale: z.enum(["fr", "en"]).optional(),
  timezone: z.string().min(1).max(64).optional(),
});
