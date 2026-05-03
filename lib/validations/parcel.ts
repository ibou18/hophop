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

export const createParcelSchema = z.object({
  recipientId: z.string().uuid(),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  description: z.string().optional(),
  declaredValue: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  items: z.array(parcelItem).min(1),
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
