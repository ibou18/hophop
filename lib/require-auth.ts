import { auth } from "@/auth";
import { jsonError } from "@/lib/http";
import type { NextResponse } from "next/server";

export type ForwarderCtx = {
  role: "FORWARDER";
  forwarderId: string;
  forwarderUserId: string;
  forwarderRole: "OWNER" | "ADMIN" | "STAFF";
};

export type ClientCtx = {
  role: "CLIENT";
  clientId: string;
};

export async function requireForwarder(): Promise<ForwarderCtx | NextResponse> {
  const session = await auth();
  const u = session?.user;
  if (!u || u.role !== "FORWARDER" || !u.forwarderId || !u.forwarderUserId) {
    return jsonError("Non autorisé", 401);
  }
  return {
    role: "FORWARDER",
    forwarderId: u.forwarderId,
    forwarderUserId: u.forwarderUserId,
    forwarderRole: u.forwarderRole ?? "STAFF",
  };
}

/** OWNER ou ADMIN seulement (gestion d'équipe, invitations). */
export async function requireForwarderAdmin(): Promise<ForwarderCtx | NextResponse> {
  const ctx = await requireForwarder();
  if (ctx instanceof Response) return ctx;
  if (ctx.forwarderRole === "STAFF") {
    return jsonError("Accès réservé aux administrateurs", 403);
  }
  return ctx;
}

/** OWNER seulement (suppression membres, changement de rôle). */
export async function requireForwarderOwner(): Promise<ForwarderCtx | NextResponse> {
  const ctx = await requireForwarder();
  if (ctx instanceof Response) return ctx;
  if (ctx.forwarderRole !== "OWNER") {
    return jsonError("Accès réservé au propriétaire", 403);
  }
  return ctx;
}

export async function requireClient(): Promise<ClientCtx | NextResponse> {
  const session = await auth();
  const u = session?.user;
  if (!u || u.role !== "CLIENT" || !u.clientId) {
    return jsonError("Non autorisé", 401);
  }
  return { role: "CLIENT", clientId: u.clientId };
}

export async function requireForwarderOrClient(): Promise<
  ForwarderCtx | ClientCtx | NextResponse
> {
  const session = await auth();
  const u = session?.user;
  if (!u) return jsonError("Non autorisé", 401);
  if (u.role === "FORWARDER" && u.forwarderId && u.forwarderUserId) {
    return {
      role: "FORWARDER",
      forwarderId: u.forwarderId,
      forwarderUserId: u.forwarderUserId,
      forwarderRole: u.forwarderRole ?? "STAFF",
    };
  }
  if (u.role === "CLIENT" && u.clientId) {
    return { role: "CLIENT", clientId: u.clientId };
  }
  return jsonError("Non autorisé", 401);
}
