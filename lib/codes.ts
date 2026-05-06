/** Code transitaire 5 chiffres (spec). */
export function generateCode5(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/** Suffixe 6 caractères : sans I/O/0/1 pour limiter les confusions à la lecture. */
export const TRACKING_CODE_SUFFIX_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Préfixe codes colis (landing + PDF + QR). Anciens colis peuvent encore être en TRS-. */
export const TRACKING_CODE_PREFIX = "HOP-";

const ALLOWED_SUFFIX_CHARS = new Set(
  TRACKING_CODE_SUFFIX_CHARSET.toLowerCase().split(""),
);

/**
 * Normalise la saisie : uniquement caractères autorisés, max 6 (comme landing / QR).
 * Tolère collage `HOP-…`, `TRS-…`, ou suffixe seul.
 */
export function sanitizeTrackingCodeSuffix(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (s.startsWith("hop-")) {
    s = s.slice(4);
  } else if (s.startsWith("trs-")) {
    s = s.slice(4);
  } else if (s.startsWith("hop")) {
    s = s.slice(3).replace(/^-/, "");
  } else if (s.startsWith("trs")) {
    s = s.slice(3).replace(/^-/, "");
  }
  const out: string[] = [];
  for (const ch of s) {
    if (ALLOWED_SUFFIX_CHARS.has(ch)) out.push(ch);
    if (out.length >= 6) break;
  }
  return out.join("");
}

/** Code complet pour API / scan : préfixe courant + suffixe normalisé. */
export function fullTrackingCodeFromUserInput(raw: string): string {
  const suffix = sanitizeTrackingCodeSuffix(raw);
  return `${TRACKING_CODE_PREFIX}${suffix.toUpperCase()}`;
}

/** Code colis HOP-XXXXXX (6 caractères alphanumériques). */
export function generateTrackingCode(): string {
  const part = Array.from({ length: 6 }, () => {
    return TRACKING_CODE_SUFFIX_CHARSET[
      Math.floor(Math.random() * TRACKING_CODE_SUFFIX_CHARSET.length)
    ]!;
  }).join("");
  return `${TRACKING_CODE_PREFIX}${part}`;
}
