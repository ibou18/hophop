import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

const claimSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const { token, password } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { claimToken: token },
    select: {
      id: true,
      claimTokenExpiresAt: true,
      passwordHash: true,
    },
  });

  if (!client) {
    return jsonError("Lien d'activation invalide ou déjà utilisé.", 404);
  }
  if (client.claimTokenExpiresAt && client.claimTokenExpiresAt < new Date()) {
    return jsonError("Ce lien d'activation a expiré. Contactez votre transitaire pour en obtenir un nouveau.", 410);
  }
  if (client.passwordHash) {
    return jsonError("Ce compte est déjà activé. Connectez-vous directement.", 409);
  }

  const passwordHash = await hash(password, 12);

  await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash,
      claimToken: null,
      claimTokenExpiresAt: null,
    },
  });

  return jsonOk({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return jsonError("Token manquant", 400);

  const client = await prisma.client.findUnique({
    where: { claimToken: token },
    select: {
      id: true,
      firstName: true,
      email: true,
      claimTokenExpiresAt: true,
      passwordHash: true,
    },
  });

  if (!client) return jsonError("Lien invalide ou déjà utilisé", 404);
  if (client.claimTokenExpiresAt && client.claimTokenExpiresAt < new Date()) {
    return jsonError("Lien expiré", 410);
  }
  if (client.passwordHash) return jsonError("Compte déjà activé", 409);

  return jsonOk({
    firstName: client.firstName,
    email: client.email,
  });
}
