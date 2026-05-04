import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { z } from "zod";
import {
  TrackingActor,
  TrackingEventType,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";

type Ctx = { params: Promise<{ id: string; parcelId: string }> };

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept"),
    forwarderNote: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    forwarderNote: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("move"),
    targetShipmentId: z.string().uuid(),
    forwarderNote: z.string().max(500).optional(),
  }),
]);

// PATCH /api/shipments/[id]/requests/[parcelId]
// Transitaire : accepte, refuse ou déplace un colis sur un autre envoi
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: shipmentId, parcelId } = await ctx.params;
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  // Vérifier que l'envoi appartient au transitaire
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, forwarderId: auth.forwarderId },
  });
  if (!shipment) return jsonError("Envoi introuvable", 404);

  const request = await prisma.shipmentRequest.findFirst({
    where: { shipmentId, parcelId },
    include: { client: { select: { email: true, phone: true } } },
  });
  if (!request) return jsonError("Demande introuvable", 404);
  if (request.status !== "PENDING") return jsonError("Cette demande a déjà été traitée", 409);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Action invalide", 422);

  const data = parsed.data;

  if (data.action === "accept") {
    const { updated, notifyIds } = await prisma.$transaction(async (tx) => {
      await tx.parcel.update({
        where: { id: parcelId },
        data: { shipmentId },
      });

      await tx.trackingEvent.create({
        data: {
          parcelId,
          type: TrackingEventType.PARCEL_ASSIGNED,
          actor: TrackingActor.FORWARDER,
          actorId: auth.forwarderId,
          shipmentId,
          note: data.forwarderNote ?? null,
        },
      });

      const channel = request.client.email
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;
      const created = await tx.notification.create({
        data: {
          parcelId,
          clientId: request.clientId,
          channel,
          type: NotificationType.SHIPMENT_REQUEST_ACCEPTED,
          status: NotificationStatus.PENDING,
        },
      });
      const push = await tx.notification.create({
        data: {
          parcelId,
          clientId: request.clientId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.SHIPMENT_REQUEST_ACCEPTED,
          status: NotificationStatus.PENDING,
        },
      });

      const updated = await tx.shipmentRequest.update({
        where: { parcelId },
        data: {
          status: "ACCEPTED",
          forwarderNote: data.forwarderNote ?? null,
        },
      });
      return { updated, notifyIds: [created.id, push.id] };
    });
    scheduleNotificationDispatch(notifyIds);
    return jsonOk(updated);
  }

  if (data.action === "reject") {
    const { updated, notifyIds } = await prisma.$transaction(async (tx) => {
      const channel = request.client.email
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;
      const created = await tx.notification.create({
        data: {
          parcelId,
          clientId: request.clientId,
          channel,
          type: NotificationType.SHIPMENT_REQUEST_REJECTED,
          status: NotificationStatus.PENDING,
        },
      });
      const push = await tx.notification.create({
        data: {
          parcelId,
          clientId: request.clientId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.SHIPMENT_REQUEST_REJECTED,
          status: NotificationStatus.PENDING,
        },
      });

      const updated = await tx.shipmentRequest.update({
        where: { parcelId },
        data: {
          status: "REJECTED",
          forwarderNote: data.forwarderNote ?? null,
        },
      });
      return { updated, notifyIds: [created.id, push.id] };
    });
    scheduleNotificationDispatch(notifyIds);
    return jsonOk(updated);
  }

  // action === "move"
  const targetShipment = await prisma.shipment.findFirst({
    where: { id: data.targetShipmentId, forwarderId: auth.forwarderId },
  });
  if (!targetShipment) return jsonError("Envoi cible introuvable", 404);

  const updated = await prisma.$transaction(async (tx) => {
    // Affecter le colis à l'envoi cible
    await tx.parcel.update({
      where: { id: parcelId },
      data: { shipmentId: data.targetShipmentId },
    });

    await tx.trackingEvent.create({
      data: {
        parcelId,
        type: TrackingEventType.PARCEL_ASSIGNED,
        actor: TrackingActor.FORWARDER,
        actorId: auth.forwarderId,
        shipmentId: data.targetShipmentId,
        note: data.forwarderNote ?? `Déplacé vers l'envoi ${targetShipment.reference}`,
      },
    });

    return tx.shipmentRequest.update({
      where: { parcelId },
      data: {
        status: "MOVED",
        forwarderNote: data.forwarderNote ?? null,
        movedToShipmentId: data.targetShipmentId,
      },
    });
  });
  return jsonOk(updated);
}
