import { z } from "zod";

export const scanSchema = z.object({
  trackingCode: z.string().min(3),
});
