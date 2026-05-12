"use client";

import { PARCEL_IMAGE_MAX_BYTES } from "@/lib/image-file-types";

export async function uploadParcelRequestImagesViaApi(
  parcelRequestId: string,
  files: File[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const slice = files.slice(0, 10);
  for (const f of slice) {
    if (f.size > PARCEL_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: `Photo trop volumineuse (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).`,
      };
    }
  }

  const fd = new FormData();
  for (const f of slice) {
    fd.append("files", f);
  }

  let res: Response;
  try {
    res = await fetch(`/api/parcel-requests/${parcelRequestId}/upload-images`, {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, error: "Erreur réseau pendant l'upload des photos." };
  }

  const raw = (await res.json().catch(() => null)) as
    | { ok?: boolean; count?: number; error?: string }
    | null;

  if (!res.ok) {
    const msg =
      typeof raw === "object" && raw && typeof raw.error === "string"
        ? raw.error
        : `Échec de l'upload (${res.status}).`;
    return { ok: false, error: msg };
  }

  const count = typeof raw?.count === "number" ? raw.count : slice.length;
  return { ok: true, count };
}
