import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: "FORWARDER" | "CLIENT" | "ADMIN";
      forwarderId?: string;
      forwarderUserId?: string;
      forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
      clientId?: string;
    };
  }

  interface User {
    role: "FORWARDER" | "CLIENT" | "ADMIN";
    forwarderId?: string;
    forwarderUserId?: string;
    forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "FORWARDER" | "CLIENT" | "ADMIN";
    forwarderId?: string;
    forwarderUserId?: string;
    forwarderRole?: "OWNER" | "ADMIN" | "STAFF";
    clientId?: string;
  }
}
