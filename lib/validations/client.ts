import { z } from "zod";
import { Country } from "@/app/generated/prisma/enums";
import { toE164 } from "@/lib/phone-e164";

const country = z.enum(Country);

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Champs formulaire inscription client (téléphone = saisie nationale affichée). */
export const clientRegistrationFieldsSchema = z.object({
  /** Si renseigné, rattache le client à ce transitaire actif. */
  code5: z.preprocess(
    emptyToUndefined,
    z.union([
      z.undefined(),
      z
        .string()
        .length(5, { message: "Code transitaire : exactement 5 chiffres" })
        .regex(/^\d{5}$/, { message: "5 chiffres numériques uniquement" }),
    ]),
  ).optional(),
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
  city: z
    .string()
    .trim()
    .min(1, { message: "Ville requise" }),
  /** Centre-ville — si la ville est choisie dans les suggestions Google Places */
  cityLatitude: z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.number().finite().optional(),
  ),
  cityLongitude: z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.number().finite().optional(),
  ),
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
  .superRefine((data, ctx) => {
    const lat = data.cityLatitude;
    const lng = data.cityLongitude;
    if ((lat == null) !== (lng == null)) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude et longitude doivent être fournies ensemble.",
        path: ["cityLatitude"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    phone: toE164(data.country, data.phone)!,
  }));
