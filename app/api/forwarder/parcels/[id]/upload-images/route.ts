import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { normalizeImageContentType, PARCEL_IMAGE_MAX_BYTES } from "@/lib/image-file-types";
import {
  objectKeyForParcelImage,
  publicUrlForKey,
  putObjectImage,
} from "@/lib/s3-presign";

export const maxDuration = 120;

function isFile(x: unknown): x is File {
  return (
    typeof x === "object" &&
    x !== null &&
    "arrayBuffer" in x &&
    typeof (x as File).arrayBuffer === "function"
  );
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { id: parcelId } = await ctx.params;

  // Vérifier que le colis appartient à un envoi de ce forwarder
  const parcel = await prisma.parcel.findFirst({
    where: {
      id: parcelId,
      shipment: { forwarderId: auth.forwarderId },
    },
    select: { id: true },
  });
  if (!parcel) return jsonError("Colis introuvable", 404);

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return jsonError("multipart/form-data requis (champ files)", 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError("Corps de requête invalide ou trop volumineux", 413);
  }

  const raw = formData.getAll("files");
  const files = raw.filter(isFile);
  if (files.length === 0) return jsonError("Aucun fichier (champ files)", 400);
  if (files.length > 10) return jsonError("Maximum 10 fichiers", 400);

  const urls: string[] = [];

  try {
    for (const file of files) {
      if (file.size > PARCEL_IMAGE_MAX_BYTES) {
        return jsonError(
          `Fichier trop volumineux (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo)`,
          400,
        );
      }
      const contentType = normalizeImageContentType(file as File);
      if (!contentType) return jsonError("Type d'image non autorisé", 400);

      const key = objectKeyForParcelImage(parcelId, contentType);
      const buf = Buffer.from(await file.arrayBuffer());
      await putObjectImage({ key, body: buf, contentType });
      urls.push(publicUrlForKey(key));
    }

    await prisma.$transaction(async (tx) => {
      await tx.parcelImage.deleteMany({ where: { parcelId } });
      await tx.parcelImage.createMany({
        data: urls.map((url, i) => ({ parcelId, url, sortOrder: i })),
      });
    });
  } catch (error) {
    console.error("❌ forwarder parcel upload-images failed", error);
    return jsonError("Erreur lors de l'upload ou de l'enregistrement des images", 500);
  }

  return jsonOk({ ok: true, count: urls.length, urls });
}
