import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getDefaultFromAddress, getResendClient } from "@/lib/mail/resend";
import { ClientWelcomeEmail } from "@/emails/client-welcome";
import { toE164 } from "@/lib/phone-e164";
import { z } from "zod";
import type { Country } from "@/app/generated/prisma/enums";

const quickCreateSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Téléphone requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
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

  const parsed = quickCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }
  const data = parsed.data;

  const e164 = toE164(data.country as Country, data.phone);
  if (!e164) return jsonError("Numéro invalide pour ce pays", 422);

  const forwarder = await prisma.forwarder.findUnique({
    where: { id: auth.forwarderId },
    select: { name: true, code5: true, isActive: true },
  });
  if (!forwarder?.isActive) return jsonError("Transitaire introuvable", 404);

  const tempPassword = randomBytes(10).toString("base64url");
  const passwordHash = await hash(tempPassword, 12);

  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: e164,
          city: data.city,
          country: data.country as Country,
          authMethod: "EMAIL",
          passwordHash,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
          city: true,
        },
      });
      await tx.clientForwarder.create({
        data: { clientId: c.id, forwarderId: auth.forwarderId },
      });
      return c;
    });

    const base = getAppBaseUrl();
    const resend = getResendClient();
    if (resend) {
      try {
        const html = await render(
          ClientWelcomeEmail({
            firstName: client.firstName,
            dashboardUrl: `${base}/client/dashboard`,
            declareParcelUrl: `${base}/client/declare`,
            loginUrl: `${base}/login`,
            linkedForwarderName: forwarder.name,
            linkedForwarderCode5: forwarder.code5,
            linkedForwarderPublicUrl: `${base}/p/${forwarder.code5}`,
          }),
        );
        await resend.emails.send({
          from: getDefaultFromAddress(),
          to: data.email.toLowerCase(),
          subject: "Bienvenue sur Hophop — déclare ton premier colis",
          html,
        });
      } catch (e) {
        console.error("forwarder quick-create welcome email failed", e);
      }
    }

    return jsonOk({ ...client, recipients: [] }, 201);
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "P2002") return jsonError("Email ou téléphone déjà utilisé", 409);
    throw e;
  }
}
