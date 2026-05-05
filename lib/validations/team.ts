import { z } from "zod";

export const forwarderRoleSchema = z.enum(["OWNER", "ADMIN", "STAFF"]);

export const createInvitationSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "STAFF"]), // OWNER ne peut pas être invité
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]), // On ne peut pas changer en OWNER via API
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const acceptInvitationSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50),
  lastName: z.string().min(1, "Nom requis").max(50),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(72, "Maximum 72 caractères"),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
