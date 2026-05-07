import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getForwarderParcels,
  parseParcelStatusParam,
} from "@/lib/forwarder-dashboard-data";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { ForwarderParcelsTable } from "@/components/forwarder/forwarder-parcels-table";
import { ParcelStatus } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { isForwarderPrivilegedRole } from "@/lib/parcel-status-workflow";

const FILTER_ORDER: ParcelStatus[] = [
  ParcelStatus.IN_TRANSIT,
  ParcelStatus.DECLARED,
  ParcelStatus.COLLECTED,
  ParcelStatus.ARRIVED,
  ParcelStatus.READY,
  ParcelStatus.DELIVERED,
  ParcelStatus.ISSUE,
];

type PageProps = {
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
};

export default async function ParcelsPage({ searchParams }: PageProps) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const sp = (await searchParams) ?? {};
  const statusFilter = parseParcelStatusParam(sp.status);
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const parsedPage =
    typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parcelsData = await getForwarderParcels(forwarderId, statusFilter, query, page, 20);
  const canCorrectAnyStatus = isForwarderPrivilegedRole(session.user.forwarderRole);

  function parcelsHref({
    status,
    q,
    page: nextPage,
  }: {
    status?: ParcelStatus;
    q?: string;
    page?: number;
  }): string {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q && q.trim().length > 0) params.set("q", q.trim());
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/parcels?${qs}` : "/parcels";
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-medium text-hh-earth-dk">Colis</h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Tous les colis de tes expéditeurs — suivi, statut et détail.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={parcelsHref({ q: query })}
          className={cn(
            "rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors",
            !statusFilter
              ? "bg-hh-saffron/20 text-hh-earth-dk ring-hh-saffron/40"
              : "bg-white text-hh-muted ring-hh-sand-dk/30 hover:bg-hh-sand",
          )}
        >
          Tous
        </Link>
        {FILTER_ORDER.map((s) => (
          <Link
            key={s}
            href={parcelsHref({ status: s, q: query })}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors",
              statusFilter === s
                ? "bg-hh-saffron/20 text-hh-earth-dk ring-hh-saffron/40"
                : "bg-white text-hh-muted ring-hh-sand-dk/30 hover:bg-hh-sand",
            )}
          >
            {parcelStatusLabelFr(s)}
          </Link>
        ))}
      </div>

      <form action="/parcels" method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Rechercher par téléphone, prénom, nom ou email"
          className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
        />
        <button
          type="submit"
          className="h-10 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white transition-colors hover:bg-hh-saffron-dk"
        >
          Rechercher
        </button>
      </form>

      <ForwarderParcelsTable
        parcels={parcelsData.items}
        canCorrectAnyStatus={canCorrectAnyStatus}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-hh-muted">
        <p>
          {parcelsData.total} résultat{parcelsData.total > 1 ? "s" : ""} · Page{" "}
          {parcelsData.page} / {parcelsData.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={parcelsHref({
              status: statusFilter,
              q: query,
              page: Math.max(1, parcelsData.page - 1),
            })}
            aria-disabled={parcelsData.page <= 1}
            className={cn(
              "rounded-[var(--hh-radius-md)] border px-3 py-1.5 font-medium transition-colors",
              parcelsData.page <= 1
                ? "pointer-events-none border-hh-sand-dk/20 text-hh-muted/60"
                : "border-hh-sand-dk/35 text-hh-earth-dk hover:bg-hh-sand",
            )}
          >
            Précédent
          </Link>
          <Link
            href={parcelsHref({
              status: statusFilter,
              q: query,
              page: Math.min(parcelsData.totalPages, parcelsData.page + 1),
            })}
            aria-disabled={parcelsData.page >= parcelsData.totalPages}
            className={cn(
              "rounded-[var(--hh-radius-md)] border px-3 py-1.5 font-medium transition-colors",
              parcelsData.page >= parcelsData.totalPages
                ? "pointer-events-none border-hh-sand-dk/20 text-hh-muted/60"
                : "border-hh-sand-dk/35 text-hh-earth-dk hover:bg-hh-sand",
            )}
          >
            Suivant
          </Link>
        </div>
      </div>
    </div>
  );
}
