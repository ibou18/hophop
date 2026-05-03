import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getForwarderDashboardKpis } from "@/lib/forwarder-dashboard-data";
import { ForwarderParcelsTable } from "@/components/forwarder/forwarder-parcels-table";

export default async function DashboardPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { parcelsInTransit, activeShipments, clientsCount, recentParcels } =
    await getForwarderDashboardKpis(forwarderId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-[32px] font-medium leading-tight text-hh-earth-dk">
          Tableau de bord
        </h1>
        <p className="mt-2 text-[15px] font-normal text-hh-muted">
          Bienvenue, {session.user.name ?? "transitaire"}. Vue d’ensemble de ton
          activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[var(--hh-radius-lg)] bg-hh-sand p-4 ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-normal uppercase tracking-wide text-hh-muted">
            Colis en transit
          </p>
          <p className="mt-1 text-[22px] font-medium text-hh-saffron-dk">
            {parcelsInTransit}
          </p>
          <p className="mt-2 text-[11px] font-normal text-hh-savane">
            Statut « En transit »
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] bg-hh-sand p-4 ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-normal uppercase tracking-wide text-hh-muted">
            Envois actifs
          </p>
          <p className="mt-1 text-[22px] font-medium text-hh-saffron-dk">
            {activeShipments}
          </p>
          <p className="mt-2 text-[11px] font-normal text-hh-savane">
            Confirmés, en transit ou arrivés
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] bg-hh-sand p-4 ring-1 ring-hh-sand-dk/20 sm:col-span-2 lg:col-span-1">
          <p className="text-[11px] font-normal uppercase tracking-wide text-hh-muted">
            Clients
          </p>
          <p className="mt-1 text-[22px] font-medium text-hh-saffron-dk">
            {clientsCount}
          </p>
          <p className="mt-2 text-[11px] font-normal text-hh-savane">
            <Link
              href="/clients"
              className="font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Gérer les clients
            </Link>
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[22px] font-medium text-hh-earth-dk">
              Colis récents
            </h2>
            <p className="mt-1 text-[14px] text-hh-muted">
              Les derniers colis enregistrés sur ton compte.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link
              href="/parcels"
              className="text-[14px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Voir tous les colis
            </Link>
            <Link
              href="/shipments"
              className="text-[14px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Voir les envois
            </Link>
          </div>
        </div>
        <ForwarderParcelsTable
          parcels={recentParcels}
          emptyLabel="Aucun colis pour l’instant. Les déclarations clients apparaîtront ici."
        />
      </section>
    </div>
  );
}
