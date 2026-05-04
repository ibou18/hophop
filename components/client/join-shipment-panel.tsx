"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { AvailableShipmentRow } from "@/lib/client-data";
import type { ShipmentRequestStatus } from "@/app/generated/prisma/enums";

type ShipmentRequestInfo = {
  id: string;
  status: ShipmentRequestStatus;
  forwarderNote: string | null;
  movedToShipment: { id: string; reference: string } | null;
} | null;

const STATUS_LABELS: Record<ShipmentRequestStatus, string> = {
  PENDING: "En attente de validation",
  ACCEPTED: "Demande acceptée",
  REJECTED: "Demande refusée",
  MOVED: "Colis déplacé",
};

const STATUS_COLORS: Record<ShipmentRequestStatus, string> = {
  PENDING: "bg-amber-50 border-amber-200 text-amber-800",
  ACCEPTED: "bg-green-50 border-green-200 text-green-800",
  REJECTED: "bg-red-50 border-red-200 text-red-700",
  MOVED: "bg-blue-50 border-blue-200 text-blue-800",
};

export function JoinShipmentPanel({
  parcelId,
  shipmentRequest,
  availableShipments,
  isLinkedToForwarder,
  forwarderProfileHref,
  forwarderName,
}: {
  parcelId: string;
  shipmentRequest: ShipmentRequestInfo;
  availableShipments: AvailableShipmentRow[];
  /** Lien ClientForwarder requis par l’API pour envoyer la demande. */
  isLinkedToForwarder: boolean;
  forwarderProfileHref: string | null;
  forwarderName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canRequestNew =
    !shipmentRequest ||
    shipmentRequest.status === "REJECTED" ||
    shipmentRequest.status === "MOVED";

  async function handleSubmit() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${selectedId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ parcelId, note: note.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Erreur lors de la demande");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
      <h2 className="text-[15px] font-medium text-hh-earth-dk">
        Rejoindre un envoi
      </h2>
      <p className="mt-1 text-[13px] text-hh-muted">
        Associe ce colis à un départ publié par le transitaire qui gère déjà ce colis.
      </p>

      {!isLinkedToForwarder &&
        availableShipments.length > 0 &&
        forwarderProfileHref &&
        forwarderName && (
          <div className="mt-4 rounded-[var(--hh-radius-md)] border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            <p>
              Pour envoyer une demande, associe d&apos;abord ton compte à{" "}
              <strong>{forwarderName}</strong> depuis sa page publique.
            </p>
            <Link
              href={forwarderProfileHref}
              className="mt-2 inline-flex font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
            >
              Ouvrir la fiche transitaire →
            </Link>
          </div>
        )}

      {/* Current request status */}
      {shipmentRequest && (
        <div
          className={`mt-4 rounded-[var(--hh-radius-md)] border px-4 py-3 text-[13px] ${STATUS_COLORS[shipmentRequest.status]}`}
        >
          <p className="font-medium">{STATUS_LABELS[shipmentRequest.status]}</p>
          {shipmentRequest.status === "MOVED" && shipmentRequest.movedToShipment && (
            <p className="mt-0.5 opacity-80">
              Envoi : {shipmentRequest.movedToShipment.reference}
            </p>
          )}
          {shipmentRequest.forwarderNote && (
            <p className="mt-0.5 opacity-80">
              Note : {shipmentRequest.forwarderNote}
            </p>
          )}
        </div>
      )}

      {/* Show join form if applicable */}
      {canRequestNew && (
        <div className="mt-4 flex flex-col gap-3">
          {availableShipments.length === 0 ? (
            <p className="text-[13px] text-hh-muted">
              Aucun envoi disponible pour le moment.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {availableShipments.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                    className={`flex items-start justify-between rounded-[var(--hh-radius-md)] border px-4 py-3 text-left transition-colors ${
                      selectedId === s.id
                        ? "border-hh-saffron bg-hh-saffron-lt/40"
                        : "border-hh-sand-dk/30 bg-white hover:border-hh-saffron/50 hover:bg-hh-sand"
                    }`}
                  >
                    <div>
                      <p className="font-mono text-[13px] font-medium text-hh-earth-dk">
                        {s.reference}
                      </p>
                      <p className="mt-0.5 text-[12px] text-hh-muted">
                        {countryLabelFr(s.destinationCountry)}
                        {s.destinationCity ? ` · ${s.destinationCity}` : ""}
                      </p>
                    </div>
                    {s.departureDate && (
                      <p className="shrink-0 text-[12px] text-hh-muted">
                        {format(new Date(s.departureDate), "d MMM", { locale: fr })}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {selectedId && (
                <Textarea
                  placeholder="Message pour le transitaire (optionnel)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="resize-none rounded-[var(--hh-radius-md)] border-hh-sand-dk/40 bg-white text-[13px]"
                />
              )}

              {error && (
                <p className="text-[13px] text-hh-kola" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="button"
                disabled={!selectedId || pending || !isLinkedToForwarder}
                onClick={handleSubmit}
                className="self-start bg-hh-saffron text-white hover:bg-hh-saffron-dk disabled:opacity-50"
              >
                {pending ? "Envoi…" : "Envoyer la demande"}
              </Button>
              {!isLinkedToForwarder && selectedId ? (
                <p className="text-[12px] text-hh-muted">
                  Lie ton compte au transitaire (lien ci-dessus) pour activer l&apos;envoi de la
                  demande.
                </p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
