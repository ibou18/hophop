"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import type {
  MatchingRequestRow,
  ForwarderShipmentOption,
} from "@/app/(forwarder)/parcel-requests/page";
import type { Currency } from "@/app/generated/prisma/enums";

const CURRENCIES = ["CAD", "EUR", "XOF", "XAF", "GNF", "NGN"] as const;

export function ParcelRequestsMatchingList({
  requests,
  shipments,
}: {
  requests: MatchingRequestRow[];
  shipments: ForwarderShipmentOption[];
}) {
  const [quoting, setQuoting] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hh-sand-dk/40 bg-white/60 px-8 py-14 text-center">
        <p className="text-[15px] font-medium text-hh-earth-dk">
          Aucune demande sur vos routes pour l&apos;instant
        </p>
        <p className="mt-2 text-[13px] text-hh-muted">
          Revenez plus tard — les nouvelles demandes clients apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((req) => (
        <RequestRow
          key={req.id}
          request={req}
          shipments={shipments}
          isQuoting={quoting === req.id}
          onStartQuote={() => setQuoting(req.id)}
          onCancel={() => setQuoting(null)}
          onQuoted={() => setQuoting(null)}
        />
      ))}
    </div>
  );
}

function ImageViewerOverlay({
  urls,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const url = urls[index];
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/88 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Agrandir la photo"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Fermer"
      >
        <X size={22} strokeWidth={2} />
      </button>
      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-6"
            aria-label="Photo précédente"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-6"
            aria-label="Photo suivante"
          >
            <ChevronRight size={28} strokeWidth={2} />
          </button>
        </>
      )}
      <div
        className="flex max-h-full max-w-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="max-h-[min(88vh,900px)] max-w-full object-contain"
        />
        {urls.length > 1 && (
          <p className="mt-4 text-[13px] text-white/90 tabular-nums">
            {index + 1} / {urls.length}
          </p>
        )}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  shipments,
  isQuoting,
  onStartQuote,
  onCancel,
  onQuoted,
}: {
  request: MatchingRequestRow;
  shipments: ForwarderShipmentOption[];
  isQuoting: boolean;
  onStartQuote: () => void;
  onCancel: () => void;
  onQuoted: () => void;
}) {
  const [shipmentId, setShipmentId] = useState(shipments[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("EUR");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const imageUrls = request.imageUrls ?? [];
  const thumbs = request.imageThumbnails ?? [];
  const imageCount = request.imageCount ?? 0;

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const goPrev = useCallback(() => {
    setViewerIndex((i) => {
      if (i === null || imageUrls.length === 0) return null;
      return (i - 1 + imageUrls.length) % imageUrls.length;
    });
  }, [imageUrls.length]);
  const goNext = useCallback(() => {
    setViewerIndex((i) => {
      if (i === null || imageUrls.length === 0) return null;
      return (i + 1) % imageUrls.length;
    });
  }, [imageUrls.length]);

  const maxDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(request.maxDepartureDate));

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!shipmentId || !price) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/parcel-requests/${request.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId,
          price: parseFloat(price),
          currency,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Erreur lors de l'envoi.",
        );
        return;
      }
      setSent(true);
      setTimeout(onQuoted, 2000);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
        <p className="text-[14px] font-semibold text-green-700">
          ✓ Offre envoyée — le client va recevoir un email.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hh-sand-dk/20 bg-white shadow-sm">
      {viewerIndex !== null && imageUrls.length > 0 && (
        <ImageViewerOverlay
          urls={imageUrls}
          index={viewerIndex}
          onClose={closeViewer}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[15px] font-semibold text-hh-earth-dk">
            {request.originCity
              ? `${request.originCity}, ${countryLabelFr(request.originCountry ?? request.client.country)}`
              : countryLabelFr(request.client.country)}{" "}
            → {request.recipient.city},{" "}
            {countryLabelFr(request.recipient.country)}
          </p>
          <p className="text-[13px] text-hh-muted">
            Client : {request.client.firstName} {request.client.lastName}
          </p>
          <p className="text-[12px] text-hh-muted">Départ avant le {maxDate}</p>
          {request.weightKg && (
            <p className="text-[12px] text-hh-muted">
              Poids : {request.weightKg} kg
            </p>
          )}
          {request.items.length > 0 && (
            <p className="text-[12px] text-hh-muted">
              {request.items
                .slice(0, 4)
                .map((it) => `${it.quantity}× ${it.name}`)
                .join(", ")}
              {request.items.length > 4 ? "…" : ""}
            </p>
          )}
          {imageCount > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Photos du colis
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {thumbs.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setViewerIndex(i)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-hh-sand-dk/25 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-hh-saffron/50"
                    aria-label={`Voir la photo ${i + 1} en grand`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
                {imageCount > thumbs.length ? (
                  <button
                    type="button"
                    onClick={() => setViewerIndex(thumbs.length)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-hh-sand text-[12px] font-semibold tabular-nums text-hh-earth-dk ring-1 ring-hh-sand-dk/15 transition-colors hover:bg-hh-sand-dk/20"
                    aria-label={`Voir ${imageCount - thumbs.length} photo(s) supplémentaires`}
                  >
                    +{imageCount - thumbs.length}
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 text-[11px] text-hh-muted">
                Cliquez pour agrandir · flèches ou Échap
              </p>
            </div>
          )}
        </div>
        {!isQuoting && (
          <button
            type="button"
            onClick={onStartQuote}
            className="shrink-0 rounded-xl bg-hh-saffron px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Faire une offre
          </button>
        )}
      </div>

      {isQuoting && (
        <form
          onSubmit={submitQuote}
          className="flex flex-col gap-4 border-t border-hh-sand-dk/15 p-5"
        >
          <p className="text-[13px] font-semibold text-hh-earth-dk">
            Envoyer une offre de prix
          </p>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-hh-muted">
              Rattacher à l&apos;envoi
            </label>
            <select
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 text-[13px] text-hh-earth-dk focus:outline-none focus:ring-2 focus:ring-hh-saffron/30"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.reference} — {countryLabelFr(s.originCountry)} →{" "}
                  {countryLabelFr(s.destinationCountry)}
                  {s.departureDate
                    ? ` · ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(s.departureDate))}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="block text-[12px] font-medium text-hh-muted">
                Prix proposé
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex : 85"
                className="h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 text-[13px] text-hh-earth-dk focus:outline-none focus:ring-2 focus:ring-hh-saffron/30"
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="block text-[12px] font-medium text-hh-muted">
                Devise
              </label>
              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as (typeof CURRENCIES)[number])
                }
                className="h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-2 text-[13px] text-hh-earth-dk focus:outline-none focus:ring-2 focus:ring-hh-saffron/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {CURRENCY_SYMBOL[c as Currency]} {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-hh-muted">
              Message pour le client (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ex : Collecte possible à Montréal le 20 mai…"
              className="w-full resize-none rounded-xl border border-hh-sand-dk/35 bg-white px-3 py-2 text-[13px] text-hh-earth-dk focus:outline-none focus:ring-2 focus:ring-hh-saffron/30"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-[13px] text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="h-10 flex-1 rounded-xl bg-hh-saffron text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Envoyer l'offre par email"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[13px] text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
