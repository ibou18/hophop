import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { createShipmentSchema } from "@/lib/validations/shipment";
import { ShipmentStatus } from "@/app/generated/prisma/enums";

export async function GET() {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const shipments = await prisma.shipment.findMany({
    where: { forwarderId: auth.forwarderId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { parcels: true } },
    },
    take: 100,
  });
  return jsonOk(shipments);
}

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  const year = new Date().getFullYear();
  let reference = `ENV-${year}-${nanoid(8).toUpperCase()}`;
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.shipment.findFirst({
      where: { forwarderId: auth.forwarderId, reference },
    });
    if (!clash) break;
    reference = `ENV-${year}-${nanoid(8).toUpperCase()}`;
  }
  const shipment = await prisma.shipment.create({
    data: {
      forwarderId: auth.forwarderId,
      reference,
      status: ShipmentStatus.DRAFT,
      transportMode: data.transportMode,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      originCity: data.originCity?.trim() || null,
      destinationCity: data.destinationCity?.trim() || null,
      originLatitude: data.originLatitude ?? null,
      originLongitude: data.originLongitude ?? null,
      destinationLatitude: data.destinationLatitude ?? null,
      destinationLongitude: data.destinationLongitude ?? null,
      departureDate: data.departureDate,
      arrivalDate: data.arrivalDate ?? null,
      notes: data.notes ?? null,
      // Tarification propre à cet envoi (optionnel)
      pricingType: data.pricingType ?? null,
      ratePerKg: data.ratePerKg ?? null,
      ratePerBox: data.ratePerBox ?? null,
      flatRate: data.flatRate ?? null,
      ratePerVolume: data.ratePerVolume ?? null,
      volumeDivisor: data.volumeDivisor ?? 5000,
      minimumCharge: data.minimumCharge ?? 0,
      currency: data.currency ?? "CAD",
    },
  });
  return jsonOk(shipment, 201);
}
