/** Logs structurés pour le terminal Next.js (grep: `[api:`). */

export function apiLog(
  route: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const ts = new Date().toISOString();
  if (meta && Object.keys(meta).length > 0) {
    console.info(`[${ts}] [api:${route}] ${message}`, meta);
  } else {
    console.info(`[${ts}] [api:${route}] ${message}`);
  }
}

export function apiLogError(
  route: string,
  message: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [api:${route}] ${message}`, meta ?? {}, error);
}
