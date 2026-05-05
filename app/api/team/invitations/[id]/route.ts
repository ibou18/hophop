import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarderAdmin } from "@/lib/require-auth";

/** DELETE /api/team/invitations/[id] — annuler une invitation */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireForwarderAdmin();
  if (ctx instanceof Response) return ctx;

  const { id } = await params;

  const invitation = await prisma.forwarderInvitation.findFirst({
    where: { id, forwarderId: ctx.forwarderId, acceptedAt: null },
  });
  if (!invitation) {
    return jsonError("Invitation introuvable", 404);
  }

  // Marquer comme expirée immédiatement
  await prisma.forwarderInvitation.update({
    where: { id },
    data: { expiresAt: new Date() },
  });

  return jsonOk({ ok: true });
}
