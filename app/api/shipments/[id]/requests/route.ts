import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient, requireForwarder } from "@/lib/require-auth";
import { clientJoinableShipmentWhere } from "@/lib/shipment-public-visibility";
import { calculatePrice, type ShipmentPricingFields } from "@/lib/pricing";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/shipments/[id]/requests
// Transitaire : voit toutes les demandes pour son envoi
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const shipment = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
  });
  if (!shipment) return jsonError("Envoi introuvable", 404);

  const requests = await prisma.shipmentRequest.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      parcel: {
        include: {
          items: { select: { name: true, quantity: true, category: true } },
          recipient: {
            select: {
              firstName: true,
              lastName: true,
              city: true,
              country: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      movedToShipment: { select: { id: true, reference: true } },
    },
  });

  return jsonOk(requests);
}

const createRequestSchema = z.object({
  parcelId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

// POST /api/shipments/[id]/requests
// Client : affecte le colis à l'envoi tout de suite (pas d'attente transitaire — il peut retirer le colis ensuite).
export async function POST(req: Request, ctx: Ctx) {
  const { id: shipmentId } = await ctx.params;
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation échouée", 422);

  const { parcelId, note } = parsed.data;

  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      ...clientJoinableShipmentWhere(),
      forwarder: {
        clients: { some: { clientId: auth.clientId } },
      },
    },
    select: {
      id: true,
      forwarderId: true,
      reference: true,
      destinationCountry: true,
      departureDate: true,
      originCountry: true,
      transportMode: true,
      acceptsVehicles: true,
      pricingType: true,
      ratePerKg: true,
      ratePerBox: true,
      flatRate: true,
      ratePerVolume: true,
      ratePerVehicle: true,
      volumeDivisor: true,
      minimumCharge: true,
      currency: true,
    },
  });
  if (!shipment) return jsonError("Envoi non disponible", 404);

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId: auth.clientId },
    include: {
      client: { select: { country: true, email: true, phone: true } },
      recipient: { select: { country: true } },
      vehicle: { select: { id: true } },
    },
  });
  if (!parcel) return jsonError("Colis introuvable", 404);
  if (parcel.shipmentId)
    return jsonError("Ce colis est déjà affecté à un envoi", 409);
  if (parcel.forwarderId !== shipment.forwarderId) {
    return jsonError(
      "Ce colis n'est pas géré par le transitaire de cet envoi",
      403,
    );
  }

  if (
    parcel.client.country !== shipment.originCountry ||
    parcel.recipient.country !== shipment.destinationCountry
  ) {
    return jsonError(
      "Ce colis ne correspond pas à la route de cet envoi (pays expéditeur / destinataire).",
      422,
    );
  }
  if (parcel.vehicle && !shipment.acceptsVehicles) {
    return jsonError(
      "Cet envoi n'accepte pas les véhicules : impossible d'affecter ce dossier.",
      422,
    );
  }

  const existing = await prisma.shipmentRequest.findUnique({
    where: { parcelId },
  });
  if (existing?.status === "PENDING") {
    return jsonError("Une demande est déjà en attente pour ce colis", 409);
  }

  const shipmentPricing: ShipmentPricingFields = {
    pricingType: shipment.pricingType,
    ratePerKg: shipment.ratePerKg,
    ratePerBox: shipment.ratePerBox,
    flatRate: shipment.flatRate,
    ratePerVolume: shipment.ratePerVolume,
    ratePerVehicle: shipment.ratePerVehicle,
    volumeDivisor: shipment.volumeDivisor,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
  };

  const priceResult = calculatePrice(shipmentPricing, {
    weightKg: parcel.weightKg,
    lengthCm: parcel.lengthCm,
    widthCm: parcel.widthCm,
    heightCm: parcel.heightCm,
    destinationCountry: shipment.destinationCountry,
    transportMode: shipment.transportMode,
  });

  const channel = parcel.client.email
    ? NotificationChannel.EMAIL
    : NotificationChannel.SMS;

  const { request, notifyIds } = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.shipmentRequest.delete({ where: { parcelId } });
    }

    await tx.parcel.update({
      where: { id: parcelId },
      data: {
        shipmentId,
        ...(priceResult
          ? {
              calculatedPrice: priceResult.calculatedPrice,
              pricingType: priceResult.pricingType,
              currency: priceResult.currency,
              ...(!parcel.price ? { price: priceResult.calculatedPrice } : {}),
            }
          : {}),
      },
    });

    await tx.trackingEvent.create({
      data: {
        parcelId,
        type: TrackingEventType.PARCEL_ASSIGNED,
        actor: TrackingActor.CLIENT,
        actorId: auth.clientId,
        shipmentId,
        note: "Affectation automatique à l'envoi, Veuillez contacter le transitaire.",
      },
    });

    const emailNotif = await tx.notification.create({
      data: {
        parcelId,
        clientId: auth.clientId,
        channel,
        type: NotificationType.SHIPMENT_REQUEST_ACCEPTED,
        status: NotificationStatus.PENDING,
      },
    });
    const pushNotif = await tx.notification.create({
      data: {
        parcelId,
        clientId: auth.clientId,
        channel: NotificationChannel.PUSH,
        type: NotificationType.SHIPMENT_REQUEST_ACCEPTED,
        status: NotificationStatus.PENDING,
      },
    });

    const created = await tx.shipmentRequest.create({
      data: {
        shipmentId,
        parcelId,
        clientId: auth.clientId,
        note: note ?? null,
        status: "ACCEPTED",
      },
      include: {
        shipment: {
          select: {
            id: true,
            reference: true,
            destinationCountry: true,
            departureDate: true,
          },
        },
      },
    });

    return { request: created, notifyIds: [emailNotif.id, pushNotif.id] };
  });

  scheduleNotificationDispatch(notifyIds);
  return jsonOk(request, 201);
}
