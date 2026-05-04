import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { FORWARDER_LOGO_MAX_BYTES, normalizeImageContentType } from "@/lib/image-file-types";
import {
  objectKeyForForwarderLogo,
  publicUrlForKey,
  putObjectImage,
} from "@/lib/s3-presign";
import { apiLog, apiLogError } from "@/lib/server-api-log";

export const maxDuration = 60;

function isFile(x: unknown): x is File {
  return (
    typeof x === "object" &&
    x !== null &&
    "arrayBuffer" in x &&
    typeof (x as File).arrayBuffer === "function"
  );
}

function missingS3Config(): boolean {
  const needed = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
  ];
  return needed.some((k) => !process.env[k]);
}

/** Une image logo — passage par le serveur pour éviter le CORS S3 (PUT pré-signé). */
export async function POST(req: Request) {
  if (missingS3Config()) {
    apiLog("POST /api/uploads/forwarder-logo", "s3_env_missing");
    return jsonError(
      "Stockage fichiers non configuré (variables AWS / AWS_S3_BUCKET_NAME).",
      503,
    );
  }

  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const h = req.headers.get("content-type") || "";
  if (!h.includes("multipart/form-data")) {
    return jsonError("multipart/form-data requis (champ file)", 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    apiLogError("POST /api/uploads/forwarder-logo", "formData_parse_failed", e, {});
    return jsonError("Corps de requête invalide ou trop volumineux", 413);
  }

  const f = formData.get("file");
  if (!isFile(f)) {
    return jsonError("Champ file manquant", 400);
  }
  if (f.size > FORWARDER_LOGO_MAX_BYTES) {
    return jsonError(
      `Fichier trop volumineux (max ${Math.round(FORWARDER_LOGO_MAX_BYTES / 1024 / 1024)} Mo)`,
      400,
    );
  }

  const contentType = normalizeImageContentType(f);
  if (!contentType) {
    return jsonError("Type d’image non autorisé", 400);
  }

  const key = objectKeyForForwarderLogo(auth.forwarderId, contentType);

  try {
    const buf = Buffer.from(await f.arrayBuffer());
    await putObjectImage({ key, body: buf, contentType });
  } catch (error) {
    apiLogError(
      "POST /api/uploads/forwarder-logo",
      "put_failed",
      error,
      { forwarderId: auth.forwarderId, key },
    );
    return jsonError("Échec de l’upload", 500);
  }

  const url = publicUrlForKey(key);
  apiLog("POST /api/uploads/forwarder-logo", "ok", {
    forwarderId: auth.forwarderId,
    key,
  });

  return jsonOk({ url });
}
