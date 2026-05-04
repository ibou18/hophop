/** Date du jour au format `YYYY-MM-DD` en UTC (aligne SSR et hydratation client). */
export function isoDateUtcToday(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
