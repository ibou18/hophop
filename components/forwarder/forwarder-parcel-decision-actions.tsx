"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ParcelStatus, Country } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import { Button } from "@/components/ui/button";

type ShipmentOption = {
  id: string;
  reference: string;
  destinationCountry: Country;
};

export function ForwarderParcelDecisionActions({
  parcelId,
  currentStatus,
  shipmentId,
  availableShipments,
}: {
  parcelId: string;
  currentStatus: ParcelStatus;
  shipmentId: string | null;
  availableShipments: ShipmentOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [targetShipmentId, setTargetShipmentId] = useState("");

  const canAccept = currentStatus === "DECLARED" && !shipmentId;
  const canRefuse =
    currentStatus !== "IN_TRANSIT" && currentStatus !== "DELIVERED";
  const canAssign = currentStatus === "COLLECTED" && !shipmentId;

  const shipmentChoices = useMemo(
    () => availableShipments.filter((s) => s.id !== shipmentId),
    [availableShipments, shipmentId],
  );

  function acceptParcel() {
    if (!canAccept || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "COLLECTED" }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(j?.error ?? "Impossible d'accepter ce colis.");
        return;
      }
      router.refresh();
    });
  }

  function refuseParcel() {
    if (!canRefuse || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "ISSUE" }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(j?.error ?? "Impossible de refuser ce colis.");
        return;
      }
      router.refresh();
    });
  }

  function assignParcelToShipment() {
    if (!canAssign || !targetShipmentId || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${targetShipmentId}/parcels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "assign",
          parcelIds: [parcelId],
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(j?.error ?? "Impossible d'intégrer ce colis à l'envoi.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
      <h2 className="text-[15px] font-medium text-hh-earth-dk">Décision colis</h2>
      <p className="mt-1 text-[13px] text-hh-muted">
        Accepter, refuser, ou intégrer directement à un envoi modifiable.
      </p>

      {(canAccept || canRefuse) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canAccept ? (
            <Button
              type="button"
              disabled={pending}
              className="bg-hh-savane text-white hover:bg-hh-savane-dk disabled:opacity-50"
              onClick={acceptParcel}
            >
              {pending ? "Traitement…" : "Accepter"}
            </Button>
          ) : null}
          {canRefuse ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="border-hh-kola/30 text-hh-kola hover:bg-hh-kola/5"
              onClick={refuseParcel}
            >
              Refuser
            </Button>
          ) : null}
        </div>
      )}

      <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
        {shipmentId ? (
          <p className="text-[13px] text-hh-muted">
            Colis déjà intégré à un envoi (acceptation masquée).
          </p>
        ) : !canAssign ? (
          <p className="text-[13px] text-hh-muted">
            Intégration possible une fois colis accepté (statut Collecté).
          </p>
        ) : shipmentChoices.length === 0 ? (
          <p className="text-[13px] text-hh-muted">
            Aucun envoi modifiable disponible pour intégration.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={targetShipmentId}
              onChange={(e) => setTargetShipmentId(e.target.value)}
              className="h-10 min-w-[260px] rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            >
              <option value="">Choisir un envoi</option>
              {shipmentChoices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.reference} — {countryLabelFr(s.destinationCountry)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!targetShipmentId || pending}
              className="bg-hh-saffron text-white hover:bg-hh-saffron-dk disabled:opacity-50"
              onClick={assignParcelToShipment}
            >
              Intégrer à l'envoi
            </Button>
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-[13px] text-hh-kola">{error}</p> : null}
    </section>
  );
}

