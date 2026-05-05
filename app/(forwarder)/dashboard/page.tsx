import Link from "next/link";
import { Share2, ShieldOff } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getForwarderDashboardKpis, getUpcomingShipments } from "@/lib/forwarder-dashboard-data";
import { ForwarderParcelsTable } from "@/components/forwarder/forwarder-parcels-table";
import { ShareProfileButton } from "@/components/forwarder/share-profile-button";
import { UpcomingShipmentsWidget } from "@/components/forwarder/upcoming-shipments-widget";
import { ParcelsToConfirmWidget } from "@/components/forwarder/parcels-to-confirm-widget";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ blocked?: string }>;
}) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const sp = await searchParams;
  const blockedPage = sp?.blocked;

  const [{ parcelsInTransit, activeShipments, clientsCount, recentParcels, parcelsToConfirm }, forwarder, upcomingShipments] =
    await Promise.all([
      getForwarderDashboardKpis(forwarderId),
      prisma.forwarder.findUnique({
        where: { id: forwarderId },
        select: { code5: true, name: true },
      }),
      getUpcomingShipments(forwarderId, 10),
    ]);

  const BLOCKED_LABELS: Record<string, string> = {
    settings: "les paramètres de l'agence",
    tariffs: "la grille tarifaire",
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Bandeau accès refusé pour STAFF */}
      {blockedPage && BLOCKED_LABELS[blockedPage] && (
        <div className="flex items-center gap-3 rounded-[var(--hh-radius-lg)] bg-hh-kola-lt px-4 py-3 ring-1 ring-hh-kola/20">
          <ShieldOff size={16} className="shrink-0 text-hh-kola-dk" />
          <p className="text-[14px] text-hh-kola-dk">
            Accès refusé — seuls les administrateurs et le propriétaire peuvent accéder à{" "}
            <strong>{BLOCKED_LABELS[blockedPage]}</strong>.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-tight text-hh-earth-dk">
            Tableau de bord
          </h1>
          <p className="mt-2 text-[15px] font-normal text-hh-muted">
            Bienvenue, {session.user.name ?? "transitaire"}. Vue d’ensemble de ton
            activité.
          </p>
        </div>
        {forwarder && (
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-1.5 text-xs font-medium text-hh-muted">
              <Share2 size={12} />
              Ma page publique
            </div>
            <ShareProfileButton code5={forwarder.code5} />
          </div>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 shadow-sm ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Colis en transit
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-hh-saffron-dk">
            {parcelsInTransit}
          </p>
          <p className="mt-2 text-[12px] text-hh-savane">
            Statut « En transit »
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 shadow-sm ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Envois actifs
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-hh-saffron-dk">
            {activeShipments}
          </p>
          <p className="mt-2 text-[12px] text-hh-savane">
            Confirmés, en transit ou arrivés
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 shadow-sm ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Clients
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-hh-saffron-dk">
            {clientsCount}
          </p>
          <p className="mt-2 text-[12px] text-hh-savane">
            <Link
              href="/clients"
              className="font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Gérer les clients
            </Link>
          </p>
        </div>
        <div className={`rounded-[var(--hh-radius-lg)] p-4 shadow-sm ring-1 col-span-2 lg:col-span-1 ${
          parcelsToConfirm.length > 0
            ? "bg-amber-50 ring-amber-200/70"
            : "bg-white ring-hh-sand-dk/20"
        }`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            À confirmer
          </p>
          <p className={`mt-2 text-[28px] font-semibold leading-none ${
            parcelsToConfirm.length > 0 ? "text-amber-600" : "text-hh-saffron-dk"
          }`}>
            {parcelsToConfirm.length}
          </p>
          <p className="mt-2 text-[12px] text-hh-savane">
            {parcelsToConfirm.length > 0
              ? "Colis déclarés en attente"
              : "Aucun colis en attente"}
          </p>
        </div>
      </div>

      {/* Colis à confirmer */}
      {parcelsToConfirm.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-medium text-hh-earth-dk">
                Colis à confirmer
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[13px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  {parcelsToConfirm.length}
                </span>
              </h2>
              <p className="mt-0.5 text-[14px] text-hh-muted">
                Colis déclarés par vos clients en attente de prise en charge.
              </p>
            </div>
            <Link
              href="/parcels?status=DECLARED"
              className="text-[14px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Voir tous
            </Link>
          </div>
          <ParcelsToConfirmWidget parcels={parcelsToConfirm} />
        </section>
      )}

      {/* Upcoming shipments */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-medium text-hh-earth-dk">
              Prochains départs
            </h2>
            <p className="mt-0.5 text-[14px] text-hh-muted">
              Envois confirmés triés par date de départ.
            </p>
          </div>
          <Link
            href="/shipments"
            className="text-[14px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
          >
            Tous les envois
          </Link>
        </div>
        <UpcomingShipmentsWidget shipments={upcomingShipments} />
      </section>

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
