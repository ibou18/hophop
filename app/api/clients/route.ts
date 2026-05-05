import { render } from "@react-email/render";
import { hash } from "bcryptjs";
import { ClientWelcomeEmail } from "@/emails/client-welcome";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getDefaultFromAddress, getResendClient } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { createClientSchema } from "@/lib/validations/client";

export async function GET() {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const clients = await prisma.client.findMany({
    where: {
      forwarders: { some: { forwarderId: auth.forwarderId } },
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      authMethod: true,
      createdAt: true,
    },
  });
  return jsonOk(clients);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  let forwarderId: string | null = null;
  let linkedForwarderName: string | null = null;
  let linkedForwarderCode5: string | null = null;
  if (data.code5) {
    const forwarder = await prisma.forwarder.findUnique({
      where: { code5: data.code5 },
      select: { id: true, isActive: true, name: true, code5: true },
    });
    if (!forwarder?.isActive) {
      return jsonError("Code transitaire invalide", 404);
    }
    forwarderId = forwarder.id;
    linkedForwarderName = forwarder.name;
    linkedForwarderCode5 = forwarder.code5;
  }
  const passwordHash = await hash(data.password, 12);
  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          address: data.address ?? null,
          city: data.city ?? null,
          country: data.country,
          authMethod: data.authMethod,
          passwordHash,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
          authMethod: true,
          createdAt: true,
        },
      });
      if (forwarderId) {
        await tx.clientForwarder.create({
          data: { clientId: c.id, forwarderId },
        });
      }
      return c;
    });
    const base = getAppBaseUrl();
    const resend = getResendClient();
    if (resend) {
      try {
        const linkedForwarderPublicUrl = linkedForwarderCode5
          ? `${base}/p/${linkedForwarderCode5}`
          : null;
        const html = await render(
          ClientWelcomeEmail({
            firstName: client.firstName,
            dashboardUrl: `${base}/client/dashboard`,
            declareParcelUrl: `${base}/client/declare`,
            loginUrl: `${base}/login`,
            linkedForwarderName,
            linkedForwarderCode5,
            linkedForwarderPublicUrl,
          }),
        );
        await resend.emails.send({
          from: getDefaultFromAddress(),
          to: data.email.toLowerCase(),
          subject: "Bienvenue sur Hophop — déclare ton premier colis",
          html,
        });
      } catch (e) {
        console.error("client welcome email failed", e);
      }
    }

    return jsonOk(client, 201);
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
