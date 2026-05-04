import { z } from "zod";

export const registerExpoPushTokenSchema = z.object({
  token: z.string().min(24, "Jeton invalide"),
  platform: z.enum(["ios", "android"]).optional(),
});
