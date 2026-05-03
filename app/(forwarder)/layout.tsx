import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ForwarderShell } from "@/components/forwarder/forwarder-shell";

export const metadata: Metadata = {
  title: "Espace transitaire",
};

export default async function ForwarderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "FORWARDER") {
    redirect("/login");
  }

  return (
    <ForwarderShell
      user={{
        name: session.user.name ?? "Transitaire",
        email: session.user.email ?? "",
      }}
    >
      {children}
    </ForwarderShell>
  );
}
