import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin — Hophop",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
