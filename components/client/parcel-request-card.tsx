"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import type { Currency } from "@/app/generated/prisma/enums";
import type { ParcelRequestRow } from "@/app/(client)/client/parcel-requests/page";

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  PENDING: {
    label: "En attente d'offre",
    class: "bg-hh-sand/60 text-hh-earth-dk",
  },
  QUOTED: {
    label: "Offre reçue",
    class: "bg-hh-saffron/10 text-hh-saffron-dk border border-hh-saffron/30",
  },
  MATCHED: {
    label: "Acceptée · colis créé",
    class: "bg-green-50 text-green-700 border border-green-200",
  },
  EXPIRED: { label: "Expirée", class: "bg-slate-100 text-slate-500" },
  CANCELLED: { label: "Annulée", class: "bg-slate-100 text-slate-500" },
};

export function ParcelRequestCard({ request }: { request: ParcelRequestRow }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const st = STATUS_LABEL[request.status] ?? STATUS_LABEL.PENDING;
  const symbol = request.quotedCurrency
    ? (CURRENCY_SYMBOL[request.quotedCurrency as Currency] ?? request.quotedCurrency)
    : null;

  const maxDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(request.maxDepartureDate));

  const quoteExpires = request.quoteExpiresAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(request.quoteExpiresAt))
    : null;

  const canEdit = request.status === "PENDING";
  const canDelete = request.status !== "MATCHED";

  async function handleDelete() {
    if (
      !confirm(
        "Supprimer cette demande ? Les photos stockées seront définitivement effacées.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/parcel-requests/${request.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "Suppression impossible.");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-hh-sand-dk/20 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-semibold text-hh-earth-dk">
            → {request.recipient.city},{" "}
            {countryLabelFr(request.recipient.country)}
          </p>
          <p className="text-[13px] text-hh-muted">
            Départ avant le {maxDate}
          </p>
          {request.items.length > 0 && (
            <p className="text-[12px] text-hh-muted">
              {request.items
                .slice(0, 3)
                .map((it) => `${it.quantity}× ${it.name}`)
                .join(", ")}
              {request.items.length > 3 ? "…" : ""}
            </p>
          )}
          {request.imageCount > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Photos
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {request.imageThumbnails.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-hh-sand-dk/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                ))}
                {request.imageCount > request.imageThumbnails.length ? (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-hh-sand text-[11px] font-semibold tabular-nums text-hh-earth-dk ring-1 ring-hh-sand-dk/15">
                    +
                    {request.imageCount - request.imageThumbnails.length}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.class}`}
        >
          {st.label}
        </span>
      </div>

      {/* Offre reçue */}
      {request.status === "QUOTED" && request.quotedPrice !== null && (
        <div className="mt-4 rounded-xl border border-hh-saffron/20 bg-hh-saffron/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-hh-saffron-dk">
                Offre de {request.quotedForwarder?.name}
              </p>
              <p className="mt-0.5 text-[22px] font-bold text-hh-earth-dk">
                {symbol} {request.quotedPrice.toLocaleString("fr-FR")}
              </p>
              {request.quotedShipment?.departureDate && (
                <p className="text-[12px] text-hh-muted">
                  Départ :{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "numeric",
                    month: "long",
                  }).format(
                    new Date(request.quotedShipment.departureDate),
                  )}{" "}
                  · {request.quotedShipment.reference}
                </p>
              )}
              {request.quoteNote && (
                <p className="mt-1 text-[12px] italic text-hh-muted">
                  « {request.quoteNote} »
                </p>
              )}
              {quoteExpires && (
                <p className="mt-1 text-[11px] text-hh-muted">
                  Offre valable jusqu'au {quoteExpires}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/client/parcel-requests/${request.id}/respond?action=accept${request.quoteToken ? `&token=${encodeURIComponent(request.quoteToken)}` : ""}`}
              className="flex-1 rounded-xl bg-green-600 py-2 text-center text-[13px] font-semibold text-white hover:bg-green-700"
            >
              Accepter
            </Link>
            <Link
              href={`/client/parcel-requests/${request.id}/respond?action=reject${request.quoteToken ? `&token=${encodeURIComponent(request.quoteToken)}` : ""}`}
              className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Refuser
            </Link>
          </div>
        </div>
      )}

      {(canEdit || canDelete) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hh-sand-dk/15 pt-4">
          {canEdit && (
            <Link
              href={`/client/parcel-requests/${request.id}/edit`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-hh-sand-dk/30 bg-white py-2 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand/50 sm:flex-none sm:px-4"
            >
              <Pencil size={14} strokeWidth={2} />
              Modifier
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-[13px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 sm:flex-none sm:px-4"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} strokeWidth={2} />
              )}
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
