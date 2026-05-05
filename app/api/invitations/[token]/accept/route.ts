import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { acceptInvitationSchema } from "@/lib/validations/team";

/** POST /api/invitations/[token]/accept — créer le compte et rejoindre l'équipe */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = acceptInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }
  const { firstName, lastName, password } = parsed.data;

  const invitation = await prisma.forwarderInvitation.findUnique({
    where: { token },
  });

  if (!invitation) return jsonError("Invitation introuvable", 404);
  if (invitation.acceptedAt) return jsonError("Invitation déjà acceptée", 410);
  if (invitation.expiresAt < new Date()) return jsonError("Invitation expirée", 410);

  // Vérifier que l'email n'est pas déjà utilisé par un ForwarderUser
  const existing = await prisma.forwarderUser.findUnique({
    where: { email: invitation.email },
  });
  if (existing) {
    return jsonError("Un compte avec cet email existe déjà", 409);
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction(async (tx) => {
    // Créer le ForwarderUser
    await tx.forwarderUser.create({
      data: {
        forwarderId: invitation.forwarderId,
        email: invitation.email,
        firstName,
        lastName,
        passwordHash,
        role: invitation.role,
      },
    });

    // Marquer l'invitation comme acceptée
    await tx.forwarderInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
  });

  return jsonOk({ ok: true, email: invitation.email });
}
