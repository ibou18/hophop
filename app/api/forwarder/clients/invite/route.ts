import { randomBytes } from "crypto";
import { render } from "@react-email/render";
import { ClientInvitationEmail } from "@/emails/client-invitation";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getDefaultFromAddress, getResendClient } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { z } from "zod";

const inviteClientSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  country: z.string().min(2, "Pays requis"),
  city: z.string().optional(),
  cityLatitude: z.number().finite().optional().nullable(),
  cityLongitude: z.number().finite().optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = inviteClientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;

  const forwarder = await prisma.forwarder.findUnique({
    where: { id: auth.forwarderId },
    select: { id: true, name: true, isActive: true },
  });
  if (!forwarder?.isActive) return jsonError("Transitaire inactif", 403);

  const email = data.email.toLowerCase().trim();

  // Si le client existe déjà, on le lie au forwarder et on renvoie
  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    await prisma.clientForwarder.upsert({
      where: { clientId_forwarderId: { clientId: existing.id, forwarderId: auth.forwarderId } },
      create: { clientId: existing.id, forwarderId: auth.forwarderId },
      update: {},
    });
    return jsonOk(
      {
        id: existing.id,
        alreadyExists: true,
        hasClaim: !existing.passwordHash && Boolean(existing.claimToken),
      },
      200,
    );
  }

  const claimToken = randomBytes(32).toString("hex");
  const claimTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
          phone: data.phone ?? null,
          city: data.city ?? null,
          cityLatitude: data.cityLatitude ?? null,
          cityLongitude: data.cityLongitude ?? null,
          country: data.country as never,
          authMethod: "EMAIL",
          passwordHash: null,
          claimToken,
          claimTokenExpiresAt,
          createdByForwarderId: auth.forwarderId,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      await tx.clientForwarder.create({
        data: { clientId: c.id, forwarderId: auth.forwarderId },
      });
      return c;
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
          to: email,
          subject: `${forwarder.name} vous a créé un compte sur Hophop`,
          html,
        });
      } catch (e) {
        console.error("❌ client invitation email failed", e);
      }
    }

    return jsonOk({ id: client.id, alreadyExists: false }, 201);
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return jsonError("Email ou téléphone déjà utilisé", 409);
    }
    throw e;
  }
}
