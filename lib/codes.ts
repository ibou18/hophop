/** Code transitaire 5 chiffres (spec). */
export function generateCode5(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const TRACKING_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Code colis TRS-XXXXXX (spec). */
export function generateTrackingCode(): string {
  const part = Array.from({ length: 6 }, () => {
    return TRACKING_CHARS[Math.floor(Math.random() * TRACKING_CHARS.length)]!;
  }).join("");
  return `TRS-${part}`;
}
