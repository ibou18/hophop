import { prisma } from "@/lib/prisma";
import {
  ParcelStatus,
  ShipmentStatus,
  TransportMode,
} from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

// ─────────────────────────────────────────────
// KPIs globaux plateforme
// ─────────────────────────────────────────────

export interface AdminPlatformKpis {
  totalForwarders: number;
  activeForwarders: number;
  totalClients: number;
  totalParcels: number;
  parcelsByStatus: Record<ParcelStatus, number>;
  totalShipments: number;
  shipmentsByStatus: Record<ShipmentStatus, number>;
  recentForwarders: AdminForwarderRow[];
}

const forwarderSelect = {
  id: true,
  name: true,
  email: true,
  code5: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      clients: true,
      parcels: true,
      shipments: true,
    },
  },
} satisfies Prisma.ForwarderSelect;

export type AdminForwarderRow = Prisma.ForwarderGetPayload<{
  select: typeof forwarderSelect;
}>;

export async function getAdminPlatformKpis(): Promise<AdminPlatformKpis> {
  const [
    totalForwarders,
    activeForwarders,
    totalClients,
    totalParcels,
    parcelGroups,
    totalShipments,
    shipmentGroups,
    recentForwarders,
  ] = await Promise.all([
    prisma.forwarder.count(),
    prisma.forwarder.count({ where: { isActive: true } }),
    prisma.client.count(),
    prisma.parcel.count(),
    prisma.parcel.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.shipment.count(),
    prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.forwarder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: forwarderSelect,
    }),
  ]);

  const parcelsByStatus = Object.fromEntries(
    Object.values(ParcelStatus).map((s) => [
      s,
      parcelGroups.find((g: { status: ParcelStatus; _count: { _all: number } }) => g.status === s)?._count._all ?? 0,
    ]),
  ) as Record<ParcelStatus, number>;

  const shipmentsByStatus = Object.fromEntries(
    Object.values(ShipmentStatus).map((s) => [
      s,
      shipmentGroups.find((g: { status: ShipmentStatus; _count: { _all: number } }) => g.status === s)?._count._all ?? 0,
    ]),
  ) as Record<ShipmentStatus, number>;

  return {
    totalForwarders,
    activeForwarders,
    totalClients,
    totalParcels,
    parcelsByStatus,
    totalShipments,
    shipmentsByStatus,
    recentForwarders,
  };
}

// ─────────────────────────────────────────────
// Liste complète des transitaires
// ─────────────────────────────────────────────

export async function getAdminForwarders(): Promise<AdminForwarderRow[]> {
  return prisma.forwarder.findMany({
    orderBy: { createdAt: "desc" },
    select: forwarderSelect,
  });
}

// ─────────────────────────────────────────────
// Détail d'un transitaire
// ─────────────────────────────────────────────

const forwarderDetailSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  country: true,
  city: true,
  code5: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  logoUrl: true,
  _count: {
    select: {
      clients: true,
      parcels: true,
      shipments: true,
      members: true,
    },
  },
} satisfies Prisma.ForwarderSelect;

export type AdminForwarderDetail = Prisma.ForwarderGetPayload<{
  select: typeof forwarderDetailSelect;
}>;

const shipmentListSelect = {
  id: true,
  reference: true,
  status: true,
  transportMode: true,
  departureDate: true,
  originCountry: true,
  destinationCountry: true,
  createdAt: true,
  _count: { select: { parcels: true } },
} satisfies Prisma.ShipmentSelect;

export type AdminShipmentRow = Prisma.ShipmentGetPayload<{
  select: typeof shipmentListSelect;
}>;

export async function getAdminForwarderById(id: string): Promise<{
  forwarder: AdminForwarderDetail | null;
  recentShipments: AdminShipmentRow[];
  recentParcels: {
    id: string;
    trackingCode: string;
    status: ParcelStatus;
    createdAt: Date;
    client: { firstName: string; lastName: string } | null;
  }[];
}> {
  const [forwarder, recentShipments, recentParcels] = await Promise.all([
    prisma.forwarder.findUnique({
      where: { id },
      select: forwarderDetailSelect,
    }),
    prisma.shipment.findMany({
      where: { forwarderId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: shipmentListSelect,
    }),
    prisma.parcel.findMany({
      where: { forwarderId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        trackingCode: true,
        status: true,
        createdAt: true,
        client: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return { forwarder, recentShipments, recentParcels };
}

// ─────────────────────────────────────────────
// Liste des clients
// ─────────────────────────────────────────────

const clientListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  city: true,
  country: true,
  isActive: true,
  createdAt: true,
  _count: { select: { parcels: true } },
  forwarders: {
    select: {
      forwarder: { select: { id: true, name: true, code5: true } },
    },
    take: 3,
  },
} satisfies Prisma.ClientSelect;

export type AdminClientRow = Prisma.ClientGetPayload<{
  select: typeof clientListSelect;
}>;

export async function getAdminClients(): Promise<AdminClientRow[]> {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: clientListSelect,
  });
}

// ─────────────────────────────────────────────
// Détail d'un client
// ─────────────────────────────────────────────

export async function getAdminClientById(id: string): Promise<{
  client: AdminClientRow | null;
  recentParcels: {
    id: string;
    trackingCode: string;
    status: ParcelStatus;
    createdAt: Date;
    forwarder: { name: string } | null;
  }[];
}> {
  const [client, recentParcels] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      select: clientListSelect,
    }),
    prisma.parcel.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        trackingCode: true,
        status: true,
        createdAt: true,
        forwarder: { select: { name: true } },
      },
    }),
  ]);

  return { client, recentParcels };
}

// ─────────────────────────────────────────────
// Envois globaux (tous transitaires)
// ─────────────────────────────────────────────

export async function getAdminShipments(statusFilter?: ShipmentStatus): Promise<
  (AdminShipmentRow & { forwarder: { name: string; code5: string } })[]
> {
  return prisma.shipment.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { departureDate: "asc" },
    take: 200,
    select: {
      ...shipmentListSelect,
      forwarder: { select: { name: true, code5: true } },
    },
  }) as Promise<(AdminShipmentRow & { forwarder: { name: string; code5: string } })[]>;
}

// ─────────────────────────────────────────────
// Helpers labels
// ─────────────────────────────────────────────

export const PARCEL_STATUS_LABELS: Record<ParcelStatus, string> = {
  DECLARED: "Déclaré",
  COLLECTED: "Collecté",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  READY: "Prêt",
  DELIVERED: "Livré",
  ISSUE: "Problème",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  DRAFT: "Brouillon",
  CONFIRMED: "Confirmé",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  CLOSED: "Clôturé",
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  AIR: "Aérien ✈",
  SEA: "Maritime ⛵",
  ROAD: "Routier 🚛",
};
