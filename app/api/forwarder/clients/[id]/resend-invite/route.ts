import { randomBytes } from "crypto";
import { render } from "@react-email/render";
import { ClientInvitationEmail } from "@/emails/client-invitation";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getDefaultFromAddress, getResendClient } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { id: clientId } = await params;

  const [client, forwarder] = await Promise.all([
    prisma.client.findFirst({
      where: {
        id: clientId,
        forwarders: { some: { forwarderId: auth.forwarderId } },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        passwordHash: true,
      },
    }),
    prisma.forwarder.findUnique({
      where: { id: auth.forwarderId },
      select: { name: true },
    }),
  ]);

  if (!client) return jsonError("Client introuvable", 404);
  if (!forwarder) return jsonError("Transitaire introuvable", 404);

  if (client.passwordHash) {
    return jsonError(
      "Ce client a déjà défini son mot de passe. L'invitation n'est plus nécessaire.",
      409,
    );
  }
  if (!client.email) {
    return jsonError(
      "Ce client n'a pas d'adresse email. Impossible d'envoyer l'invitation.",
      422,
    );
  }

  const claimToken = randomBytes(32).toString("hex");
  const claimTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.client.update({
    where: { id: clientId },
    data: { claimToken, claimTokenExpiresAt },
  });

  const base = getAppBaseUrl();
  const claimUrl = `${base}/register/claim?token=${claimToken}`;
  const resend = getResendClient();
  if (resend) {
    try {
      const html = await render(
        ClientInvitationEmail({
          firstName: client.firstName,
          forwarderName: forwarder.name,
          claimUrl,
        }),
      );
      await resend.emails.send({
        from: getDefaultFromAddress(),
        to: client.email,
        subject: `${forwarder.name} vous a envoyé une invitation Hophop`,
        html,
      });
    } catch (e) {
      console.error("❌ resend invite email failed", e);
      return jsonError("Erreur d'envoi de l'email", 500);
    }
  }

  return jsonOk({ ok: true });
}
