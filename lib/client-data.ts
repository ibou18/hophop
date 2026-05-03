import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { ParcelStatus } from "@/app/generated/prisma/enums";

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
    },
  });
}

export async function getClientRecipients(clientId: string) {
  return prisma.recipient.findMany({
    where: { clientId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
