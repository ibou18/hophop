"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Car, Package } from "lucide-react";
import type {
  AssignableParcelRow,
  ParcelAssignmentListRow,
} from "@/lib/forwarder-shipment-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { Country } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatRouteEndpoint(city: string | null | undefined, country: Country): string {
  const c = city?.trim();
  return c ? `${c} · ${countryLabelFr(country)}` : countryLabelFr(country);
}

function ParcelRouteLines({ row }: { row: ParcelAssignmentListRow }) {
  const origin = formatRouteEndpoint(row.client.city, row.client.country);
  const dest = formatRouteEndpoint(row.recipient.city, row.recipient.country);

  return (
    <div className="mt-1.5 space-y-1 text-[12px] leading-snug">
      <p>
        <span className="font-semibold text-hh-muted">Départ </span>
        <span className="text-hh-earth-dk">{origin}</span>
        <span className="text-hh-muted"> (expéditeur)</span>
      </p>
      <p>
        <span className="font-semibold text-hh-muted">Arrivée </span>
        <span className="text-hh-earth-dk">{dest}</span>
        <span className="text-hh-muted"> (destinataire)</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {row.vehicle ? (
          <span className="inline-flex items-center gap-1 rounded-[var(--hh-radius-md)] bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200">
            <Car className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Véhicule · {row.vehicle.year} {row.vehicle.make} {row.vehicle.model}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-[var(--hh-radius-md)] bg-hh-sand/80 px-2 py-0.5 text-[11px] font-medium text-hh-earth-dk ring-1 ring-hh-sand-dk/25">
            <Package className="size-3.5 shrink-0 text-hh-muted" strokeWidth={2} aria-hidden />
            Colis
          </span>
        )}
      </div>
    </div>
  );
}

export function ShipmentParcelsAssignment({
  shipmentId,
  editable,
  assignableParcels,
  inShipmentParcels,
  routeSummary,
  shipmentAcceptsVehicles,
}: {
  shipmentId: string;
  editable: boolean;
  assignableParcels: AssignableParcelRow[];
  inShipmentParcels: ParcelAssignmentListRow[];
  /** Route de l’envoi (ex. France → Guinée) — affichée dans l’aide et l’état vide. */
  routeSummary: string;
  shipmentAcceptsVehicles: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [assignIds, setAssignIds] = useState<Set<string>>(() => new Set());
  const [unassignIds, setUnassignIds] = useState<Set<string>>(() => new Set());

  const assignListKey = useMemo(
    () => assignableParcels.map((p) => p.id).join(","),
    [assignableParcels],
  );

  async function patchParcels(
    parcelIds: string[],
    action: "assign" | "unassign",
  ): Promise<{ ok: boolean; message?: string }> {
    if (parcelIds.length === 0) {
      return { ok: false, message: "Sélectionne au moins un colis." };
    }
    const res = await fetch(`/api/shipments/${shipmentId}/parcels`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ parcelIds, action }),
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return { ok: false, message: j?.error };
    return { ok: true };
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runAssign(): void {
    setError(null);
    startTransition(async () => {
      const r = await patchParcels([...assignIds], "assign");
      if (!r.ok) {
        setError(r.message ?? "Affectation impossible");
        return;
      }
      setAssignIds(new Set());
      router.refresh();
    });
  }

  function runUnassign(): void {
    setError(null);
    startTransition(async () => {
      const r = await patchParcels([...unassignIds], "unassign");
      if (!r.ok) {
        setError(r.message ?? "Retrait impossible");
        return;
      }
      setUnassignIds(new Set());
      router.refresh();
    });
  }

  if (!editable) return null;

  return (
    <div key={assignListKey} className="space-y-6">
      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Ajouter des colis au lot
        </h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Colis au statut « Collecté », non affectés, dont la route correspond à cet
          envoi :{" "}
          <span className="font-medium text-hh-earth-dk">{routeSummary}</span>
          {shipmentAcceptsVehicles
            ? " (colis classiques ou véhicules)."
            : " (colis classiques uniquement — pas de dossiers véhicule)."}
        </p>
        {assignableParcels.length === 0 ? (
          <p className="mt-4 rounded-[var(--hh-radius-md)] border border-dashed border-hh-sand-dk/40 bg-hh-sand/30 px-4 py-6 text-center text-[13px] text-hh-muted">
            Aucun colis collecté ne correspond à cette route pour le moment. Vérifie
            les pays de l’expéditeur et du destinataire sur les fiches colis, ou crée
            un envoi dont la route correspond au colis.
          </p>
        ) : (
          <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-[var(--hh-radius-md)] border border-hh-sand-dk/20 p-3">
            {assignableParcels.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "rounded-[var(--hh-radius-md)] border border-transparent px-2 py-2 transition-colors",
                  p.vehicle ? "border-indigo-100 bg-indigo-50/40" : "bg-hh-sand/25",
                )}
              >
                <div className="flex items-start gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    id={`assign-${p.id}`}
                    checked={assignIds.has(p.id)}
                    disabled={pending}
                    onChange={() => toggle(setAssignIds, p.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <label htmlFor={`assign-${p.id}`} className="cursor-pointer">
                        <span className="font-mono font-medium text-hh-saffron-dk">
                          {p.trackingCode}
                        </span>
                        <span className="block text-[13px] text-hh-earth-dk">
                          {p.client.firstName} {p.client.lastName}
                        </span>
                      </label>
                      <Link
                        href={`/parcels/${p.id}?fromShipment=${shipmentId}`}
                        className="shrink-0 text-[12px] font-medium text-hh-saffron-dk hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Fiche colis
                      </Link>
                    </div>
                    <ParcelRouteLines row={p} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          className="mt-3 bg-hh-saffron text-white hover:bg-hh-saffron-dk"
          disabled={pending || assignIds.size === 0 || assignableParcels.length === 0}
          onClick={runAssign}
        >
          Affecter à cet envoi
        </Button>
      </section>

      {inShipmentParcels.length > 0 ? (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Retirer des colis du lot
          </h2>
          <p className="mt-1 text-[13px] text-hh-muted">
            Possible tant que l’envoi est en brouillon ou confirmé.
          </p>
          <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-[var(--hh-radius-md)] border border-hh-sand-dk/20 p-3">
            {inShipmentParcels.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "rounded-[var(--hh-radius-md)] border border-transparent px-2 py-2",
                  p.vehicle ? "border-indigo-100 bg-indigo-50/40" : "bg-hh-sand/25",
                )}
              >
                <div className="flex items-start gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    id={`unassign-${p.id}`}
                    checked={unassignIds.has(p.id)}
                    disabled={pending}
                    onChange={() => toggle(setUnassignIds, p.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <label
                        htmlFor={`unassign-${p.id}`}
                        className="cursor-pointer"
                      >
                        <span className="font-mono font-medium text-hh-earth-dk">
                          {p.trackingCode}
                        </span>
                        <span className="block text-[13px] font-normal text-hh-earth-dk">
                          {p.client.firstName} {p.client.lastName}
                        </span>
                      </label>
                      <Link
                        href={`/parcels/${p.id}?fromShipment=${shipmentId}`}
                        className="shrink-0 text-[12px] font-medium text-hh-saffron-dk hover:underline"
                      >
                        Fiche colis
                      </Link>
                    </div>
                    <ParcelRouteLines row={p} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-3 border-hh-kola/30 text-hh-kola-dk hover:bg-hh-kola-lt"
            disabled={pending || unassignIds.size === 0}
            onClick={runUnassign}
          >
            Retirer de l’envoi
          </Button>
        </section>
      ) : null}

      {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}
    </div>
  );
}
