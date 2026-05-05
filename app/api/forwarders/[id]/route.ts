import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder, requireForwarderAdmin } from "@/lib/require-auth";
import { patchForwarderSchema } from "@/lib/validations/forwarder";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (id !== auth.forwarderId) {
    return jsonError("Interdit", 403);
  }
  const forwarder = await prisma.forwarder.findUnique({
    where: { id },
    omit: { passwordHash: true },
  });
  if (!forwarder) return jsonError("Introuvable", 404);
  return jsonOk(forwarder);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireForwarderAdmin(); // STAFF ne peut pas modifier les paramètres agence
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (id !== auth.forwarderId) {
    return jsonError("Interdit", 403);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = patchForwarderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const forwarder = await prisma.forwarder.update({
    where: { id },
    data: parsed.data,
    omit: { passwordHash: true },
  });
  return jsonOk(forwarder);
}
