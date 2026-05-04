export const PARCEL_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const FORWARDER_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Types MIME autorisés pour les uploads image (zod / validation fichier). */
export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export function normalizeImageContentType(file: File): string | null {
  const t = file.type?.toLowerCase();
  if (t && ALLOWED.has(t)) return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return null;
}
