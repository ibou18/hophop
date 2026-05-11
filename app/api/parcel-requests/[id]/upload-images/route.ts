import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { normalizeImageContentType, PARCEL_IMAGE_MAX_BYTES } from "@/lib/image-file-types";
import {
  objectKeyForParcelRequestImage,
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

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id: parcelRequestId } = await ctx.params;

  const parcelRequest = await prisma.parcelRequest.findFirst({
    where: { id: parcelRequestId, clientId: auth.clientId },
    select: { id: true, status: true },
  });
  if (!parcelRequest) {
    apiLog("POST /api/parcel-requests/[id]/upload-images", "not_found", {
      parcelRequestId,
      clientId: auth.clientId,
    });
    return jsonError("Introuvable", 404);
  }
  if (parcelRequest.status !== "PENDING") {
    return jsonError(
      "Impossible d’ajouter des photos : la demande n’est plus modifiable (statut autorisé : en attente d’offre).",
      400,
    );
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return jsonError("multipart/form-data requis (champ files)", 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    apiLogError(
      "POST /api/parcel-requests/[id]/upload-images",
      "formData_parse_failed",
      e,
      { parcelRequestId },
    );
    return jsonError("Corps de requête invalide ou trop volumineux", 413);
  }

  const raw = formData.getAll("files");
  const files = raw.filter(isFile);
  if (files.length === 0) return jsonError("Aucun fichier (champ files)", 400);
  if (files.length > 10) return jsonError("Maximum 10 fichiers", 400);

  apiLog("POST /api/parcel-requests/[id]/upload-images", "upload_start", {
    parcelRequestId,
    fileCount: files.length,
    clientId: auth.clientId,
  });

  const urls: string[] = [];

  try {
    const existingCount = await prisma.parcelRequestImage.count({
      where: { parcelRequestId },
    });
    if (existingCount + files.length > 10) {
      return jsonError(
        `Maximum 10 photos au total (${existingCount} déjà enregistrée${existingCount > 1 ? "s" : ""}).`,
        400,
      );
    }

    for (const file of files) {
      if (file.size > PARCEL_IMAGE_MAX_BYTES) {
        return jsonError(
          `Fichier trop volumineux (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo)`,
          400,
        );
      }
      const contentType = normalizeImageContentType(file as File);
      if (!contentType) return jsonError("Type d'image non autorisé", 400);
      const key = objectKeyForParcelRequestImage(parcelRequestId, contentType);
      const buf = Buffer.from(await file.arrayBuffer());
      await putObjectImage({ key, body: buf, contentType });
      urls.push(publicUrlForKey(key));
    }

    await prisma.$transaction(async (tx) => {
      await tx.parcelRequestImage.createMany({
        data: urls.map((url, i) => ({
          parcelRequestId,
          url,
          sortOrder: existingCount + i,
        })),
      });
    });
  } catch (error) {
    apiLogError(
      "POST /api/parcel-requests/[id]/upload-images",
      "s3_or_db_failed",
      error,
      { parcelRequestId, fileCount: files.length },
    );
    return jsonError("Erreur lors de l'upload ou de l'enregistrement des images", 500);
  }

  apiLog("POST /api/parcel-requests/[id]/upload-images", "upload_ok", {
    parcelRequestId,
    imageCount: urls.length,
  });

  return jsonOk({ ok: true, count: urls.length, urls });
}
