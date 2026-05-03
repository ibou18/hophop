import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Country } from "@/app/generated/prisma/enums";

const clientListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  country: true,
  city: true,
  authMethod: true,
  createdAt: true,
  _count: { select: { parcels: true, recipients: true } },
} satisfies Prisma.ClientSelect;

export type ForwarderClientListRow = Prisma.ClientGetPayload<{
  select: typeof clientListSelect;
}>;

const clientDetailInclude = {
  _count: { select: { parcels: true, recipients: true } },
  parcels: {
    orderBy: { createdAt: "desc" as const },
    take: 25,
    select: {
      id: true,
      trackingCode: true,
      status: true,
      createdAt: true,
    },
  },
  recipients: {
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    take: 12,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      city: true,
      country: true,
      phone: true,
      isDefault: true,
    },
  },
} satisfies Prisma.ClientInclude;

export type ForwarderClientDetail = Prisma.ClientGetPayload<{
  include: typeof clientDetailInclude;
}>;

export async function getForwarderClients(
  forwarderId: string,
  countryFilter?: Country,
): Promise<ForwarderClientListRow[]> {
  return prisma.client.findMany({
    where: {
      forwarderId,
      isActive: true,
      ...(countryFilter ? { country: countryFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: clientListSelect,
  });
}

export function parseCountryParam(
  raw: string | undefined,
): Country | undefined {
  if (!raw) return undefined;
  const allowed = ["CA", "FR", "GN", "SN", "CI", "CM"] as const;
  return (allowed as readonly string[]).includes(raw)
    ? (raw as Country)
    : undefined;
}

export async function getForwarderClientById(
  forwarderId: string,
  clientId: string,
): Promise<ForwarderClientDetail | null> {
  return prisma.client.findFirst({
    where: { id: clientId, forwarderId, isActive: true },
    include: clientDetailInclude,
  });
}
