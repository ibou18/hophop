import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import {
  requireForwarder,
  requireForwarderOrClient,
} from "@/lib/require-auth";
import { patchParcelSchema } from "@/lib/validations/parcel";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  ParcelStatus,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";
import {
  isForwarderPrivilegedRole,
  staffMayTransition,
} from "@/lib/parcel-status-workflow";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

function eventTypeForParcelStatus(
  status: ParcelStatus
): TrackingEventType | null {
  switch (status) {
    case "COLLECTED":
      return TrackingEventType.PARCEL_COLLECTED;
    case "IN_TRANSIT":
      return TrackingEventType.IN_TRANSIT;
    case "ARRIVED":
      return TrackingEventType.PARCEL_RECEIVED;
    case "READY":
      return TrackingEventType.PARCEL_READY;
    case "DELIVERED":
      return TrackingEventType.PARCEL_DELIVERED;
    case "ISSUE":
      return TrackingEventType.PARCEL_ISSUE;
    default:
      return null;
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const parcel = await prisma.parcel.findFirst({
    where:
      auth.role === "FORWARDER"
        ? { id, forwarderId: auth.forwarderId }
        : { id, clientId: auth.clientId },
    include: {
      items: true,
      recipient: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      shipment: true,
      trackingEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          actor: true,
          location: true,
          country: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });
  if (!parcel) return jsonError("Introuvable", 404);
  return jsonOk(parcel);
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
  const parsed = patchParcelSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const existing = await prisma.parcel.findFirst({
    where: { id, forwarderId: auth.forwarderId },
    include: { shipment: { select: { status: true } } },
  });
  if (!existing) return jsonError("Introuvable", 404);
  const data = parsed.data;
  const { status: newStatus, ...rest } = data;

  // ── Statut : collaborateurs = flux défini ; OWNER/ADMIN = corrections libres ─
  const privileged = isForwarderPrivilegedRole(auth.forwarderRole);
  if (newStatus !== undefined && newStatus !== existing.status) {
    if (!privileged) {
      if (!staffMayTransition(existing.status, newStatus)) {
        return jsonError(
          "Cette transition est réservée aux administrateurs du transitaire.",
          403,
        );
      }
      const shipmentStatus = existing.shipment?.status;
      if (
        newStatus === ParcelStatus.COLLECTED &&
        shipmentStatus !== undefined &&
        shipmentStatus !== null &&
        (
          ["IN_TRANSIT", "ARRIVED"] as const
        ).includes(shipmentStatus as "IN_TRANSIT" | "ARRIVED")
      ) {
        return jsonError(
          "Ce colis appartient à un envoi déjà parti. Modifie-le depuis la fiche de l'envoi.",
          422,
        );
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────
  const notifyIds: string[] = [];
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.parcel.update({
      where: { id },
      data: {
        ...rest,
        ...(newStatus !== undefined ? { status: newStatus } : {}),
      },
      include: { items: true, recipient: true, client: true },
    });
    if (newStatus !== undefined && newStatus !== existing.status) {
      const ev = eventTypeForParcelStatus(newStatus);
      if (ev) {
        await tx.trackingEvent.create({
          data: {
            parcelId: id,
            type: ev,
            actor: TrackingActor.FORWARDER,
            actorId: auth.forwarderId,
            shipmentId: p.shipmentId,
            scannedCode:
              newStatus === "DELIVERED" ? p.trackingCode : undefined,
          },
        });
      }
      if (newStatus === ParcelStatus.READY) {
        const nMail = await tx.notification.create({
          data: {
            parcelId: p.id,
            clientId: p.clientId,
            channel: NotificationChannel.EMAIL,
            type: NotificationType.PARCEL_READY,
            status: NotificationStatus.PENDING,
          },
        });
        notifyIds.push(nMail.id);
        const nSms = await tx.notification.create({
          data: {
            parcelId: p.id,
            clientId: p.clientId,
            channel: NotificationChannel.SMS,
            type: NotificationType.PARCEL_READY,
            status: NotificationStatus.PENDING,
          },
        });
        notifyIds.push(nSms.id);
        const nPush = await tx.notification.create({
          data: {
            parcelId: p.id,
            clientId: p.clientId,
            channel: NotificationChannel.PUSH,
            type: NotificationType.PARCEL_READY,
            status: NotificationStatus.PENDING,
          },
        });
        notifyIds.push(nPush.id);
      }
      if (newStatus === ParcelStatus.DELIVERED) {
        const ch = p.client.email
          ? NotificationChannel.EMAIL
          : NotificationChannel.SMS;
        const n = await tx.notification.create({
          data: {
            parcelId: p.id,
            clientId: p.clientId,
            channel: ch,
            type: NotificationType.PARCEL_DELIVERED,
            status: NotificationStatus.PENDING,
          },
        });
        notifyIds.push(n.id);
        const nPush = await tx.notification.create({
          data: {
            parcelId: p.id,
            clientId: p.clientId,
            channel: NotificationChannel.PUSH,
            type: NotificationType.PARCEL_DELIVERED,
            status: NotificationStatus.PENDING,
          },
        });
        notifyIds.push(nPush.id);
      }
    }
    return p;
  });
  scheduleNotificationDispatch(notifyIds);

  // Invalide le cache RSC du dashboard et de la liste des colis
  // pour que le prochain chargement reflète le nouveau statut immédiatement
  revalidatePath("/dashboard");
  revalidatePath("/parcels");

  return jsonOk(updated);
}
