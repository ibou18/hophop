import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
