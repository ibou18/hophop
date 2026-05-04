"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { ShipmentRequestRow } from "@/lib/forwarder-shipment-data";
import type { Country } from "@/app/generated/prisma/enums";

type OtherShipment = { id: string; reference: string; destinationCountry: Country };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  MOVED: "Déplacé",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-green-50 text-green-800",
  REJECTED: "bg-red-50 text-red-700",
  MOVED: "bg-blue-50 text-blue-800",
};

function RequestRow({
  request,
  shipmentId,
  otherShipments,
}: {
  request: ShipmentRequestRow;
  shipmentId: string;
  otherShipments: OtherShipment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [moveMode, setMoveMode] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const url = `/api/shipments/${shipmentId}/requests/${request.parcelId}`;

  async function send(body: object) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Erreur");
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 border-t border-hh-sand-dk/15 py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[13px] font-medium text-hh-earth-dk">
            <Link
              href={`/parcels/${request.parcel.id}?fromShipment=${shipmentId}`}
              className="text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              {request.parcel.trackingCode}
            </Link>
          </p>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            {request.client.firstName} {request.client.lastName}
            {" · "}
            {request.parcel.recipient.city},{" "}
            {countryLabelFr(request.parcel.recipient.country)}
          </p>
          {request.parcel.items.length > 0 && (
            <p className="mt-1 text-[12px] text-hh-muted">
              {request.parcel.items
                .map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name))
                .join(", ")}
            </p>
          )}
          {request.note && (
            <p className="mt-1 text-[12px] italic text-hh-muted">
              "{request.note}"
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[request.status] ?? ""}`}
        >
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>

      {request.status === "MOVED" && request.movedToShipment && (
        <p className="text-[12px] text-hh-muted">
          Déplacé vers{" "}
          <span className="font-mono font-medium text-hh-earth-dk">
            {request.movedToShipment.reference}
          </span>
        </p>
      )}

      {request.status === "PENDING" && (
        <div className="flex flex-col gap-2">
          {!moveMode ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={pending}
                size="sm"
                className="bg-hh-savane text-white hover:bg-hh-savane-dk disabled:opacity-50"
                onClick={() => send({ action: "accept" })}
              >
                Accepter
              </Button>
              {otherShipments.length > 0 && (
                <Button
                  type="button"
                  disabled={pending}
                  size="sm"
                  variant="outline"
                  className="border-hh-sand-dk/40"
                  onClick={() => setMoveMode(true)}
                >
                  Déplacer
                </Button>
              )}
              <Button
                type="button"
                disabled={pending}
                size="sm"
                variant="outline"
                className="border-hh-kola/30 text-hh-kola hover:bg-hh-kola/5"
                onClick={() => send({ action: "reject" })}
              >
                Refuser
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="h-8 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-2 text-[13px] text-hh-earth-dk"
              >
                <option value="">Choisir un envoi</option>
                {otherShipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.reference} — {countryLabelFr(s.destinationCountry)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                disabled={!targetId || pending}
                size="sm"
                className="bg-hh-saffron text-white hover:bg-hh-saffron-dk disabled:opacity-50"
                onClick={() =>
                  send({ action: "move", targetShipmentId: targetId })
                }
              >
                Confirmer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMoveMode(false);
                  setTargetId("");
                }}
              >
                Annuler
              </Button>
            </div>
          )}
          {error && (
            <p className="text-[12px] text-hh-kola" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function ShipmentRequestsPanel({
  shipmentId,
  requests,
  otherShipments,
}: {
  shipmentId: string;
  requests: ShipmentRequestRow[];
  otherShipments: OtherShipment[];
}) {
  const pending = requests.filter((r) => r.status === "PENDING");
  const others = requests.filter((r) => r.status !== "PENDING");

  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Demandes clients
        </h2>
        {pending.length > 0 && (
          <span className="rounded-full bg-hh-saffron px-2 py-0.5 text-[11px] font-medium text-white">
            {pending.length} en attente
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <p className="mt-3 text-[13px] text-hh-muted">
          Aucune demande pour cet envoi.
        </p>
      ) : (
        <ul className="mt-4">
          {pending.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              shipmentId={shipmentId}
              otherShipments={otherShipments}
            />
          ))}
          {others.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              shipmentId={shipmentId}
              otherShipments={otherShipments}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
