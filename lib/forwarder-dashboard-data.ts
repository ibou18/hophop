import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";

const upcomingShipmentInclude = {
  _count: { select: { parcels: true } },
} satisfies Prisma.ShipmentInclude;

export type UpcomingShipmentRow = Prisma.ShipmentGetPayload<{
  include: typeof upcomingShipmentInclude;
}>;

export async function getUpcomingShipments(
  forwarderId: string,
  take = 10,
): Promise<UpcomingShipmentRow[]> {
  return prisma.shipment.findMany({
    where: {
      forwarderId,
      status: { in: [ShipmentStatus.CONFIRMED, ShipmentStatus.IN_TRANSIT] },
      departureDate: { gte: new Date() },
    },
    orderBy: { departureDate: "asc" },
    take,
    include: upcomingShipmentInclude,
  });
}

const parcelListInclude = {
  client: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  recipient: { select: { city: true, country: true, firstName: true, lastName: true } },
  shipment: { select: { id: true, reference: true, status: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, sortOrder: true },
  },
} satisfies Prisma.ParcelInclude;

export type ForwarderParcelListRow = Prisma.ParcelGetPayload<{
  include: typeof parcelListInclude;
}>;

const ACTIVE_SHIPMENT: ShipmentStatus[] = [
  ShipmentStatus.CONFIRMED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.ARRIVED,
];

export async function getForwarderDashboardKpis(forwarderId: string): Promise<{
  parcelsInTransit: number;
  activeShipments: number;
  clientsCount: number;
  recentParcels: ForwarderParcelListRow[];
}> {
  const [parcelsInTransit, activeShipments, clientsCount, recentParcels] =
    await Promise.all([
      prisma.parcel.count({
        where: { forwarderId, status: ParcelStatus.IN_TRANSIT },
      }),
      prisma.shipment.count({
        where: {
          forwarderId,
          status: { in: ACTIVE_SHIPMENT },
        },
      }),
      prisma.client.count({ where: { forwarders: { some: { forwarderId } } } }),
      prisma.parcel.findMany({
        where: { forwarderId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: parcelListInclude,
      }),
    ]);

  return {
    parcelsInTransit,
    activeShipments,
    clientsCount,
    recentParcels,
  };
}

export async function getForwarderParcels(
  forwarderId: string,
  statusFilter?: ParcelStatus,
): Promise<ForwarderParcelListRow[]> {
  return prisma.parcel.findMany({
    where: {
      forwarderId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: parcelListInclude,
  });
}

export function parseParcelStatusParam(
  raw: string | undefined,
): ParcelStatus | undefined {
  if (!raw) return undefined;
  const allowed = Object.values(ParcelStatus) as string[];
  return allowed.includes(raw) ? (raw as ParcelStatus) : undefined;
}

const parcelDetailInclude = {
  items: true,
  recipient: true,
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      city: true,
      country: true,
    },
  },
  shipment: true,
  trackingEvents: {
    orderBy: { createdAt: "desc" as const },
    take: 40,
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
} satisfies Prisma.ParcelInclude;

export type ForwarderParcelDetail = Prisma.ParcelGetPayload<{
  include: typeof parcelDetailInclude;
}>;

export async function getForwarderParcelById(
  forwarderId: string,
  parcelId: string,
): Promise<ForwarderParcelDetail | null> {
  return prisma.parcel.findFirst({
    where: { id: parcelId, forwarderId },
    include: parcelDetailInclude,
  });
}
