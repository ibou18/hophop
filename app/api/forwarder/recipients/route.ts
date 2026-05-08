import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { z } from "zod";
import { toE164 } from "@/lib/phone-e164";
import type { Country } from "@/app/generated/prisma/enums";

const forwarderCreateRecipientSchema = z.object({
  clientId: z.string().uuid("clientId invalide"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().min(1, "Téléphone requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
});

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = forwarderCreateRecipientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }
  const data = parsed.data;

  // Vérifier que le client appartient à ce transitaire
  const link = await prisma.clientForwarder.findUnique({
    where: {
      clientId_forwarderId: { clientId: data.clientId, forwarderId: auth.forwarderId },
    },
  });
  if (!link) return jsonError("Client introuvable", 404);

  const e164 = toE164(data.country as Country, data.phone);
  if (!e164) return jsonError("Numéro invalide pour ce pays", 422);

  const recipient = await prisma.recipient.create({
    data: {
      clientId: data.clientId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: e164,
      city: data.city,
      country: data.country as Country,
      isDefault: false,
    },
  });

  return jsonOk(recipient, 201);
}
