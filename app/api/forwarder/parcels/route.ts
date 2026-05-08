import { prisma } from "@/lib/prisma";
import { generateTrackingCode } from "@/lib/codes";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { apiLog, apiLogError } from "@/lib/server-api-log";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";
import { z } from "zod";
import { toE164 } from "@/lib/phone-e164";
import type { Country } from "@/app/generated/prisma/enums";

const itemCategory = z.enum([
  "CLOTHING",
  "ELECTRONICS",
  "FOOD",
  "COSMETICS",
  "DOCUMENTS",
  "OTHER",
] as const);

const parcelItem = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  category: itemCategory.default("OTHER"),
});

const newRecipientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
});

const forwarderCreateParcelSchema = z.object({
  clientId: z.string().uuid(),
  shipmentId: z.string().uuid(),
  /** Destinataire existant (appartenant au client). */
  recipientId: z.string().uuid().optional(),
  /** Ou créer un nouveau destinataire à la volée. */
  newRecipient: newRecipientSchema.optional(),
  items: z.array(parcelItem).min(1, "Au moins un article requis"),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  description: z.string().optional(),
}).refine(
  (d) => d.recipientId || d.newRecipient,
  { message: "recipientId ou newRecipient requis", path: ["recipientId"] },
);

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = forwarderCreateParcelSchema.safeParse(body);
  if (!parsed.success) {
    apiLog("POST /api/forwarder/parcels", "validation_failed", {
      forwarderId: auth.forwarderId,
      issues: parsed.error.flatten(),
    });
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }
  const data = parsed.data;

  // Vérifier que le client est lié à ce transitaire
  const link = await prisma.clientForwarder.findUnique({
    where: {
      clientId_forwarderId: { clientId: data.clientId, forwarderId: auth.forwarderId },
    },
  });
  if (!link) return jsonError("Client introuvable ou non lié", 403);

  // Vérifier que le shipment appartient à ce transitaire
  const shipment = await prisma.shipment.findFirst({
    where: { id: data.shipmentId, forwarderId: auth.forwarderId },
    select: { id: true, status: true },
  });
  if (!shipment) return jsonError("Envoi introuvable", 404);
  if (["CLOSED"].includes(shipment.status)) {
    return jsonError("Cet envoi est clôturé", 422);
  }

  // Résoudre ou créer le destinataire
  let recipientId: string;
  if (data.recipientId) {
    const recipient = await prisma.recipient.findFirst({
      where: { id: data.recipientId, clientId: data.clientId },
    });
    if (!recipient) return jsonError("Destinataire invalide", 400);
    recipientId = recipient.id;
  } else {
    const nr = data.newRecipient!;
    const e164 = toE164(nr.country as Country, nr.phone);
    if (!e164) return jsonError("Numéro du destinataire invalide pour ce pays", 422);
    const created = await prisma.recipient.create({
      data: {
        clientId: data.clientId,
        firstName: nr.firstName,
        lastName: nr.lastName,
        phone: e164,
        city: nr.city,
        country: nr.country as Country,
        isDefault: false,
      },
    });
    recipientId = created.id;
  }

  const clientRow = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { email: true, phone: true },
  });

  let trackingCode = generateTrackingCode();
  for (let i = 0; i < 15; i++) {
    const clash = await prisma.parcel.findUnique({ where: { trackingCode } });
    if (!clash) break;
    trackingCode = generateTrackingCode();
  }

  const notificationIds: string[] = [];
  let parcel;
  try {
    parcel = await prisma.$transaction(async (tx) => {
      const p = await tx.parcel.create({
        data: {
          clientId: data.clientId,
          forwarderId: auth.forwarderId,
          recipientId,
          shipmentId: data.shipmentId,
          trackingCode,
          weightKg: data.weightKg ?? null,
          lengthCm: data.lengthCm ?? null,
          widthCm: data.widthCm ?? null,
          heightCm: data.heightCm ?? null,
          description: data.description ?? null,
          items: {
            create: data.items.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              category: it.category,
            })),
          },
        },
        include: { items: true, recipient: true },
      });

      await tx.trackingEvent.create({
        data: {
          parcelId: p.id,
          type: TrackingEventType.PARCEL_DECLARED,
          actor: TrackingActor.FORWARDER,
          actorId: auth.forwarderUserId,
          shipmentId: data.shipmentId,
        },
      });

      // Notifier le client
      const channel = clientRow?.email
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;
      const n1 = await tx.notification.create({
        data: {
          parcelId: p.id,
          clientId: data.clientId,
          channel,
          type: NotificationType.PARCEL_REGISTERED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(n1.id);
      const n2 = await tx.notification.create({
        data: {
          parcelId: p.id,
          clientId: data.clientId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.PARCEL_REGISTERED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(n2.id);

      return p;
    });
  } catch (error) {
    apiLogError("POST /api/forwarder/parcels", "transaction_failed", error, {
      forwarderId: auth.forwarderId,
      clientId: data.clientId,
      trackingCode,
    });
    return jsonError("Erreur lors de la création du colis", 500);
  }

  apiLog("POST /api/forwarder/parcels", "create_ok", {
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    forwarderId: auth.forwarderId,
    clientId: data.clientId,
  });

  scheduleNotificationDispatch(notificationIds);
  return jsonOk(parcel, 201);
}
