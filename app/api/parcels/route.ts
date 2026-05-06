import { prisma } from "@/lib/prisma";
import { generateTrackingCode } from "@/lib/codes";
import { jsonError, jsonOk } from "@/lib/http";
import {
  requireClient,
  requireForwarderOrClient,
} from "@/lib/require-auth";
import { apiLog, apiLogError } from "@/lib/server-api-log";
import { createParcelSchema } from "@/lib/validations/parcel";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";
import { clientJoinableShipmentWhere } from "@/lib/shipment-public-visibility";
import {
  vehicleTariffFromShipment,
  type PricingResult,
} from "@/lib/pricing";

export async function GET() {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;
  if (auth.role === "FORWARDER") {
    const parcels = await prisma.parcel.findMany({
      where: { forwarderId: auth.forwarderId },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: true,
        shipment: { select: { id: true, reference: true, status: true } },
      },
      take: 200,
    });
    return jsonOk(parcels);
  }
  const parcels = await prisma.parcel.findMany({
    where: { clientId: auth.clientId },
    orderBy: { createdAt: "desc" },
    include: {
      recipient: true,
      shipment: { select: { id: true, reference: true, status: true } },
    },
    take: 100,
  });
  return jsonOk(parcels);
}

export async function POST(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    apiLog("POST /api/parcels", "body_json_invalid");
    return jsonError("JSON invalide", 400);
  }
  const parsed = createParcelSchema.safeParse(body);
  if (!parsed.success) {
    apiLog("POST /api/parcels", "validation_failed", {
      clientId: auth.clientId,
      issues: parsed.error.flatten(),
    });
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;

  apiLog("POST /api/parcels", "create_start", {
    clientId: auth.clientId,
    forwarderId: data.forwarderId,
    recipientId: data.recipientId,
    itemsCount: data.items?.length ?? 0,
    isVehicle: !!data.vehicle,
    shipmentId: data.shipmentId,
  });

  // Vérifier que le client est bien lié à ce transitaire
  const link = await prisma.clientForwarder.findUnique({
    where: {
      clientId_forwarderId: { clientId: auth.clientId, forwarderId: data.forwarderId },
    },
  });
  if (!link) {
    apiLog("POST /api/parcels", "forwarder_link_missing", {
      clientId: auth.clientId,
      forwarderId: data.forwarderId,
    });
    return jsonError("Transitaire invalide", 403);
  }

  const clientRow = await prisma.client.findUnique({
    where: { id: auth.clientId },
    select: { email: true, phone: true },
  });
  const recipient = await prisma.recipient.findFirst({
    where: { id: data.recipientId, clientId: auth.clientId },
  });
  if (!recipient) {
    apiLog("POST /api/parcels", "recipient_invalid", {
      clientId: auth.clientId,
      recipientId: data.recipientId,
    });
    return jsonError("Destinataire invalide", 400);
  }

  let vehiclePricing: PricingResult | null = null;
  if (data.shipmentId && data.vehicle) {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: data.shipmentId,
        forwarderId: data.forwarderId,
        ...clientJoinableShipmentWhere(),
      },
      select: {
        acceptsVehicles: true,
        ratePerKg: true,
        ratePerBox: true,
        flatRate: true,
        ratePerVolume: true,
        ratePerVehicle: true,
        volumeDivisor: true,
        minimumCharge: true,
        currency: true,
        destinationCountry: true,
        transportMode: true,
      },
    });
    if (!shipment) {
      return jsonError(
        "Envoi introuvable ou plus disponible pour une déclaration.",
        400,
      );
    }
    if (!shipment.acceptsVehicles) {
      return jsonError("Cet envoi n'accepte pas les véhicules.", 422);
    }
    vehiclePricing = vehicleTariffFromShipment(shipment);
  }

  const resolvedPrice = vehiclePricing
    ? vehiclePricing.calculatedPrice
    : data.price ?? null;
  const resolvedCalculatedPrice = vehiclePricing
    ? vehiclePricing.calculatedPrice
    : null;
  const resolvedPricingType = vehiclePricing
    ? vehiclePricing.pricingType
    : null;
  const resolvedCurrency = vehiclePricing ? vehiclePricing.currency : undefined;

  let trackingCode = generateTrackingCode();
  for (let i = 0; i < 15; i++) {
    const clash = await prisma.parcel.findUnique({ where: { trackingCode } });
    if (!clash) break;
    trackingCode = generateTrackingCode();
  }
  let parcel;
  const notificationIds: string[] = [];
  try {
    parcel = await prisma.$transaction(async (tx) => {
      const p = await tx.parcel.create({
        data: {
          clientId: auth.clientId,
          forwarderId: data.forwarderId,
          recipientId: data.recipientId,
          trackingCode,
          weightKg: data.weightKg ?? null,
          lengthCm: data.lengthCm ?? null,
          widthCm: data.widthCm ?? null,
          heightCm: data.heightCm ?? null,
          description: data.description ?? (data.vehicle ? `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}` : null),
          declaredValue: data.declaredValue ?? null,
          price: resolvedPrice,
          ...(resolvedCalculatedPrice !== null
            ? { calculatedPrice: resolvedCalculatedPrice }
            : {}),
          ...(resolvedPricingType !== null
            ? { pricingType: resolvedPricingType }
            : {}),
          ...(resolvedCurrency !== undefined ? { currency: resolvedCurrency } : {}),
          items: data.items && data.items.length > 0 ? {
            create: data.items.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              category: it.category,
              weightKg: it.weightKg ?? null,
              notes: it.notes ?? null,
            })),
          } : undefined,
          vehicle: data.vehicle ? {
            create: {
              make:           data.vehicle.make,
              model:          data.vehicle.model,
              year:           data.vehicle.year,
              color:          data.vehicle.color ?? null,
              vin:            data.vehicle.vin ?? null,
              plate:          data.vehicle.plate ?? null,
              fuelType:       data.vehicle.fuelType,
              condition:      data.vehicle.condition,
              hasKeys:        data.vehicle.hasKeys,
              inspectionNote: data.vehicle.inspectionNote ?? null,
            },
          } : undefined,
        },
        include: { items: true, vehicle: true, recipient: true, images: true },
      });
      await tx.trackingEvent.create({
        data: {
          parcelId: p.id,
          type: TrackingEventType.PARCEL_DECLARED,
          actor: TrackingActor.CLIENT,
          actorId: auth.clientId,
        },
      });
      const channel = clientRow?.email
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;
      const nClient = await tx.notification.create({
        data: {
          parcelId: p.id,
          clientId: auth.clientId,
          channel,
          type: NotificationType.PARCEL_REGISTERED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(nClient.id);

      const nClientPush = await tx.notification.create({
        data: {
          parcelId: p.id,
          clientId: auth.clientId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.PARCEL_REGISTERED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(nClientPush.id);

      const nForwarder = await tx.notification.create({
        data: {
          parcelId: p.id,
          forwarderId: data.forwarderId,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.FORWARDER_NEW_PARCEL_DECLARED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(nForwarder.id);

      const nForwarderPush = await tx.notification.create({
        data: {
          parcelId: p.id,
          forwarderId: data.forwarderId,
          channel: NotificationChannel.PUSH,
          type: NotificationType.FORWARDER_NEW_PARCEL_DECLARED,
          status: NotificationStatus.PENDING,
        },
      });
      notificationIds.push(nForwarderPush.id);

      return p;
    });
  } catch (error) {
    apiLogError(
      "POST /api/parcels",
      "transaction_failed",
      error,
      { clientId: auth.clientId, trackingCode },
    );
    return jsonError("Erreur lors de la création du colis", 500);
  }

  apiLog("POST /api/parcels", "create_ok", {
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    clientId: auth.clientId,
  });
  scheduleNotificationDispatch(notificationIds);
  return jsonOk(parcel, 201);
}
