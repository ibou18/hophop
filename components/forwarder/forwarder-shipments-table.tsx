import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ShipmentStatus } from "@/app/generated/prisma/enums";
import { shipmentStatusLabelFr } from "@/lib/shipment-status-fr";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { ForwarderShipmentListRow } from "@/lib/forwarder-shipment-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: ShipmentStatus): string {
  switch (status) {
    case "CLOSED":
      return "bg-hh-savane-lt text-hh-savane-dk ring-1 ring-hh-savane/30";
    case "IN_TRANSIT":
      return "bg-hh-saffron-lt text-hh-saffron-dk ring-1 ring-hh-saffron/35";
    case "ARRIVED":
      return "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/20";
    case "CONFIRMED":
      return "bg-white text-hh-earth-dk ring-1 ring-hh-saffron/40";
    default:
      return "bg-white text-hh-muted ring-1 ring-hh-sand-dk/30";
  }
}

export function ForwarderShipmentsTable({
  rows,
  emptyLabel = "Aucun envoi pour le moment.",
}: {
  rows: ForwarderShipmentListRow[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
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
            <TableHead className="text-hh-muted">Référence</TableHead>
            <TableHead className="text-hh-muted">Statut</TableHead>
            <TableHead className="text-hh-muted">Trajet</TableHead>
            <TableHead className="text-right text-hh-muted">Colis</TableHead>
            <TableHead className="text-right text-hh-muted">Créé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow
              key={s.id}
              className="border-hh-sand-dk/15 hover:bg-hh-sand/40"
            >
              <TableCell>
                <Link
                  href={`/shipments/${s.id}`}
                  className="font-mono text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
                >
                  {s.reference}
                </Link>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-[var(--hh-radius-md)] px-2 py-0.5 text-[11px] font-medium",
                    statusBadgeClass(s.status),
                  )}
                >
                  {shipmentStatusLabelFr(s.status)}
                </span>
              </TableCell>
              <TableCell className="text-[13px] text-hh-earth-dk">
                {countryLabelFr(s.originCountry)}
                <span className="text-hh-muted"> → </span>
                {countryLabelFr(s.destinationCountry)}
                {s.destinationCity ? (
                  <span className="text-hh-muted">
                    {" "}
                    · {s.destinationCity}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-right text-[14px] text-hh-earth-dk">
                {s._count.parcels}
              </TableCell>
              <TableCell className="text-right text-[12px] text-hh-muted">
                {formatDistanceToNow(s.createdAt, {
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
