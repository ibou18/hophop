"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AssignableParcelRow } from "@/lib/forwarder-shipment-data";
import { Button } from "@/components/ui/button";

type InShipmentRow = {
  id: string;
  trackingCode: string;
};

export function ShipmentParcelsAssignment({
  shipmentId,
  editable,
  assignableParcels,
  inShipmentParcels,
}: {
  shipmentId: string;
  editable: boolean;
  assignableParcels: AssignableParcelRow[];
  inShipmentParcels: InShipmentRow[];
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
      {assignableParcels.length > 0 ? (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Ajouter des colis au lot
          </h2>
          <p className="mt-1 text-[13px] text-hh-muted">
            Uniquement les colis au statut « Collecté » et non encore affectés à un
            envoi.
          </p>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-[var(--hh-radius-md)] border border-hh-sand-dk/20 p-3">
            {assignableParcels.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-2 text-[14px]"
              >
                <input
                  type="checkbox"
                  id={`assign-${p.id}`}
                  checked={assignIds.has(p.id)}
                  disabled={pending}
                  onChange={() => toggle(setAssignIds, p.id)}
                  className="mt-1"
                />
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`assign-${p.id}`} className="cursor-pointer">
                    <span className="font-mono font-medium text-hh-saffron-dk">
                      {p.trackingCode}
                    </span>
                    <span className="text-hh-muted">
                      {" "}
                      — {p.client.firstName} {p.client.lastName} ·{" "}
                      {p.recipient.city}
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
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-3 bg-hh-saffron text-white hover:bg-hh-saffron-dk"
            disabled={pending || assignIds.size === 0}
            onClick={runAssign}
          >
            Affecter à cet envoi
          </Button>
        </section>
      ) : null}

      {inShipmentParcels.length > 0 ? (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Retirer des colis du lot
          </h2>
          <p className="mt-1 text-[13px] text-hh-muted">
            Possible tant que l’envoi est en brouillon ou confirmé.
          </p>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-[var(--hh-radius-md)] border border-hh-sand-dk/20 p-3">
            {inShipmentParcels.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-2 text-[14px]"
              >
                <input
                  type="checkbox"
                  id={`unassign-${p.id}`}
                  checked={unassignIds.has(p.id)}
                  disabled={pending}
                  onChange={() => toggle(setUnassignIds, p.id)}
                  className="mt-1"
                />
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor={`unassign-${p.id}`}
                    className="cursor-pointer font-mono font-medium text-hh-earth-dk"
                  >
                    {p.trackingCode}
                  </label>
                  <Link
                    href={`/parcels/${p.id}?fromShipment=${shipmentId}`}
                    className="shrink-0 text-[12px] font-medium text-hh-saffron-dk hover:underline"
                  >
                    Fiche colis
                  </Link>
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
