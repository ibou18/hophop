import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  ParcelStatus,
  ShipmentStatus,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const shipment = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
    include: { parcels: true },
  });
  if (!shipment) return jsonError("Introuvable", 404);
  if (shipment.status !== ShipmentStatus.IN_TRANSIT) {
    return jsonError("Envoi doit être en transit", 409);
  }
  const now = new Date();
  const notifyIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id },
      data: {
        status: ShipmentStatus.ARRIVED,
        arrivalDate: now,
      },
    });
    for (const parcel of shipment.parcels) {
      await tx.parcel.update({
        where: { id: parcel.id },
        data: { status: ParcelStatus.ARRIVED },
      });
      await tx.trackingEvent.create({
        data: {
          parcelId: parcel.id,
          type: TrackingEventType.SHIPMENT_ARRIVED,
          actor: TrackingActor.FORWARDER,
          actorId: auth.forwarderId,
          shipmentId: id,
        },
      });
      const n1 = await tx.notification.create({
        data: {
          parcelId: parcel.id,
          clientId: parcel.clientId,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.SHIPMENT_ARRIVED,
          status: NotificationStatus.PENDING,
        },
      });
      notifyIds.push(n1.id);
      const n2 = await tx.notification.create({
        data: {
          parcelId: parcel.id,
          clientId: parcel.clientId,
          channel: NotificationChannel.SMS,
          type: NotificationType.SHIPMENT_ARRIVED,
          status: NotificationStatus.PENDING,
        },
      });
      notifyIds.push(n2.id);
      const n3 = await tx.notification.create({
        data: {
          parcelId: parcel.id,
          clientId: parcel.clientId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.SHIPMENT_ARRIVED,
          status: NotificationStatus.PENDING,
        },
      });
      notifyIds.push(n3.id);
    }
  });
  scheduleNotificationDispatch(notifyIds);
  return jsonOk({ ok: true });
}
