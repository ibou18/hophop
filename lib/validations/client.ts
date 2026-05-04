import { z } from "zod";
import { toE164 } from "@/lib/phone-e164";

const country = z.enum(["CA", "FR", "GN", "SN", "CI", "CM"] as const);

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Champs formulaire inscription client (téléphone = saisie nationale affichée). */
export const clientRegistrationFieldsSchema = z.object({
  code5: z
    .string()
    .length(5)
    .regex(/^\d{5}$/),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.preprocess(
    emptyToUndefined,
    z.string().email({ message: "Email invalide" }),
  ),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().min(1, { message: "Téléphone requis" }),
  ),
  address: z.string().optional(),
  city: z.string().optional(),
  country: country,
  authMethod: z.enum(["EMAIL", "PHONE"]).default("EMAIL"),
  password: z
    .string()
    .min(5, { message: "Au moins 5 caractères (min. 5)" })
    .max(72, {
      message: "Maximum 72 caractères (limite technique du hachage)",
    }),
});

export type ClientRegistrationFormInput = z.infer<
  typeof clientRegistrationFieldsSchema
>;

/** API + persistance : téléphone normalisé E.164. */
export const createClientSchema = clientRegistrationFieldsSchema
  .superRefine((data, ctx) => {
    const e164 = toE164(data.country, data.phone);
    if (!e164) {
      ctx.addIssue({
        code: "custom",
        message: "Numéro invalide pour ce pays",
        path: ["phone"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    phone: toE164(data.country, data.phone)!,
  }));
