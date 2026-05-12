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
  vehicle: {
    select: { id: true, make: true, model: true, year: true },
  },
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
  parcelsToConfirm: ForwarderParcelListRow[];
}> {
  const [parcelsInTransit, activeShipments, clientsCount, recentParcels, parcelsToConfirm] =
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
      // Colis déclarés en attente d'acceptation :
      // - pas encore dans un envoi, OU dans un envoi en brouillon/confirmé (pas encore parti)
      // Les colis dans un envoi IN_TRANSIT ou ARRIVED sont exclus : l'action n'est plus possible
      prisma.parcel.findMany({
        where: {
          forwarderId,
          status: ParcelStatus.DECLARED,
          OR: [
            { shipmentId: null },
            {
              shipment: {
                status: { in: [ShipmentStatus.DRAFT, ShipmentStatus.CONFIRMED] },
              },
            },
          ],
        },
        orderBy: { createdAt: "asc" }, // oldest first → most urgent
        take: 20,
        include: parcelListInclude,
      }),
    ]);

  return {
    parcelsInTransit,
    activeShipments,
    clientsCount,
    recentParcels,
    parcelsToConfirm,
  };
}

export async function getForwarderParcels(
  forwarderId: string,
  statusFilter?: ParcelStatus,
  query?: string,
  page = 1,
  pageSize = 20,
): Promise<{
  items: ForwarderParcelListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const q = query?.trim();
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize)
    ? Math.min(100, Math.max(1, Math.floor(pageSize)))
    : 20;
  const where: Prisma.ParcelWhereInput = {
    forwarderId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { client: { firstName: { contains: q, mode: "insensitive" } } },
            { client: { lastName: { contains: q, mode: "insensitive" } } },
            { client: { email: { contains: q, mode: "insensitive" } } },
            { client: { phone: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const total = await prisma.parcel.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(safePage, totalPages);
  const skip = (clampedPage - 1) * safePageSize;
  const items = await prisma.parcel.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: safePageSize,
    include: parcelListInclude,
  });
  return {
    items,
    total,
    page: clampedPage,
    pageSize: safePageSize,
    totalPages,
  };
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
  vehicle: true,
  drum: true,
  sizedCarton: true,
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
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, sortOrder: true },
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
