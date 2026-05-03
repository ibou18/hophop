import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { patchShipmentParcelsSchema } from "@/lib/validations/shipment";
import { ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";
import { TrackingActor, TrackingEventType } from "@/app/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id: shipmentId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = patchShipmentParcelsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const { parcelIds, action } = parsed.data;
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, forwarderId: auth.forwarderId },
  });
  if (!shipment) return jsonError("Envoi introuvable", 404);
  if (
    shipment.status !== ShipmentStatus.DRAFT &&
    shipment.status !== ShipmentStatus.CONFIRMED
  ) {
    return jsonError("Envoi non modifiable (statut)", 409);
  }
  if (action === "assign") {
    const parcels = await prisma.parcel.findMany({
      where: {
        id: { in: parcelIds },
        client: { forwarderId: auth.forwarderId },
        status: ParcelStatus.COLLECTED,
      },
    });
    if (parcels.length !== parcelIds.length) {
      return jsonError("Colis invalides (doivent être COLLECTED, même transitaire)", 400);
    }
    await prisma.$transaction(async (tx) => {
      for (const pid of parcelIds) {
        await tx.parcel.update({
          where: { id: pid },
          data: { shipmentId },
        });
        await tx.trackingEvent.create({
          data: {
            parcelId: pid,
            type: TrackingEventType.PARCEL_ASSIGNED,
            actor: TrackingActor.FORWARDER,
            actorId: auth.forwarderId,
            shipmentId,
          },
        });
      }
    });
    return jsonOk({ ok: true, assigned: parcelIds.length });
  }
  const toClear = await prisma.parcel.findMany({
    where: {
      id: { in: parcelIds },
      shipmentId,
      client: { forwarderId: auth.forwarderId },
    },
  });
  if (toClear.length !== parcelIds.length) {
    return jsonError("Colis invalides pour cet envoi", 400);
  }
  await prisma.$transaction(async (tx) => {
    for (const p of toClear) {
      await tx.parcel.update({
        where: { id: p.id },
        data: { shipmentId: null },
      });
      await tx.trackingEvent.create({
        data: {
          parcelId: p.id,
          type: TrackingEventType.PARCEL_UNASSIGNED,
          actor: TrackingActor.FORWARDER,
          actorId: auth.forwarderId,
          shipmentId,
        },
      });
    }
  });
  return jsonOk({ ok: true, unassigned: parcelIds.length });
}
