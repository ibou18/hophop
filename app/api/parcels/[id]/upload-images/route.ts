import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { normalizeImageContentType, PARCEL_IMAGE_MAX_BYTES } from "@/lib/image-file-types";
import {
  objectKeyForParcelImage,
  publicUrlForKey,
  putObjectImage,
} from "@/lib/s3-presign";
import { apiLog, apiLogError } from "@/lib/server-api-log";

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

function isFile(x: unknown): x is File {
  return (
    typeof x === "object" &&
    x !== null &&
    "arrayBuffer" in x &&
    typeof (x as File).arrayBuffer === "function"
  );
}

/**
 * Multipart `files` — upload serveur → S3 puis enregistrement ParcelImage (pas de CORS S3 côté navigateur).
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id: parcelId } = await ctx.params;

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId: auth.clientId },
    select: { id: true },
  });
  if (!parcel) {
    apiLog("POST /api/parcels/[id]/upload-images", "parcel_not_found", {
      parcelId,
      clientId: auth.clientId,
    });
    return jsonError("Introuvable", 404);
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    apiLog("POST /api/parcels/[id]/upload-images", "expected_multipart", {
      parcelId,
    });
    return jsonError("multipart/form-data requis (champ files)", 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    apiLogError(
      "POST /api/parcels/[id]/upload-images",
      "formData_parse_failed",
      e,
      { parcelId },
    );
    return jsonError("Corps de requête invalide ou trop volumineux", 413);
  }

  const raw = formData.getAll("files");
  const files = raw.filter(isFile);
  if (files.length === 0) {
    apiLog("POST /api/parcels/[id]/upload-images", "no_files", { parcelId });
    return jsonError("Aucun fichier (champ files)", 400);
  }
  if (files.length > 8) {
    return jsonError("Maximum 8 fichiers", 400);
  }

  apiLog("POST /api/parcels/[id]/upload-images", "upload_start", {
    parcelId,
    fileCount: files.length,
    clientId: auth.clientId,
  });

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
      if (!contentType) {
        return jsonError("Type d’image non autorisé", 400);
      }
      const key = objectKeyForParcelImage(parcelId, contentType);
      const buf = Buffer.from(await file.arrayBuffer());
      await putObjectImage({ key, body: buf, contentType });
      urls.push(publicUrlForKey(key));
    }

    await prisma.$transaction(async (tx) => {
      await tx.parcelImage.deleteMany({ where: { parcelId } });
      await tx.parcelImage.createMany({
        data: urls.map((url, i) => ({
          parcelId,
          url,
          sortOrder: i,
        })),
      });
    });
  } catch (error) {
    apiLogError(
      "POST /api/parcels/[id]/upload-images",
      "s3_or_db_failed",
      error,
      { parcelId, fileCount: files.length },
    );
    return jsonError("Erreur lors de l’upload ou de l’enregistrement des images", 500);
  }

  apiLog("POST /api/parcels/[id]/upload-images", "upload_ok", {
    parcelId,
    imageCount: urls.length,
  });

  return jsonOk({ ok: true, count: urls.length, urls });
}
