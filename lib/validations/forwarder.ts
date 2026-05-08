import { z } from "zod";
import { Country } from "@/app/generated/prisma/enums";
import { toE164 } from "@/lib/phone-e164";

const country = z.enum(Country);

const emptyPhone = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const numOrUndefined = (v: unknown) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

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
  city: z
    .string()
    .trim()
    .min(1, { message: "Ville requise" }),
  address: z
    .string()
    .trim()
    .min(1, { message: "Adresse requise" }),
  addressFormatted: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  latitude: z.preprocess(numOrUndefined, z.number().finite().optional()),
  longitude: z.preprocess(numOrUndefined, z.number().finite().optional()),
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
  .superRefine((data, ctx) => {
    const lat = data.latitude;
    const lng = data.longitude;
    if ((lat == null) !== (lng == null)) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude et longitude doivent être fournies ensemble.",
        path: ["latitude"],
      });
      return;
    }
    if (lat == null) {
      ctx.addIssue({
        code: "custom",
        message:
          "Choisis une adresse dans les suggestions Google pour enregistrer la position exacte du siège.",
        path: ["address"],
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
