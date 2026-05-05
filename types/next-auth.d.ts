import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: "FORWARDER" | "CLIENT";
      forwarderId?: string;     // Only set for FORWARDER sessions
      forwarderUserId?: string; // ID du ForwarderUser connecté
      forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
      clientId?: string;        // Only set for CLIENT sessions
    };
  }

  interface User {
    role: "FORWARDER" | "CLIENT";
    forwarderId?: string;
    forwarderUserId?: string;
    forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "FORWARDER" | "CLIENT";
    forwarderId?: string;
    forwarderUserId?: string;
    forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
    clientId?: string;
  }
}
