import { z } from "zod";

const country = z.enum([
  "CA", "FR", "GN", "SN", "CI", "CM", "TG", "BF", "NG", "BE", "CH", "US", "GM", "ML",
] as const);

export const createRecipientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(3),
  address: z.string().optional(),
  city: z.string().min(1),
  country: country,
  isDefault: z.boolean().optional(),
});
