import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarderOrClient } from "@/lib/require-auth";
import { registerExpoPushTokenSchema } from "@/lib/validations/push-token";

/**
 * Enregistre ou met à jour le jeton Expo de l’appareil (client ou transitaire).
 * À appeler après `getExpoPushTokenAsync()` côté Expo.
 */
export async function POST(req: Request) {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = registerExpoPushTokenSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const { token, platform } = parsed.data;

  const clientId = auth.role === "CLIENT" ? auth.clientId : null;
  const forwarderId = auth.role === "FORWARDER" ? auth.forwarderId : null;

  await prisma.expoPushToken.upsert({
    where: { token: token.trim() },
    create: {
      token: token.trim(),
      platform: platform ?? null,
      clientId,
      forwarderId,
    },
    update: {
      platform: platform ?? null,
      clientId,
      forwarderId,
      lastSeenAt: new Date(),
    },
  });

  return jsonOk({ ok: true });
}

/** Révoque un jeton (déconnexion, désactivation notifs). */
export async function DELETE(req: Request) {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = registerExpoPushTokenSchema
    .pick({ token: true })
    .safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const token = parsed.data.token.trim();

  const where =
    auth.role === "CLIENT"
      ? { token, clientId: auth.clientId }
      : { token, forwarderId: auth.forwarderId };

  await prisma.expoPushToken.deleteMany({ where });
  return jsonOk({ ok: true });
}
