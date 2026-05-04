import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder, requireClient } from "@/lib/require-auth";
import { z } from "zod";

const patchClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asForwarder = await requireForwarder();
  if (!(asForwarder instanceof Response)) {
    const client = await prisma.client.findFirst({
      where: {
        id,
        forwarders: { some: { forwarderId: asForwarder.forwarderId } },
      },
      omit: { passwordHash: true, otpSecret: true },
    });
    if (!client) return jsonError("Introuvable", 404);
    return jsonOk(client);
  }
  const asClient = await requireClient();
  if (asClient instanceof Response) return jsonError("Non autorisé", 401);
  if (id !== asClient.clientId) {
    return jsonError("Interdit", 403);
  }
  const client = await prisma.client.findUnique({
    where: { id },
    omit: { passwordHash: true, otpSecret: true },
  });
  if (!client) return jsonError("Introuvable", 404);
  return jsonOk(client);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const asClient = await requireClient();
  if (asClient instanceof Response) return asClient;
  const { id } = await ctx.params;
  if (id !== asClient.clientId) {
    return jsonError("Interdit", 403);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = patchClientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = { ...parsed.data };
  if (data.email) data.email = data.email.toLowerCase();
  try {
    const client = await prisma.client.update({
      where: { id },
      data,
      omit: { passwordHash: true, otpSecret: true },
    });
    return jsonOk(client);
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
