import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { ShipmentStatus } from "@/app/generated/prisma/enums";

/**
 * GET /api/parcels/scan?code=HOP-XXXXXX
 * Recherche un colis par son code de suivi (pour la page de scan).
 * Retourne le colis + les envois modifiables disponibles pour affectation.
 */
export async function GET(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("code")?.trim().toUpperCase() ?? "";

  if (!raw) return jsonError("Paramètre code manquant", 400);

  const parcel = await prisma.parcel.findFirst({
    where: { trackingCode: raw, forwarderId: auth.forwarderId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          country: true,
        },
      },
      shipment: {
        select: {
          id: true,
          reference: true,
          status: true,
          destinationCountry: true,
          transportMode: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (!parcel) return jsonError("Colis introuvable", 404);

  // Envois disponibles pour affectation (DRAFT ou CONFIRMED, même transitaire)
  const availableShipments = await prisma.shipment.findMany({
    where: {
      forwarderId: auth.forwarderId,
      status: { in: [ShipmentStatus.DRAFT, ShipmentStatus.CONFIRMED] },
    },
    select: {
      id: true,
      reference: true,
      destinationCountry: true,
      transportMode: true,
      departureDate: true,
    },
    orderBy: { departureDate: "asc" },
  });

  return jsonOk({ parcel, availableShipments });
}
