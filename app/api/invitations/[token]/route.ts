import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";

/** GET /api/invitations/[token] — récupérer les infos d'une invitation (public) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invitation = await prisma.forwarderInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      forwarder: {
        select: { id: true, name: true, logoUrl: true, city: true, code5: true },
      },
    },
  });

  if (!invitation) return jsonError("Invitation introuvable", 404);
  if (invitation.acceptedAt) return jsonError("Invitation déjà acceptée", 410);
  if (invitation.expiresAt < new Date()) return jsonError("Invitation expirée", 410);

  return jsonOk(invitation);
}
