import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPublishedShipmentsCatalog } from "@/lib/client-data";
import { ShipmentsCatalog } from "@/components/client/shipments-catalog";

export const metadata: Metadata = {
  title: "Envois publics",
  description: "Départs publiés par les transitaires sur Hophop",
};

export default async function ClientShipmentsCatalogPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const rows = await getPublishedShipmentsCatalog();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Envois publics
        </h1>
        <p className="mt-1.5 text-[15px] text-hh-muted">
          Tous les départs ouverts publiés par les transitaires. Ouvre une fiche
          pour rejoindre un transitaire ou associer un colis à un envoi.
        </p>
      </div>

      <ShipmentsCatalog rows={rows} />
    </div>
  );
}
