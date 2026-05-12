import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { patchShipmentParcelsSchema } from "@/lib/validations/shipment";
import { ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";
import { TrackingActor, TrackingEventType } from "@/app/generated/prisma/enums";
import { calculatePrice } from "@/lib/pricing";
import type { ShipmentPricingFields } from "@/lib/pricing";

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
        forwarderId: auth.forwarderId,
        status: ParcelStatus.COLLECTED,
        shipmentId: null,
      },
      include: {
        vehicle: { select: { id: true } },
        drum: { select: { id: true, size: true } },
        sizedCarton: { select: { id: true, size: true } },
        client: { select: { country: true } },
        recipient: { select: { country: true } },
      },
    });
    if (parcels.length !== parcelIds.length) {
      return jsonError(
        "Colis invalides (statut Collecté, même transitaire, non déjà affectés à un envoi)",
        400,
      );
    }

    for (const p of parcels) {
      if (
        p.client.country !== shipment.originCountry ||
        p.recipient.country !== shipment.destinationCountry
      ) {
        return jsonError(
          "Ce colis ne correspond pas à la route de cet envoi (pays expéditeur / destinataire).",
          422,
        );
      }
      if (p.vehicle && !shipment.acceptsVehicles) {
        return jsonError(
          "Cet envoi n’accepte pas les véhicules : impossible d’affecter ce dossier.",
          422,
        );
      }
      if (p.drum && !shipment.acceptsDrums) {
        return jsonError(
          "Cet envoi n’accepte pas les fûts : impossible d’affecter ce dossier.",
          422,
        );
      }
      if (p.sizedCarton && !shipment.acceptsSizedCartons) {
        return jsonError(
          "Cet envoi n’accepte pas les cartons par taille : impossible d’affecter ce dossier.",
          422,
        );
      }
    }

    // ── Résolution du prix par colis via la tarification du shipment ─────────
    const shipmentPricing: ShipmentPricingFields = {
      pricingType: shipment.pricingType,
      ratePerKg: shipment.ratePerKg,
      ratePerBox: shipment.ratePerBox,
      flatRate: shipment.flatRate,
      ratePerVolume: shipment.ratePerVolume,
      ratePerVehicle: shipment.ratePerVehicle,
      rateDrumSmall: shipment.rateDrumSmall,
      rateDrumMedium: shipment.rateDrumMedium,
      rateDrumLarge: shipment.rateDrumLarge,
      rateCartonSmall: shipment.rateCartonSmall,
      rateCartonMedium: shipment.rateCartonMedium,
      rateCartonLarge: shipment.rateCartonLarge,
      volumeDivisor: shipment.volumeDivisor,
      minimumCharge: shipment.minimumCharge,
      currency: shipment.currency,
    };

    await prisma.$transaction(async (tx) => {
      for (const parcel of parcels) {
        const pricingInput = {
          weightKg: parcel.weightKg,
          lengthCm: parcel.lengthCm,
          widthCm: parcel.widthCm,
          heightCm: parcel.heightCm,
          drumSize: parcel.drum?.size ?? null,
          cartonSize: parcel.sizedCarton?.size ?? null,
          destinationCountry: shipment.destinationCountry,
          transportMode: shipment.transportMode,
        };

        const priceResult = calculatePrice(shipmentPricing, pricingInput);

        await tx.parcel.update({
          where: { id: parcel.id },
          data: {
            shipmentId,
            // Mise à jour du prix calculé si on a pu résoudre un tarif
            ...(priceResult
              ? {
                  calculatedPrice: priceResult.calculatedPrice,
                  pricingType: priceResult.pricingType,
                  currency: priceResult.currency,
                  // Ne pas écraser un prix manuel déjà saisi
                  ...(!parcel.price ? { price: priceResult.calculatedPrice } : {}),
                }
              : {}),
          },
        });
        await tx.trackingEvent.create({
          data: {
            parcelId: parcel.id,
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

  // ── Désassignation ───────────────────────────────────────────────────────
  const toClear = await prisma.parcel.findMany({
    where: {
      id: { in: parcelIds },
      shipmentId,
      forwarderId: auth.forwarderId,
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
