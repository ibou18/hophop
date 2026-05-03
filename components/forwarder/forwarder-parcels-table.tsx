import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ParcelStatus } from "@/app/generated/prisma/enums";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import type { ForwarderParcelListRow } from "@/lib/forwarder-dashboard-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: ParcelStatus): string {
  switch (status) {
    case "DELIVERED":
      return "bg-hh-savane-lt text-hh-savane-dk ring-1 ring-hh-savane/30";
    case "ISSUE":
      return "bg-hh-kola-lt text-hh-kola-dk ring-1 ring-hh-kola/25";
    case "IN_TRANSIT":
      return "bg-hh-saffron-lt text-hh-saffron-dk ring-1 ring-hh-saffron/35";
    case "READY":
    case "ARRIVED":
      return "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/20";
    default:
      return "bg-white text-hh-muted ring-1 ring-hh-sand-dk/30";
  }
}

export function ForwarderParcelsTable({
  parcels,
  emptyLabel = "Aucun colis pour le moment.",
}: {
  parcels: ForwarderParcelListRow[];
  emptyLabel?: string;
}) {
  if (parcels.length === 0) {
    return (
      <p className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white px-4 py-8 text-center text-[15px] text-hh-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-hh-sand-dk/20 hover:bg-transparent">
            <TableHead className="text-hh-muted">Code suivi</TableHead>
            <TableHead className="text-hh-muted">Statut</TableHead>
            <TableHead className="text-hh-muted">Client</TableHead>
            <TableHead className="text-hh-muted">Destination</TableHead>
            <TableHead className="text-hh-muted">Envoi</TableHead>
            <TableHead className="text-right text-hh-muted">Créé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcels.map((p) => (
            <TableRow
              key={p.id}
              className="border-hh-sand-dk/15 hover:bg-hh-sand/40"
            >
              <TableCell>
                <Link
                  href={`/parcels/${p.id}`}
                  className="font-mono text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
                >
                  {p.trackingCode}
                </Link>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-[var(--hh-radius-md)] px-2 py-0.5 text-[11px] font-medium",
                    statusBadgeClass(p.status),
                  )}
                >
                  {parcelStatusLabelFr(p.status)}
                </span>
              </TableCell>
              <TableCell className="max-w-[180px] truncate text-[13px] text-hh-earth-dk">
                {p.client.firstName} {p.client.lastName}
                {p.client.email ? (
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-hh-muted">
                    {p.client.email}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-[13px] text-hh-earth-dk">
                {p.recipient.city}
                <span className="text-hh-muted"> · </span>
                {p.recipient.country}
              </TableCell>
              <TableCell className="text-[13px] text-hh-muted">
                {p.shipment?.reference ?? "—"}
              </TableCell>
              <TableCell className="text-right text-[12px] text-hh-muted">
                {formatDistanceToNow(p.createdAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
