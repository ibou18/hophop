import { z } from "zod";

const country = z.enum(["CA", "FR", "GN", "SN", "CI", "CM"] as const);

export const createClientSchema = z
  .object({
    code5: z.string().length(5).regex(/^\d{5}$/),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email().optional()
    ),
    phone: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().min(3).optional()
    ),
    address: z.string().optional(),
    city: z.string().optional(),
    country: country,
    authMethod: z.enum(["EMAIL", "PHONE"]).default("EMAIL"),
    password: z.string().min(8),
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === "EMAIL" && !data.email) {
      ctx.addIssue({
        code: "custom",
        message: "Email requis",
        path: ["email"],
      });
    }
    if (data.authMethod === "PHONE" && !data.phone) {
      ctx.addIssue({
        code: "custom",
        message: "Téléphone requis",
        path: ["phone"],
      });
    }
  });
