import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Package, PlusCircle, Users, ArrowRight } from "lucide-react";
import { getClientDashboardData } from "@/lib/client-data";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { countryLabelFr } from "@/lib/country-label-fr";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const { activeParcels, recentParcels, recipientsCount } =
    await getClientDashboardData(clientId);

  const firstName = session.user.name?.split(" ")[0] ?? "client";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Hero greeting */}
      <div>
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Bonjour, {firstName} 👋
        </h1>
        <p className="mt-1.5 text-[15px] text-hh-muted">
          Voici l'état de tes envois en cours.
        </p>
      </div>

      {/* Quick action */}
      <Link
        href="/client/declare"
        className="flex items-center justify-between rounded-[var(--hh-radius-lg)] bg-hh-saffron px-5 py-4 text-white shadow-sm transition-opacity hover:opacity-90"
      >
        <div className="flex items-center gap-3">
          <PlusCircle size={22} strokeWidth={1.5} />
          <div>
            <p className="text-[15px] font-medium">Déclarer un colis</p>
            <p className="text-[12px] opacity-80">
              Rapide — sélection par icônes
            </p>
          </div>
        </div>
        <ArrowRight size={18} strokeWidth={1.5} />
      </Link>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-normal uppercase tracking-wide text-hh-muted">
            Colis actifs
          </p>
          <p className="mt-1 text-[26px] font-medium text-hh-saffron-dk">
            {activeParcels}
          </p>
          <p className="mt-1 text-[11px] text-hh-savane">
            Déclarés → Prêts au retrait
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 ring-1 ring-hh-sand-dk/20">
          <p className="text-[11px] font-normal uppercase tracking-wide text-hh-muted">
            Proches enregistrés
          </p>
          <p className="mt-1 text-[26px] font-medium text-hh-saffron-dk">
            {recipientsCount}
          </p>
          <Link
            href="/client/recipients"
            className="mt-1 block text-[11px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
          >
            Gérer mes proches
          </Link>
        </div>
      </div>

      {/* Recent parcels */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-medium text-hh-earth-dk">
            Colis récents
          </h2>
          <Link
            href="/client/parcels"
            className="flex items-center gap-1 text-[13px] font-medium text-hh-saffron-dk hover:underline underline-offset-2"
          >
            Tout voir
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

        {recentParcels.length === 0 ? (
          <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-10 text-center">
            <Package
              size={32}
              strokeWidth={1}
              className="mx-auto mb-3 text-hh-sand-dk"
            />
            <p className="text-[14px] font-medium text-hh-earth-dk">
              Aucun colis déclaré
            </p>
            <p className="mt-1 text-[13px] text-hh-muted">
              Déclare ton premier colis pour le suivre ici.
            </p>
            <Link
              href="/client/declare"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 text-sm font-medium text-white hover:opacity-90"
            >
              Déclarer un colis
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentParcels.map((parcel) => (
              <Link
                key={parcel.id}
                href={`/client/parcels/${parcel.id}`}
                className="flex items-center justify-between rounded-[var(--hh-radius-lg)] bg-white px-4 py-3.5 ring-1 ring-hh-sand-dk/20 transition-shadow hover:ring-hh-saffron/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-medium text-hh-saffron-dk">
                      {parcel.trackingCode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-hh-earth-dk">
                    Dest.&nbsp;
                    <span className="font-medium">
                      {parcel.recipient.firstName} {parcel.recipient.lastName}
                    </span>
                    {parcel.recipient.city
                      ? ` · ${parcel.recipient.city}`
                      : ""}
                    {", "}
                    {countryLabelFr(parcel.recipient.country)}
                  </p>
                </div>
                <div className="ml-3 shrink-0">
                  <ParcelStatusBadge status={parcel.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
