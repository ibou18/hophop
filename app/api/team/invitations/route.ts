import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarderAdmin } from "@/lib/require-auth";
import { createInvitationSchema } from "@/lib/validations/team";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getResendClient, getDefaultFromAddress } from "@/lib/mail/resend";
import { render } from "@react-email/render";
import { ForwarderInvitationEmail } from "@/emails/forwarder-invitation";

/** GET /api/team/invitations — liste les invitations en attente */
export async function GET() {
  const ctx = await requireForwarderAdmin();
  if (ctx instanceof Response) return ctx;

  const invitations = await prisma.forwarderInvitation.findMany({
    where: {
      forwarderId: ctx.forwarderId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return jsonOk(invitations);
}

/** POST /api/team/invitations — créer et envoyer une invitation */
export async function POST(req: Request) {
  const ctx = await requireForwarderAdmin();
  if (ctx instanceof Response) return ctx;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }
  const { email, role } = parsed.data;

  // Vérifier que l'email n'est pas déjà membre
  const alreadyMember = await prisma.forwarderUser.findFirst({
    where: { forwarderId: ctx.forwarderId, email: email.toLowerCase() },
  });
  if (alreadyMember) {
    return jsonError("Cette personne est déjà membre de l'équipe", 409);
  }

  // Annuler une éventuelle invitation précédente non expirée
  await prisma.forwarderInvitation.updateMany({
    where: {
      forwarderId: ctx.forwarderId,
      email: email.toLowerCase(),
      acceptedAt: null,
    },
    data: { expiresAt: new Date() }, // expire immédiatement
  });

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h

  const invitation = await prisma.forwarderInvitation.create({
    data: {
      forwarderId: ctx.forwarderId,
      invitedById: ctx.forwarderUserId,
      email: email.toLowerCase(),
      role,
      expiresAt,
    },
    include: {
      forwarder: { select: { name: true } },
      invitedBy: { select: { firstName: true, lastName: true } },
    },
  });

  // Envoyer l'email d'invitation
  const resend = getResendClient();
  if (resend) {
    const inviteUrl = `${getAppBaseUrl()}/invitation/${invitation.token}`;
    const html = await render(
      ForwarderInvitationEmail({
        forwarderName: invitation.forwarder.name,
        inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
        role,
        inviteUrl,
        expiresInHours: 48,
      })
    );
    await resend.emails.send({
      from: getDefaultFromAddress(),
      to: email,
      subject: `Invitation à rejoindre ${invitation.forwarder.name} sur Hophop`,
      html,
    });
  }

  return jsonOk({ id: invitation.id, email: invitation.email, role: invitation.role }, 201);
}
