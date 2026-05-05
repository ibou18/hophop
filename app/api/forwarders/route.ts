import { render } from "@react-email/render";
import { hash } from "bcryptjs";
import { ForwarderWelcomeEmail } from "@/emails/forwarder-welcome";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { getDefaultFromAddress, getResendClient } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { generateCode5 } from "@/lib/codes";
import { jsonError, jsonOk } from "@/lib/http";
import { createForwarderSchema } from "@/lib/validations/forwarder";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code5 = searchParams.get("code5")?.trim();
  if (!code5 || !/^\d{5}$/.test(code5)) {
    return jsonError("Paramètre code5 requis (5 chiffres)", 400);
  }
  const forwarder = await prisma.forwarder.findFirst({
    where: { code5, isActive: true },
    select: {
      id: true,
      code5: true,
      name: true,
      logoUrl: true,
      country: true,
      city: true,
      paymentEnabled: true,
    },
  });
  if (!forwarder) {
    return jsonError("Transitaire introuvable", 404);
  }
  return jsonOk(forwarder);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createForwarderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();
  const existing = await prisma.forwarder.findUnique({ where: { email } });
  if (existing) {
    return jsonError("Email déjà utilisé", 409);
  }
  let code5 = generateCode5();
  for (let i = 0; i < 10; i++) {
    const clash = await prisma.forwarder.findUnique({ where: { code5 } });
    if (!clash) break;
    code5 = generateCode5();
  }
  const passwordHash = await hash(data.password, 12);

  // Découper le nom pour créer l'OWNER
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? data.name;
  const lastName = nameParts.slice(1).join(" ") || "—";

  // Transaction : créer Forwarder + ForwarderUser OWNER en une seule opération
  const forwarder = await prisma.$transaction(async (tx) => {
    const fw = await tx.forwarder.create({
      data: {
        code5,
        name: data.name,
        email,
        phone: data.phone ?? null,
        country: data.country,
        city: data.city,
        address: data.address ?? null,
        description: data.description ?? null,
        passwordHash,
      },
      select: {
        id: true,
        code5: true,
        name: true,
        email: true,
        country: true,
        city: true,
        createdAt: true,
      },
    });

    // Créer automatiquement le ForwarderUser OWNER
    await tx.forwarderUser.create({
      data: {
        forwarderId: fw.id,
        email,
        firstName,
        lastName,
        passwordHash,
        role: "OWNER",
      },
    });

    return fw;
  });

  const base = getAppBaseUrl();
  const resend = getResendClient();
  if (resend) {
    try {
      const html = await render(
        ForwarderWelcomeEmail({
          firstName,
          forwarderName: forwarder.name,
          code5: forwarder.code5,
          loginUrl: `${base}/login`,
          dashboardUrl: `${base}/dashboard`,
          newShipmentUrl: `${base}/shipments/new`,
          publicProfileUrl: `${base}/p/${forwarder.code5}`,
        })
      );
      await resend.emails.send({
        from: getDefaultFromAddress(),
        to: email,
        subject:
          "Bienvenue sur Hophop — crée ton premier envoi (demandes en attente possibles)",
        html,
      });
    } catch (e) {
      console.error("forwarder welcome email failed", e);
    }
  }

  return jsonOk(forwarder, 201);
}
