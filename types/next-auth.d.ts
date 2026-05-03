import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: "FORWARDER" | "CLIENT";
      forwarderId: string;
      clientId?: string;
    };
  }

  interface User {
    role: "FORWARDER" | "CLIENT";
    forwarderId: string;
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "FORWARDER" | "CLIENT";
    forwarderId: string;
    clientId?: string;
  }
}
