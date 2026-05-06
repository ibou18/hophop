import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";
import { ClientPreferencesForm } from "@/components/client/client-preferences-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres — Hophop" };

export default async function ClientSettingsPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { locale: true, timezone: true },
  });
  if (!client) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-hh-saffron-dk" />
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Paramètres
          </h1>
        </div>
        <p className="mt-1.5 text-[14px] text-hh-muted">
          Gérez votre langue d'affichage et votre fuseau horaire.
        </p>
      </div>

      <ClientPreferencesForm
        initialLocale={client.locale}
        initialTimezone={client.timezone}
      />
    </div>
  );
}
