import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const forwarder = await prisma.forwarder.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!forwarder?.isActive) return null;
        const ok = await compare(password, forwarder.passwordHash);
        if (!ok) return null;
        return {
          id: forwarder.id,
          email: forwarder.email,
          name: forwarder.name,
          role: "FORWARDER" as const,
          forwarderId: forwarder.id,
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
        if (!client?.passwordHash) return null;
        const ok = await compare(password, client.passwordHash);
        if (!ok) return null;
        return {
          id: client.id,
          email: client.email ?? undefined,
          name: `${client.firstName} ${client.lastName}`,
          role: "CLIENT" as const,
          forwarderId: client.forwarderId,
          clientId: client.id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && "role" in user) {
        const u = user as import("next-auth").User & {
          role: "FORWARDER" | "CLIENT";
          forwarderId: string;
          clientId?: string;
        };
        token.role = u.role;
        token.forwarderId = u.forwarderId;
        token.clientId = u.clientId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const t = token as import("next-auth/jwt").JWT & {
          role: "FORWARDER" | "CLIENT";
          forwarderId: string;
          clientId?: string;
        };
        session.user.role = t.role;
        session.user.forwarderId = t.forwarderId;
        session.user.clientId = t.clientId;
      }
      return session;
    },
  },
});
