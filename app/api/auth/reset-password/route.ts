import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";

const postSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return jsonError("Token manquant", 400);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true, email: true },
  });

  if (!record || record.usedAt) return jsonError("Lien invalide ou déjà utilisé", 404);
  if (record.expiresAt < new Date()) return jsonError("Lien expiré", 410);

  return jsonOk({ email: record.email });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }

  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, email: true, userType: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt) return jsonError("Lien invalide ou déjà utilisé", 404);
  if (record.expiresAt < new Date()) return jsonError("Ce lien a expiré. Faites une nouvelle demande.", 410);

  const passwordHash = await hash(password, 12);

  if (record.userType === "FORWARDER_USER") {
    await prisma.forwarderUser.update({
      where: { email: record.email },
      data: { passwordHash },
    });
  } else {
    await prisma.client.updateMany({
      where: { email: record.email },
      data: { passwordHash },
    });
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return jsonOk({ ok: true });
}
