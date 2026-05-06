import { z } from "zod";

const itemCategory = z.enum([
  "CLOTHING",
  "ELECTRONICS",
  "FOOD",
  "COSMETICS",
  "DOCUMENTS",
  "OTHER",
] as const);

const parcelItem = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  category: itemCategory.default("OTHER"),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const vehicleSchema = z.object({
  make:          z.string().min(1, "Marque requise"),
  model:         z.string().min(1, "Modèle requis"),
  year:          z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color:         z.string().optional(),
  vin:           z.string().optional(),
  plate:         z.string().optional(),
  fuelType:      z.enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID", "OTHER"]).default("GASOLINE"),
  condition:     z.enum(["RUNNING", "NON_RUNNING"]).default("RUNNING"),
  hasKeys:       z.boolean().default(true),
  inspectionNote: z.string().optional(),
});

export const createParcelSchema = z
  .object({
    recipientId: z.string().uuid(),
    forwarderId: z.string().uuid(),
    weightKg: z.number().positive().optional(),
    lengthCm: z.number().positive().optional(),
    widthCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    description: z.string().optional(),
    declaredValue: z.number().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    items: z.array(parcelItem).min(1).optional(),
    /** Envoi publié (lien déclaration) — sert au calcul tarif véhicule côté serveur uniquement. */
    shipmentId: z.string().uuid().optional(),
    // Présent uniquement pour les déclarations véhicule
    vehicle: vehicleSchema.optional(),
  })
  .refine(
    (d) => d.items && d.items.length > 0 || d.vehicle !== undefined,
    { message: "Fournir au moins un article ou un véhicule", path: ["items"] },
  )
  .refine((d) => !d.shipmentId || d.vehicle !== undefined, {
    message: "Référence d'envoi réservée à la déclaration véhicule.",
    path: ["shipmentId"],
  });

/** Après création du colis : enregistrer les URLs S3 (upload déjà effectué). */
export const attachParcelImagesSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(8),
});

export const patchParcelSchema = z.object({
  status: z
    .enum([
      "DECLARED",
      "COLLECTED",
      "IN_TRANSIT",
      "ARRIVED",
      "READY",
      "DELIVERED",
      "ISSUE",
    ] as const)
    .optional(),
  shipmentId: z.string().uuid().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  lengthCm: z.number().positive().nullable().optional(),
  widthCm: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  paymentMethod: z.enum(["ONLINE", "CASH", "TRANSFER", "OTHER"]).nullable().optional(),
  declaredValue: z.number().nonnegative().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
});
