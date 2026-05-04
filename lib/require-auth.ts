import { auth } from "@/auth";
import { jsonError } from "@/lib/http";
import type { NextResponse } from "next/server";

export type ForwarderCtx = {
  role: "FORWARDER";
  forwarderId: string;
};

export type ClientCtx = {
  role: "CLIENT";
  clientId: string;
};

export async function requireForwarder():
  Promise<ForwarderCtx | NextResponse> {
  const session = await auth();
  const u = session?.user;
  if (!u || u.role !== "FORWARDER" || !u.forwarderId) {
    return jsonError("Non autorisé", 401);
  }
  return { role: "FORWARDER", forwarderId: u.forwarderId };
}

export async function requireClient(): Promise<ClientCtx | NextResponse> {
  const session = await auth();
  const u = session?.user;
  if (!u || u.role !== "CLIENT" || !u.clientId) {
    return jsonError("Non autorisé", 401);
  }
  return { role: "CLIENT", clientId: u.clientId };
}

export async function requireForwarderOrClient():
  Promise<ForwarderCtx | ClientCtx | NextResponse> {
  const session = await auth();
  const u = session?.user;
  if (!u) return jsonError("Non autorisé", 401);
  if (u.role === "FORWARDER" && u.forwarderId) {
    return { role: "FORWARDER", forwarderId: u.forwarderId };
  }
  if (u.role === "CLIENT" && u.clientId) {
    return { role: "CLIENT", clientId: u.clientId };
  }
  return jsonError("Non autorisé", 401);
}
