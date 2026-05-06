import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { patchShipmentSchema } from "@/lib/validations/shipment";
import { ShipmentStatus } from "@/app/generated/prisma/enums";

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

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;

  const existing = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
    include: { _count: { select: { parcels: true } } },
  });
  if (!existing) return jsonError("Introuvable", 404);
  if (existing.status !== ShipmentStatus.DRAFT) {
    return jsonError(
      "Seul un envoi en brouillon peut être supprimé.",
      409,
    );
  }
  if (existing._count.parcels > 0) {
    return jsonError(
      "Retire tous les colis de cet envoi avant de le supprimer (désassignation ou refus des colis selon le cas).",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.shipmentRequest.deleteMany({ where: { shipmentId: id } });
    await tx.shipment.delete({ where: { id } });
  });
  return jsonOk({ ok: true }, 200);
}
