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
  searchParams?: Promise<{ status?: string }>;
};

export default async function ParcelsPage({ searchParams }: PageProps) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const sp = (await searchParams) ?? {};
  const statusFilter = parseParcelStatusParam(sp.status);
  const parcels = await getForwarderParcels(forwarderId, statusFilter);
  const canCorrectAnyStatus = isForwarderPrivilegedRole(session.user.forwarderRole);

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
          href="/parcels"
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
            href={`/parcels?status=${s}`}
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

      <ForwarderParcelsTable
        parcels={parcels}
        canCorrectAnyStatus={canCorrectAnyStatus}
      />
    </div>
  );
}
