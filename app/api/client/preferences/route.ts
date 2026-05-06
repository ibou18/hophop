import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { z } from "zod";

const patchPreferencesSchema = z.object({
  locale: z.enum(["fr", "en"]).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export async function GET() {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  const client = await prisma.client.findUnique({
    where: { id: auth.clientId },
    select: { locale: true, timezone: true },
  });
  if (!client) return jsonError("Introuvable", 404);
  return jsonOk(client);
}

export async function PATCH(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = patchPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const client = await prisma.client.update({
    where: { id: auth.clientId },
    data: parsed.data,
    select: { locale: true, timezone: true },
  });
  return jsonOk(client);
}
