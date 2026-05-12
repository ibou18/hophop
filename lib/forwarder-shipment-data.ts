import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { Country, ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";

const shipmentListInclude = {
  _count: { select: { parcels: true } },
} satisfies Prisma.ShipmentInclude;

export type ForwarderShipmentListRow = Prisma.ShipmentGetPayload<{
  include: typeof shipmentListInclude;
}>;

const shipmentDetailInclude = {
  forwarder: { select: { code5: true, name: true } },
  parcels: {
    orderBy: { createdAt: "asc" as const },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          country: true,
        },
      },
      recipient: { select: { city: true, country: true } },
      vehicle: {
        select: { id: true, make: true, model: true, year: true },
      },
      drum: { select: { id: true, size: true } },
      sizedCarton: { select: { id: true, size: true } },
    },
  },
  _count: { select: { requests: true } },
} satisfies Prisma.ShipmentInclude;

export type ForwarderShipmentDetail = Prisma.ShipmentGetPayload<{
  include: typeof shipmentDetailInclude;
}>;

const assignableParcelInclude = {
  client: {
    select: {
      firstName: true,
      lastName: true,
      city: true,
      country: true,
    },
  },
  recipient: { select: { city: true, country: true } },
  vehicle: {
    select: { id: true, make: true, model: true, year: true },
  },
  drum: { select: { id: true, size: true } },
  sizedCarton: { select: { id: true, size: true } },
} satisfies Prisma.ParcelInclude;

export type AssignableParcelRow = Prisma.ParcelGetPayload<{
  include: typeof assignableParcelInclude;
}>;

/** Données minimales pour l’UI d’affectation (liste « ajouter » / « retirer »). */
export type ParcelAssignmentListRow = Pick<
  AssignableParcelRow,
  "id" | "trackingCode" | "client" | "recipient" | "vehicle" | "drum" | "sizedCarton"
>;

export async function getForwarderShipments(
  forwarderId: string,
  statusFilter?: ShipmentStatus,
): Promise<ForwarderShipmentListRow[]> {
  return prisma.shipment.findMany({
    where: {
      forwarderId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: shipmentListInclude,
  });
}

export function parseShipmentStatusParam(
  raw: string | undefined,
): ShipmentStatus | undefined {
  if (!raw) return undefined;
  const allowed = Object.values(ShipmentStatus) as string[];
  return allowed.includes(raw) ? (raw as ShipmentStatus) : undefined;
}

export async function getForwarderShipmentById(
  forwarderId: string,
  shipmentId: string,
): Promise<ForwarderShipmentDetail | null> {
  return prisma.shipment.findFirst({
    where: { id: shipmentId, forwarderId },
    include: shipmentDetailInclude,
  });
}

/** Route de l’envoi pour ne proposer que les colis « compatibles » à l’affectation. */
export type ShipmentRouteMatch = {
  originCountry: Country;
  destinationCountry: Country;
  acceptsVehicles: boolean;
  acceptsDrums: boolean;
  acceptsSizedCartons: boolean;
};

/**
 * Colis collectés, non affectés, dont le pays client → pays destinataire correspond
 * à la route de l’envoi. Les dossiers véhicule / fût / carton taille sont exclus si l’envoi ne les accepte pas.
 */
export async function getAssignableParcels(
  forwarderId: string,
  route: ShipmentRouteMatch,
): Promise<AssignableParcelRow[]> {
  return prisma.parcel.findMany({
    where: {
      forwarderId,
      status: ParcelStatus.COLLECTED,
      shipmentId: null,
      client: { country: route.originCountry },
      recipient: { country: route.destinationCountry },
      ...(route.acceptsVehicles ? {} : { vehicle: null }),
      ...(route.acceptsDrums ? {} : { drum: null }),
      ...(route.acceptsSizedCartons ? {} : { sizedCarton: null }),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: assignableParcelInclude,
  });
}

export function isShipmentEditable(status: ShipmentStatus): boolean {
  return status === ShipmentStatus.DRAFT || status === ShipmentStatus.CONFIRMED;
}

const shipmentRequestInclude = {
  parcel: {
    include: {
      items: { select: { name: true, quantity: true, category: true } },
      recipient: {
        select: { firstName: true, lastName: true, city: true, country: true },
      },
    },
  },
  client: { select: { id: true, firstName: true, lastName: true } },
  movedToShipment: { select: { id: true, reference: true } },
} satisfies Prisma.ShipmentRequestInclude;

export type ShipmentRequestRow = Prisma.ShipmentRequestGetPayload<{
  include: typeof shipmentRequestInclude;
}>;

export async function getShipmentRequests(
  forwarderId: string,
  shipmentId: string,
): Promise<ShipmentRequestRow[] | null> {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, forwarderId },
  });
  if (!shipment) return null;
  return prisma.shipmentRequest.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "desc" },
    include: shipmentRequestInclude,
  });
}

export async function getOtherShipments(
  forwarderId: string,
  excludeId: string,
): Promise<{ id: string; reference: string; destinationCountry: Country; departureDate: Date | null }[]> {
  return prisma.shipment.findMany({
    where: {
      forwarderId,
      id: { not: excludeId },
      status: { in: [ShipmentStatus.DRAFT, ShipmentStatus.CONFIRMED] },
    },
    orderBy: { departureDate: "asc" },
    select: { id: true, reference: true, destinationCountry: true, departureDate: true },
  });
}
