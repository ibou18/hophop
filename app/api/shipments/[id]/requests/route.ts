import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient, requireForwarder } from "@/lib/require-auth";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/shipments/[id]/requests
// Transitaire : voit toutes les demandes pour son envoi
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const shipment = await prisma.shipment.findFirst({
    where: { id, forwarderId: auth.forwarderId },
  });
  if (!shipment) return jsonError("Envoi introuvable", 404);

  const requests = await prisma.shipmentRequest.findMany({
    where: { shipmentId: id },
    orderBy: { createdAt: "desc" },
    include: {
      parcel: {
        include: {
          items: { select: { name: true, quantity: true, category: true } },
          recipient: {
            select: { firstName: true, lastName: true, city: true, country: true },
          },
        },
      },
      client: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      movedToShipment: { select: { id: true, reference: true } },
    },
  });

  return jsonOk(requests);
}

const createRequestSchema = z.object({
  parcelId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

// POST /api/shipments/[id]/requests
// Client : demande à intégrer un colis à cet envoi
export async function POST(req: Request, ctx: Ctx) {
  const { id: shipmentId } = await ctx.params;
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation échouée", 422);

  const { parcelId, note } = parsed.data;

  // Vérifier que le colis appartient bien au client
  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId: auth.clientId },
  });
  if (!parcel) return jsonError("Colis introuvable", 404);
  if (parcel.shipmentId) return jsonError("Ce colis est déjà affecté à un envoi", 409);

  // Vérifier que l'envoi est publié et appartient au bon transitaire (le forwarder du client)
  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      isPublished: true,
      forwarderId: auth.forwarderId,
      status: { in: ["DRAFT", "CONFIRMED"] },
    },
  });
  if (!shipment) return jsonError("Envoi non disponible", 404);

  // Vérifier qu'il n'y a pas déjà une demande active pour ce colis
  const existing = await prisma.shipmentRequest.findUnique({
    where: { parcelId },
  });
  if (existing) {
    if (existing.status === "PENDING") return jsonError("Une demande est déjà en attente pour ce colis", 409);
    // Si rejeté ou déplacé, on autorise une nouvelle demande → supprimer l'ancienne
    await prisma.shipmentRequest.delete({ where: { parcelId } });
  }

  const request = await prisma.shipmentRequest.create({
    data: {
      shipmentId,
      parcelId,
      clientId: auth.clientId,
      note: note ?? null,
    },
    include: {
      shipment: { select: { id: true, reference: true, destinationCountry: true, departureDate: true } },
    },
  });

  return jsonOk(request, 201);
}
