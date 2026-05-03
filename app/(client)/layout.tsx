import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/client/client-shell";

export const metadata: Metadata = {
  title: "Espace client",
};

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <ClientShell
      user={{
        name: session.user.name ?? "Client",
        email: session.user.email ?? "",
      }}
    >
      {children}
    </ClientShell>
  );
}
