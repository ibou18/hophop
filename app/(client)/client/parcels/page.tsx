import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Package, ArrowRight } from "lucide-react";
import { getClientParcels } from "@/lib/client-data";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { ParcelStatus } from "@/app/generated/prisma/enums";

export const metadata: Metadata = { title: "Mes colis" };

const STATUS_ORDER: ParcelStatus[] = [
  "DECLARED",
  "COLLECTED",
  "IN_TRANSIT",
  "ARRIVED",
  "READY",
  "DELIVERED",
  "ISSUE",
];

export default async function ClientParcelsPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const parcels = await getClientParcels(clientId);

  const active = parcels.filter((p) =>
    (["DECLARED", "COLLECTED", "IN_TRANSIT", "ARRIVED", "READY"] as ParcelStatus[]).includes(p.status)
  );
  const closed = parcels.filter((p) =>
    (["DELIVERED", "ISSUE"] as ParcelStatus[]).includes(p.status)
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Mes colis
          </h1>
          <p className="mt-1 text-[14px] text-hh-muted">
            {parcels.length} colis au total
          </p>
        </div>
        <Link
          href="/client/declare"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          + Déclarer
        </Link>
      </div>

      {parcels.length === 0 ? (
        <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-14 text-center">
          <Package size={36} strokeWidth={1} className="mx-auto mb-3 text-hh-sand-dk" />
          <p className="text-[15px] font-medium text-hh-earth-dk">
            Aucun colis encore
          </p>
          <p className="mt-1 text-[13px] text-hh-muted">
            Déclare ton premier colis pour démarrer le suivi.
          </p>
          <Link
            href="/client/declare"
            className="mt-5 inline-flex h-9 items-center justify-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 text-sm font-medium text-white hover:opacity-90"
          >
            Déclarer un colis
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-[15px] font-medium text-hh-earth-dk">
                En cours ({active.length})
              </h2>
              <ParcelList parcels={active} />
            </section>
          )}
          {closed.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-[15px] font-medium text-hh-muted">
                Terminés ({closed.length})
              </h2>
              <ParcelList parcels={closed} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

type ParcelRow = Awaited<ReturnType<typeof getClientParcels>>[number];

function ParcelList({ parcels }: { parcels: ParcelRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {parcels.map((parcel) => (
        <Link
          key={parcel.id}
          href={`/client/parcels/${parcel.id}`}
          className="flex items-start justify-between rounded-[var(--hh-radius-lg)] bg-white px-4 py-4 ring-1 ring-hh-sand-dk/20 transition-shadow hover:ring-hh-saffron/30"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-medium text-hh-saffron-dk">
                {parcel.trackingCode}
              </span>
              <ParcelStatusBadge status={parcel.status} />
            </div>
            <p className="mt-1 text-[14px] font-medium text-hh-earth-dk">
              {parcel.recipient.firstName} {parcel.recipient.lastName}
            </p>
            <p className="mt-0.5 text-[12px] text-hh-muted">
              {parcel.recipient.city && `${parcel.recipient.city}, `}
              {countryLabelFr(parcel.recipient.country)}
              {parcel.items.length > 0 &&
                ` · ${parcel.items.map((i) => i.name).join(", ")}`}
            </p>
          </div>
          <ArrowRight
            size={16}
            strokeWidth={1.5}
            className="ml-3 mt-1 shrink-0 text-hh-muted"
          />
        </Link>
      ))}
    </div>
  );
}
