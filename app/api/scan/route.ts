import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { scanSchema } from "@/lib/validations/scan";

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const trackingCode = parsed.data.trackingCode.trim();
  const parcel = await prisma.parcel.findFirst({
    where: {
      trackingCode,
      client: { forwarderId: auth.forwarderId },
    },
    include: {
      recipient: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          country: true,
        },
      },
    },
  });
  if (!parcel) {
    return jsonError("Colis introuvable pour ce transitaire", 404);
  }
  return jsonOk({
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    status: parcel.status,
    description: parcel.description,
    recipient: parcel.recipient,
  });
}
