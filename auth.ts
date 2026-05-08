import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "ibdiallo.ca@gmail.com").toLowerCase();
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [
    Credentials({
      id: "forwarder-credentials",
      name: "Forwarder",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // ── 1. Authentification via ForwarderUser (nouveau système) ──
        const fwUser = await prisma.forwarderUser.findUnique({
          where: { email },
          include: {
            forwarder: { select: { id: true, name: true, isActive: true } },
          },
        });

        if (fwUser && fwUser.isActive && fwUser.forwarder.isActive && fwUser.passwordHash) {
          const ok = await compare(password, fwUser.passwordHash);
          if (!ok) return null;
          return {
            id: fwUser.id,
            email: fwUser.email,
            name: `${fwUser.firstName} ${fwUser.lastName}`,
            role: "FORWARDER" as const,
            forwarderId: fwUser.forwarderId,
            forwarderUserId: fwUser.id,
            forwarderRole: fwUser.role as "OWNER" | "ADMIN" | "STAFF",
          };
        }

        // ── 2. Fallback legacy : Forwarder.email + passwordHash ──
        // Permet aux anciens comptes de continuer à se connecter.
        // Un ForwarderUser OWNER est auto-créé au premier login.
        const forwarder = await prisma.forwarder.findUnique({
          where: { email },
        });
        if (!forwarder?.isActive || !forwarder.passwordHash) return null;
        const ok = await compare(password, forwarder.passwordHash);
        if (!ok) return null;

        // Auto-création du ForwarderUser OWNER si inexistant
        const nameParts = forwarder.name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? forwarder.name;
        const lastName = nameParts.slice(1).join(" ") || "—";

        const owner = await prisma.forwarderUser.upsert({
          where: { email: forwarder.email },
          create: {
            forwarderId: forwarder.id,
            email: forwarder.email,
            firstName,
            lastName,
            passwordHash: forwarder.passwordHash,
            role: "OWNER",
          },
          update: {}, // déjà créé → rien à faire
        });

        return {
          id: owner.id,
          email: owner.email,
          name: forwarder.name,
          role: "FORWARDER" as const,
          forwarderId: forwarder.id,
          forwarderUserId: owner.id,
          forwarderRole: "OWNER" as const,
        };
      },
    }),

    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        secret: { label: "Secret", type: "password" },
      },
      authorize: async (credentials) => {
        if (!ADMIN_SECRET) return null;
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const secret = credentials?.secret as string | undefined;
        if (!email || !secret) return null;
        if (email !== ADMIN_EMAIL) return null;
        if (secret !== ADMIN_SECRET) return null;
        return {
          id: "admin",
          email: ADMIN_EMAIL,
          name: "Admin",
          role: "ADMIN" as const,
        };
      },
    }),

    Credentials({
      id: "client-credentials",
      name: "Client",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const password = credentials?.password as string | undefined;
        const email = (credentials?.email as string | undefined)?.trim()?.toLowerCase();
        const phone = (credentials?.phone as string | undefined)?.trim();
        if (!password || (!email && !phone)) return null;
        const client = await prisma.client.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
            isActive: true,
          },
        });
        if (client && !client.passwordHash) {
          // Compte créé par un transitaire, non encore activé
          throw new Error("ACCOUNT_NOT_CLAIMED");
        }
        if (!client?.passwordHash) return null;
        const ok = await compare(password, client.passwordHash);
        if (!ok) return null;
        return {
          id: client.id,
          email: client.email ?? undefined,
          name: `${client.firstName} ${client.lastName}`,
          role: "CLIENT" as const,
          clientId: client.id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && "role" in user) {
        const u = user as import("next-auth").User & {
          role: "FORWARDER" | "CLIENT" | "ADMIN";
          forwarderId?: string;
          forwarderUserId?: string;
          forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
          clientId?: string;
        };
        token.role = u.role;
        if (u.forwarderId) token.forwarderId = u.forwarderId;
        if (u.forwarderUserId) token.forwarderUserId = u.forwarderUserId;
        if (u.forwarderRole) token.forwarderRole = u.forwarderRole;
        if (u.clientId) token.clientId = u.clientId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const t = token as import("next-auth/jwt").JWT & {
          role: "FORWARDER" | "CLIENT" | "ADMIN";
          forwarderId?: string;
          forwarderUserId?: string;
          forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
          clientId?: string;
        };
        session.user.role = t.role;
        if (t.forwarderId) session.user.forwarderId = t.forwarderId;
        if (t.forwarderUserId) session.user.forwarderUserId = t.forwarderUserId;
        if (t.forwarderRole) session.user.forwarderRole = t.forwarderRole;
        if (t.clientId) session.user.clientId = t.clientId;
      }
      return session;
    },
  },
});
