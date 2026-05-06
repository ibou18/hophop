"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, Loader2 } from "lucide-react";
import { ParcelStatus } from "@/app/generated/prisma/enums";
import type { ForwarderParcelListRow } from "@/lib/forwarder-dashboard-data";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { staffMayTransition } from "@/lib/parcel-status-workflow";

/** Ordre d’affichage des tags de statut (cohérent avec les filtres liste). */
const STATUS_TAGS_ORDER: ParcelStatus[] = [
  ParcelStatus.DECLARED,
  ParcelStatus.COLLECTED,
  ParcelStatus.IN_TRANSIT,
  ParcelStatus.ARRIVED,
  ParcelStatus.READY,
  ParcelStatus.DELIVERED,
  ParcelStatus.ISSUE,
];

function tagClass(selected: boolean, status: ParcelStatus): string {
  if (selected) {
    return "bg-hh-saffron/25 text-hh-earth-dk ring-2 ring-hh-saffron/50";
  }
  switch (status) {
    case ParcelStatus.DELIVERED:
      return "bg-hh-savane-lt text-hh-savane-dk ring-1 ring-hh-savane/25 hover:bg-hh-savane-lt/80";
    case ParcelStatus.ISSUE:
      return "bg-hh-kola-lt text-hh-kola-dk ring-1 ring-hh-kola/20 hover:bg-hh-kola-lt/80";
    case ParcelStatus.IN_TRANSIT:
      return "bg-hh-saffron-lt text-hh-saffron-dk ring-1 ring-hh-saffron/30 hover:bg-hh-saffron-lt/80";
    case ParcelStatus.READY:
    case ParcelStatus.ARRIVED:
      return "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/15 hover:bg-hh-earth-lt/80";
    default:
      return "bg-white text-hh-earth-dk ring-1 ring-hh-sand-dk/30 hover:bg-hh-sand";
  }
}

export function ForwarderParcelQuickModal({
  parcel,
  open,
  onOpenChange,
  onStatusUpdated,
  canCorrectAnyStatus = false,
}: {
  parcel: ForwarderParcelListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
  /** OWNER / ADMIN : tous les tags cliquables pour corriger une erreur. */
  canCorrectAnyStatus?: boolean;
}) {
  const [status, setStatus] = useState<ParcelStatus | null>(null);
  const [saving, setSaving] = useState<ParcelStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (parcel) {
      setStatus(parcel.status);
      setError(null);
      setSaving(null);
    }
  }, [parcel?.id, parcel?.status, open]);

  async function applyStatus(next: ParcelStatus) {
    if (!parcel || next === status || saving) return;
    setError(null);
    setSaving(next);
    try {
      const res = await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: next }),
      });
      const raw = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(
          typeof raw?.error === "string"
            ? raw.error
            : `Échec (${res.status}). Réessaie.`,
        );
        return;
      }
      setStatus(next);
      onStatusUpdated?.();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(null);
    }
  }

  const recipientLine = parcel
    ? `${parcel.recipient.firstName} ${parcel.recipient.lastName}`
    : "";
  const destLine = parcel ? `${parcel.recipient.city} · ${parcel.recipient.country}` : "";

  return (
    <Dialog open={open && !!parcel} onOpenChange={onOpenChange}>
      {parcel && status !== null ? (
      <DialogContent
        className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-[15px] text-hh-earth-dk">
            {parcel.trackingCode}
          </DialogTitle>
          <DialogDescription className="text-left text-[13px] text-hh-muted">
            Modifier le statut sans ouvrir la fiche complète. Les changements sont enregistrés et
            ajoutés au suivi.
            {!canCorrectAnyStatus ? (
              <span className="mt-1 block text-[12px] text-hh-muted/90">
                Hors flux normal : compte administrateur requis.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {parcel.images.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Photos
              </p>
              <div className="flex flex-wrap gap-2">
                {parcel.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-[var(--hh-radius-md)] ring-1 ring-hh-sand-dk/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- URLs S3 externes */}
                    <img
                      src={img.url}
                      alt=""
                      className="h-24 w-24 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-hh-muted">Aucune photo pour ce colis.</p>
          )}

          <div className="grid gap-3 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/20 bg-hh-sand/30 px-3 py-3 text-[13px]">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Client
              </span>
              <p className="text-hh-earth-dk">
                {parcel.client.firstName} {parcel.client.lastName}
                {parcel.client.email ? (
                  <span className="mt-0.5 block text-[12px] font-normal text-hh-muted">
                    {parcel.client.email}
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Destinataire
              </span>
              <p className="text-hh-earth-dk">{recipientLine}</p>
              <p className="text-[12px] text-hh-muted">{destLine}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-hh-muted">
              <span>
                Envoi :{" "}
                <span className="text-hh-earth-dk">
                  {parcel.shipment?.reference ?? "—"}
                </span>
              </span>
              <span>
                Créé{" "}
                {formatDistanceToNow(parcel.createdAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            {parcel.description ? (
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Description
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-hh-earth-dk">
                  {parcel.description}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Statut
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_TAGS_ORDER.map((s) => {
                const isCurrent = s === status;
                const isBusy = saving !== null;
                const allowed =
                  canCorrectAnyStatus ||
                  isCurrent ||
                  (status !== null && staffMayTransition(status, s));
                return (
                  <button
                    key={s}
                    type="button"
                    title={
                      allowed ? undefined : "Statut réservé aux administrateurs"
                    }
                    disabled={isBusy || !allowed}
                    onClick={() => void applyStatus(s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-60",
                      tagClass(isCurrent, s),
                    )}
                  >
                    {saving === s ? (
                      <Loader2 className="size-3.5 animate-spin shrink-0" />
                    ) : null}
                    {parcelStatusLabelFr(s)}
                  </button>
                );
              })}
            </div>
            {error ? (
              <p className="mt-2 text-[12px] text-hh-kola-dk" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-hh-sand-dk/15 pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/parcels/${parcel.id}`} className="gap-1.5">
                Fiche complète
                <ExternalLink className="size-3.5 opacity-70" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
      ) : null}
    </Dialog>
  );
}
