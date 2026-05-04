import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { apiLog, apiLogError } from "@/lib/server-api-log";
import { attachParcelImagesSchema } from "@/lib/validations/parcel";

type Ctx = { params: Promise<{ id: string }> };

/** Associe des photos au colis après upload S3 (client propriétaire uniquement). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id: parcelId } = await ctx.params;

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId: auth.clientId },
    select: { id: true },
  });
  if (!parcel) {
    apiLog("POST /api/parcels/[id]/images", "parcel_not_found", {
      parcelId,
      clientId: auth.clientId,
    });
    return jsonError("Introuvable", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    apiLog("POST /api/parcels/[id]/images", "body_json_invalid", { parcelId });
    return jsonError("JSON invalide", 400);
  }

  const parsed = attachParcelImagesSchema.safeParse(body);
  if (!parsed.success) {
    apiLog("POST /api/parcels/[id]/images", "validation_failed", {
      parcelId,
      issues: parsed.error.flatten(),
    });
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }

  const urlCount = parsed.data.imageUrls.length;
  const sampleHost = (() => {
    try {
      return new URL(parsed.data.imageUrls[0]!).hostname;
    } catch {
      return "invalid-url";
    }
  })();

  apiLog("POST /api/parcels/[id]/images", "persist_start", {
    parcelId,
    clientId: auth.clientId,
    imageCount: urlCount,
    firstUrlHost: sampleHost,
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.parcelImage.deleteMany({ where: { parcelId } });
      await tx.parcelImage.createMany({
        data: parsed.data.imageUrls.map((url, i) => ({
          parcelId,
          url,
          sortOrder: i,
        })),
      });
    });
  } catch (error) {
    apiLogError(
      "POST /api/parcels/[id]/images",
      "transaction_failed",
      error,
      { parcelId, imageCount: urlCount },
    );
    return jsonError("Erreur lors de l’enregistrement des images", 500);
  }

  apiLog("POST /api/parcels/[id]/images", "persist_ok", {
    parcelId,
    imageCount: urlCount,
  });

  return jsonOk({ ok: true, count: parsed.data.imageUrls.length });
}
