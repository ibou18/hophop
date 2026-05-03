import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { patchShipmentSchema } from "@/lib/validations/shipment";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const shipment = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
    include: {
      parcels: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          recipient: true,
        },
      },
    },
  });
  if (!shipment) return jsonError("Introuvable", 404);
  return jsonOk(shipment);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = patchShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const existing = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
  });
  if (!existing) return jsonError("Introuvable", 404);
  const shipment = await prisma.shipment.update({
    where: { id },
    data: parsed.data,
  });
  return jsonOk(shipment);
}
