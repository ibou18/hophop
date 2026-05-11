import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";

const itemCategory = z.enum([
  "CLOTHING", "ELECTRONICS", "FOOD", "COSMETICS", "DOCUMENTS", "OTHER",
] as const);

const countryEnum = z.enum([
  "CA","FR","GN","SN","CI","CM","TG","BF","NG","BE","CH","US","GM","ML",
] as const);

const createSchema = z.object({
  recipientId: z.string().uuid("Destinataire requis"),
  maxDepartureDate: z.string().datetime({ message: "Date invalide" }),
  // Localisation d'origine
  originCountry: countryEnum.optional(),
  originCity: z.string().optional(),
  originLatitude: z.number().optional(),
  originLongitude: z.number().optional(),
  // Colis
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  description: z.string().optional(),
  declaredValue: z.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        category: itemCategory.default("OTHER"),
        weightKg: z.number().positive().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "Au moins un article requis"),
});

// POST — client crée une demande de colis sans transitaire
export async function POST(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const { recipientId, maxDepartureDate, items, ...rest } = parsed.data;

  // Vérifier que le destinataire appartient au client
  const recipient = await prisma.recipient.findFirst({
    where: { id: recipientId, clientId: auth.clientId },
    select: { id: true },
  });
  if (!recipient) return jsonError("Destinataire introuvable", 404);

  const parcelRequest = await prisma.parcelRequest.create({
    data: {
      clientId: auth.clientId,
      recipientId,
      maxDepartureDate: new Date(maxDepartureDate),
      ...rest,
      items: { create: items },
    },
    select: { id: true, status: true, maxDepartureDate: true },
  });

  return jsonOk(parcelRequest, 201);
}

// GET — client liste ses propres demandes
export async function GET(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  const requests = await prisma.parcelRequest.findMany({
    where: {
      clientId: auth.clientId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      maxDepartureDate: true,
      quotedPrice: true,
      quotedCurrency: true,
      quotedAt: true,
      quoteExpiresAt: true,
      quoteNote: true,
      description: true,
      weightKg: true,
      createdAt: true,
      recipient: {
        select: { firstName: true, lastName: true, city: true, country: true },
      },
      quotedForwarder: { select: { name: true } },
      quotedShipment: { select: { reference: true, departureDate: true } },
      items: { select: { name: true, quantity: true, category: true } },
    },
  });

  return jsonOk(requests);
}
