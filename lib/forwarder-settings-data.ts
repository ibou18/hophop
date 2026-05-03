import { prisma } from "@/lib/prisma";

/** Profil transitaire (hors mot de passe) pour l’écran Paramètres. */
export async function getForwarderProfile(forwarderId: string) {
  return prisma.forwarder.findUnique({
    where: { id: forwarderId },
    omit: { passwordHash: true },
  });
}
