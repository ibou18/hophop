import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { ParcelStatus } from "@/app/generated/prisma/enums";
import {
  clientJoinableShipmentWhere,
  publicVitrineShipmentWhere,
} from "@/lib/shipment-public-visibility";

const parcelInclude = {
  recipient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      city: true,
      country: true,
      phone: true,
    },
  },
  shipment: { select: { id: true, reference: true, status: true, destinationCountry: true } },
  items: { select: { id: true, name: true, quantity: true, category: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, sortOrder: true },
  },
} satisfies Prisma.ParcelInclude;

export type ClientParcelRow = Prisma.ParcelGetPayload<{
  include: typeof parcelInclude;
}>;

const ACTIVE_STATUSES: ParcelStatus[] = [
  ParcelStatus.DECLARED,
  ParcelStatus.COLLECTED,
  ParcelStatus.IN_TRANSIT,
  ParcelStatus.ARRIVED,
  ParcelStatus.READY,
];

export async function getClientDashboardData(clientId: string) {
  const [activeParcels, recentParcels, recipientsCount] = await Promise.all([
    prisma.parcel.count({
      where: { clientId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.parcel.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: parcelInclude,
    }),
    prisma.recipient.count({ where: { clientId } }),
  ]);

  return { activeParcels, recentParcels, recipientsCount };
}

export async function getClientParcels(clientId: string) {
  return prisma.parcel.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: parcelInclude,
  });
}

export async function getClientParcelDetail(clientId: string, parcelId: string) {
  return prisma.parcel.findFirst({
    where: { id: parcelId, clientId },
    include: {
      ...parcelInclude,
      trackingEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          location: true,
          country: true,
          note: true,
          createdAt: true,
        },
      },
      payment: true,
      shipmentRequest: {
        select: {
          id: true,
          status: true,
          note: true,
          forwarderNote: true,
          shipmentId: true,
          movedToShipmentId: true,
          movedToShipment: { select: { id: true, reference: true } },
          createdAt: true,
        },
      },
    },
  });
}

const joinShipmentSelect = {
  id: true,
  reference: true,
  destinationCountry: true,
  destinationCity: true,
  departureDate: true,
  status: true,
} satisfies Prisma.ShipmentSelect;

export type AvailableShipmentRow = Prisma.ShipmentGetPayload<{
  select: typeof joinShipmentSelect;
}>;

/**
 * Envois publiés du même transitaire que le colis (pour « Rejoindre un envoi »).
 * Ne dépend plus du seul lien ClientForwarder : on filtre par `parcel.forwarderId`.
 */
export async function getParcelShipmentJoinData(
  clientId: string,
  parcelId: string,
): Promise<{
  shipments: AvailableShipmentRow[];
  isLinkedToForwarder: boolean;
  forwarderCode5: string | null;
  forwarderName: string | null;
}> {
  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId },
    select: { forwarderId: true },
  });
  if (!parcel) {
    return {
      shipments: [],
      isLinkedToForwarder: false,
      forwarderCode5: null,
      forwarderName: null,
    };
  }

  const [shipments, link, fwd] = await Promise.all([
    prisma.shipment.findMany({
      where: {
        forwarderId: parcel.forwarderId,
        ...clientJoinableShipmentWhere(),
      },
      orderBy: { departureDate: "asc" },
      select: joinShipmentSelect,
    }),
    prisma.clientForwarder.findUnique({
      where: {
        clientId_forwarderId: {
          clientId,
          forwarderId: parcel.forwarderId,
        },
      },
    }),
    prisma.forwarder.findUnique({
      where: { id: parcel.forwarderId },
      select: { code5: true, name: true },
    }),
  ]);

  return {
    shipments,
    isLinkedToForwarder: !!link,
    forwarderCode5: fwd?.code5 ?? null,
    forwarderName: fwd?.name ?? null,
  };
}

/** Tous les envois ouverts publiquement (catalogue client). */
export async function getPublishedShipmentsCatalog() {
  return prisma.shipment.findMany({
    where: publicVitrineShipmentWhere(),
    orderBy: [{ departureDate: "asc" }, { createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      reference: true,
      originCountry: true,
      destinationCountry: true,
      destinationCity: true,
      departureDate: true,
      arrivalDate: true,
      status: true,
      forwarder: {
        select: {
          name: true,
          code5: true,
          city: true,
          country: true,
        },
      },
      _count: { select: { parcels: true } },
    },
  });
}

export type PublishedShipmentCatalogRow = Awaited<
  ReturnType<typeof getPublishedShipmentsCatalog>
>[number];

export async function getClientForwarders(clientId: string) {
  const links = await prisma.clientForwarder.findMany({
    where: { clientId },
    include: {
      forwarder: {
        select: { id: true, name: true, code5: true, country: true, city: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => l.forwarder);
}

export type ClientForwarderRow = Awaited<ReturnType<typeof getClientForwarders>>[number];

export async function getClientRecipients(clientId: string) {
  return prisma.recipient.findMany({
    where: { clientId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
