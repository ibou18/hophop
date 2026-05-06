/** Code transitaire 5 chiffres (spec). */
export function generateCode5(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/** Suffixe 6 caractères : sans I/O/0/1 pour limiter les confusions à la lecture. */
export const TRACKING_CODE_SUFFIX_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Préfixe codes colis (landing + PDF + QR). Anciens colis peuvent encore être en TRS-. */
export const TRACKING_CODE_PREFIX = "HOP-";

/** Code colis HOP-XXXXXX (6 caractères alphanumériques). */
export function generateTrackingCode(): string {
  const part = Array.from({ length: 6 }, () => {
    return TRACKING_CODE_SUFFIX_CHARSET[
      Math.floor(Math.random() * TRACKING_CODE_SUFFIX_CHARSET.length)
    ]!;
  }).join("");
  return `${TRACKING_CODE_PREFIX}${part}`;
}
