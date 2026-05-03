import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : (init?.status ?? 200);
  return NextResponse.json(data, typeof init === "number" ? { status } : { ...init, status });
}

export function jsonError(
  message: string,
  status: number,
  extras?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, ...extras }, { status });
}
