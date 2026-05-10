import { z } from "zod";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { getResendClient, getDefaultFromAddress } from "@/lib/mail/resend";
import { PasswordResetEmail } from "@/emails/password-reset";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Email invalide", 422);
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Chercher dans ForwarderUser d'abord, puis Client
  const fwUser = await prisma.forwarderUser.findUnique({
    where: { email },
    select: { id: true, firstName: true, isActive: true },
  });

  const client = !fwUser
    ? await prisma.client.findFirst({
        where: { email, isActive: true },
        select: { id: true, firstName: true, passwordHash: true },
      })
    : null;

  // Toujours répondre OK pour ne pas révéler si l'email existe
  if (!fwUser && !client) {
    return jsonOk({ ok: true });
  }

  // Ne pas envoyer si le client n'a pas encore activé son compte
  if (client && !client.passwordHash) {
    return jsonOk({ ok: true });
  }

  const userType = fwUser ? ("FORWARDER_USER" as const) : ("CLIENT" as const);
  const firstName = fwUser ? fwUser.firstName : (client?.firstName ?? "");

  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Invalider les tokens précédents non utilisés
  await prisma.passwordResetToken.updateMany({
    where: { email, userType, usedAt: null },
    data: { usedAt: new Date() },
  });

  const resetToken = await prisma.passwordResetToken.create({
    data: { email, userType, expiresAt },
    select: { token: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken.token}`;

  const resend = getResendClient();
  if (resend) {
    const html = await render(PasswordResetEmail({ firstName, resetUrl }));
    await resend.emails.send({
      from: getDefaultFromAddress(),
      to: email,
      subject: "Réinitialisation de votre mot de passe Hophop",
      html,
    });
  }

  return jsonOk({ ok: true });
}
