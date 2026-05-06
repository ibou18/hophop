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
  // Tarification de l'envoi (null = non définie publiquement)
  pricingType: "WEIGHT_KG" | "PER_BOX" | "VOLUMETRIC" | "FLAT" | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  currency: string;
  forwarder: {
    code5: string;
    name: string;
    city: string | null;
  };
};

export async function getPublicUpcomingShipments(
  take?: number,
): Promise<PublicUpcomingShipment[]> {
  const rows = await prisma.shipment.findMany({
    where: publicVitrineShipmentWhere(),
    orderBy: { departureDate: "asc" },
    ...(typeof take === "number" ? { take } : {}),
    select: {
      id: true,
      reference: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      destinationCity: true,
      departureDate: true,
      pricingType: true,
      ratePerKg: true,
      ratePerBox: true,
      flatRate: true,
      ratePerVolume: true,
      currency: true,
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
      pricingType: r.pricingType,
      ratePerKg: r.ratePerKg,
      ratePerBox: r.ratePerBox,
      flatRate: r.flatRate,
      ratePerVolume: r.ratePerVolume,
      currency: r.currency,
      forwarder: r.forwarder,
    }));
}
