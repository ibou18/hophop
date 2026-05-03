import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getForwarderShipments,
  parseShipmentStatusParam,
} from "@/lib/forwarder-shipment-data";
import { shipmentStatusLabelFr } from "@/lib/shipment-status-fr";
import { ForwarderShipmentsTable } from "@/components/forwarder/forwarder-shipments-table";
import { ShipmentStatus } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

const FILTER_ORDER: ShipmentStatus[] = [
  ShipmentStatus.DRAFT,
  ShipmentStatus.CONFIRMED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.ARRIVED,
  ShipmentStatus.CLOSED,
];

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const sp = (await searchParams) ?? {};
  const statusFilter = parseShipmentStatusParam(sp.status);
  const rows = await getForwarderShipments(forwarderId, statusFilter);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium text-hh-earth-dk">Envois</h1>
          <p className="mt-2 text-[15px] text-hh-muted">
            Lots regroupant plusieurs colis — création, affectation, départ et
            arrivée.
          </p>
        </div>
        <Link
          href="/shipments/new"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[14px] font-medium text-white transition-colors hover:bg-hh-saffron-dk"
        >
          Nouvel envoi
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/shipments"
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
            href={`/shipments?status=${s}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors",
              statusFilter === s
                ? "bg-hh-saffron/20 text-hh-earth-dk ring-hh-saffron/40"
                : "bg-white text-hh-muted ring-hh-sand-dk/30 hover:bg-hh-sand",
            )}
          >
            {shipmentStatusLabelFr(s)}
          </Link>
        ))}
      </div>

      <ForwarderShipmentsTable rows={rows} />
    </div>
  );
}
