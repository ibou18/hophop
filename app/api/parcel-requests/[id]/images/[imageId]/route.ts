import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { deleteParcelRequestImageFromS3 } from "@/lib/s3-presign";
import { apiLogError } from "@/lib/server-api-log";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/** DELETE — retirer une photo (S3 + ligne DB). Demande en PENDING uniquement. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id: parcelRequestId, imageId } = await ctx.params;

  const img = await prisma.parcelRequestImage.findFirst({
    where: { id: imageId, parcelRequestId },
    select: {
      id: true,
      url: true,
      parcelRequest: {
        select: { clientId: true, status: true },
      },
    },
  });

  if (!img || img.parcelRequest.clientId !== auth.clientId) {
    return jsonError("Photo introuvable", 404);
  }
  if (img.parcelRequest.status !== "PENDING") {
    return jsonError(
      "Impossible de retirer une photo : la demande n’est plus modifiable.",
      409,
    );
  }

  try {
    await deleteParcelRequestImageFromS3(img.url);
  } catch (e) {
    apiLogError(
      "DELETE /api/parcel-requests/[id]/images/[imageId]",
      "s3_delete_failed",
      e,
      { imageId, parcelRequestId },
    );
    return jsonError("Échec de la suppression du fichier sur le stockage.", 500);
  }

  await prisma.parcelRequestImage.delete({ where: { id: imageId } });

  return jsonOk({ ok: true });
}
