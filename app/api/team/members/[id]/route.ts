import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarderOwner } from "@/lib/require-auth";
import { updateMemberRoleSchema } from "@/lib/validations/team";

/** PATCH /api/team/members/[id] — changer le rôle d'un membre (OWNER seulement) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireForwarderOwner();
  if (ctx instanceof Response) return ctx;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const member = await prisma.forwarderUser.findFirst({
    where: { id, forwarderId: ctx.forwarderId },
  });
  if (!member) return jsonError("Membre introuvable", 404);
  if (member.role === "OWNER") return jsonError("Impossible de modifier le rôle du propriétaire", 403);

  const updated = await prisma.forwarderUser.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  return jsonOk(updated);
}

/** DELETE /api/team/members/[id] — retirer un membre (OWNER seulement) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireForwarderOwner();
  if (ctx instanceof Response) return ctx;

  const { id } = await params;

  // Impossible de se retirer soi-même
  if (id === ctx.forwarderUserId) {
    return jsonError("Vous ne pouvez pas vous retirer vous-même", 403);
  }

  const member = await prisma.forwarderUser.findFirst({
    where: { id, forwarderId: ctx.forwarderId },
  });
  if (!member) return jsonError("Membre introuvable", 404);
  if (member.role === "OWNER") return jsonError("Impossible de retirer le propriétaire", 403);

  await prisma.forwarderUser.update({
    where: { id },
    data: { isActive: false },
  });

  return jsonOk({ ok: true });
}
