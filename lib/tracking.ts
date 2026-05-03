import type { Prisma } from "@/app/generated/prisma/client";
import type {
  Country,
  ParcelStatus,
  TrackingActor,
  TrackingEventType,
} from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function addParcelTrackingEvent(input: {
  parcelId: string;
  type: TrackingEventType;
  actor: TrackingActor;
  actorId?: string | null;
  location?: string | null;
  country?: Country | null;
  note?: string | null;
  internalNote?: string | null;
  shipmentId?: string | null;
  scannedCode?: string | null;
}) {
  return prisma.trackingEvent.create({
    data: {
      parcelId: input.parcelId,
      type: input.type,
      actor: input.actor,
      actorId: input.actorId ?? null,
      location: input.location ?? null,
      country: input.country ?? null,
      note: input.note ?? null,
      internalNote: input.internalNote ?? null,
      shipmentId: input.shipmentId ?? null,
      scannedCode: input.scannedCode ?? null,
    },
  });
}

export async function updateParcelStatus(
  parcelId: string,
  status: ParcelStatus,
  extra?: Prisma.ParcelUpdateInput
) {
  return prisma.parcel.update({
    where: { id: parcelId },
    data: { status, ...extra },
  });
}
