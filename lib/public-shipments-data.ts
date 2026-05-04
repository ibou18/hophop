import { prisma } from "@/lib/prisma";
import { publicVitrineShipmentWhere } from "@/lib/shipment-public-visibility";

export type PublicUpcomingShipment = {
  id: string;
  reference: string;
  transportMode: "AIR" | "SEA" | "ROAD";
  originCountry: string;
  destinationCountry: string;
  destinationCity: string | null;
  departureDate: Date;
  parcelCount: number;
  forwarder: {
    code5: string;
    name: string;
    city: string | null;
  };
};

export async function getPublicUpcomingShipments(
  take = 5,
): Promise<PublicUpcomingShipment[]> {
  const rows = await prisma.shipment.findMany({
    where: publicVitrineShipmentWhere(),
    orderBy: { departureDate: "asc" },
    take,
    select: {
      id: true,
      reference: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      destinationCity: true,
      departureDate: true,
      _count: { select: { parcels: true } },
      forwarder: {
        select: { code5: true, name: true, city: true },
      },
    },
  });

  return rows
    .filter((r) => r.departureDate !== null)
    .map((r) => ({
      id: r.id,
      reference: r.reference,
      transportMode: r.transportMode,
      originCountry: r.originCountry,
      destinationCountry: r.destinationCountry,
      destinationCity: r.destinationCity,
      departureDate: r.departureDate!,
      parcelCount: r._count.parcels,
      forwarder: r.forwarder,
    }));
}
