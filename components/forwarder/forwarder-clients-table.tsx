import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { countryLabelFr } from "@/lib/country-label-fr";
import { authMethodLabelFr } from "@/lib/auth-method-fr";
import type { ForwarderClientListRow } from "@/lib/forwarder-client-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ForwarderClientsTable({
  rows,
  emptyLabel = "Aucun client pour le moment.",
}: {
  rows: ForwarderClientListRow[];
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
            <TableHead className="text-hh-muted">Client</TableHead>
            <TableHead className="text-hh-muted">Contact</TableHead>
            <TableHead className="text-hh-muted">Lieu</TableHead>
            <TableHead className="text-hh-muted">Connexion</TableHead>
            <TableHead className="text-right text-hh-muted">Colis</TableHead>
            <TableHead className="text-right text-hh-muted">Inscrit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow
              key={c.id}
              className="border-hh-sand-dk/15 hover:bg-hh-sand/40"
            >
              <TableCell>
                <Link
                  href={`/clients/${c.id}`}
                  className="text-[15px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
                >
                  {c.firstName} {c.lastName}
                </Link>
              </TableCell>
              <TableCell className="max-w-[200px]">
                {c.email ? (
                  <span className="block truncate text-[13px] text-hh-earth-dk">
                    {c.email}
                  </span>
                ) : null}
                {c.phone ? (
                  <span className="block truncate text-[12px] text-hh-muted">
                    {c.phone}
                  </span>
                ) : null}
                {!c.email && !c.phone ? (
                  <span className="text-[13px] text-hh-muted">—</span>
                ) : null}
              </TableCell>
              <TableCell className="text-[13px] text-hh-earth-dk">
                {c.city ? `${c.city} · ` : null}
                {countryLabelFr(c.country)}
              </TableCell>
              <TableCell className="text-[12px] text-hh-muted">
                {authMethodLabelFr(c.authMethod)}
              </TableCell>
              <TableCell className="text-right text-[14px] text-hh-earth-dk">
                {c._count.parcels}
                <span className="block text-[11px] font-normal text-hh-muted">
                  {c._count.recipients} dest.
                </span>
              </TableCell>
              <TableCell className="text-right text-[12px] text-hh-muted">
                {formatDistanceToNow(c.createdAt, {
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
