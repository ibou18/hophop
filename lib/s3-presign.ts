import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function getS3Client(): S3Client {
  return new S3Client({
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

/** URL publique affichable après upload (CDN, domaine bucket, etc.). */
export function publicUrlForKey(key: string): string {
  const base = process.env.S3_PUBLIC_URL_BASE?.replace(/\/$/, "");
  if (base) {
    return `${base}/${key}`;
  }
  const bucket = requireEnv("AWS_S3_BUCKET_NAME");
  const region = requireEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/** Upload direct serveur → S3 (évite le CORS navigateur sur les PUT pré-signés). */
/** Extrait la clé S3 depuis une URL publique stockée en base (path = clé). */
export function objectKeyFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, "");
    return path || null;
  } catch {
    return null;
  }
}

export async function deleteObjectByKey(key: string): Promise<void> {
  const bucket = requireEnv("AWS_S3_BUCKET_NAME");
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/** Supprime l’objet S3 si l’URL correspond à une clé sous `parcel-requests/`. */
export async function deleteParcelRequestImageFromS3(storedUrl: string): Promise<void> {
  const key = objectKeyFromPublicUrl(storedUrl);
  if (!key || !key.startsWith("parcel-requests/")) {
    throw new Error("URL d’image invalide ou hors périmètre");
  }
  await deleteObjectByKey(key);
}

export async function putObjectImage(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const bucket = requireEnv("AWS_S3_BUCKET_NAME");
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ...(process.env.S3_OBJECT_ACL === "public-read"
        ? { ACL: "public-read" as const }
        : {}),
    }),
  );
}

export function objectKeyForParcelImage(parcelId: string, contentType: string): string {
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";
  return `parcels/${parcelId}/${nanoid()}.${ext}`;
}

export function objectKeyForParcelRequestImage(requestId: string, contentType: string): string {
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";
  return `parcel-requests/${requestId}/${nanoid()}.${ext}`;
}

export function objectKeyForForwarderLogo(forwarderId: string, contentType: string): string {
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";
  return `forwarders/${forwarderId}/logo-${nanoid()}.${ext}`;
}
