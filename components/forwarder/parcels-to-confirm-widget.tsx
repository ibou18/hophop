"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { PackageCheck, Clock, Loader2, CheckCheck, X } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { ForwarderParcelListRow } from "@/lib/forwarder-dashboard-data";

function ParcelRow({ parcel }: { parcel: ForwarderParcelListRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "refuse" | null>(null);
  const [done, setDone] = useState<"accepted" | "refused" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(status: "COLLECTED" | "ISSUE", kind: "accept" | "refuse") {
    if (pending) return;
    setError(null);
    setAction(kind);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Erreur, réessaie.";
        setError(msg);
        toast.error(msg);
        setAction(null);
        return;
      }
      if (kind === "accept") {
        toast.success(`Colis ${parcel.trackingCode} accepté ✓`);
        setDone("accepted");
      } else {
        toast.error(`Colis ${parcel.trackingCode} refusé`);
        setDone("refused");
      }
      router.refresh();
    });
  }

  // Row fades out after action
  const opacity = done ? "opacity-0 transition-opacity duration-500" : "";

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${opacity}`}>
      {/* Icon */}
      <div className="hidden shrink-0 pt-0.5 sm:block">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200/70">
          <Clock size={13} className="text-amber-600" />
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link
            href={`/parcels/${parcel.id}`}
            className="font-mono text-[13px] font-semibold text-hh-saffron-dk underline-offset-2 hover:underline"
          >
            {parcel.trackingCode}
          </Link>
          <span className="text-[11px] text-hh-muted">·</span>
          <span className="text-[13px] font-medium text-hh-earth-dk">
            {parcel.client.firstName} {parcel.client.lastName}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-hh-muted">
          <span>
            {parcel.recipient.city} · {countryLabelFr(parcel.recipient.country)}
          </span>
          <span>·</span>
          <span>
            {formatDistanceToNow(parcel.createdAt, { addSuffix: true, locale: fr })}
          </span>
          {parcel.shipment && (
            <>
              <span>·</span>
              <span className="rounded bg-hh-sand px-1.5 py-0.5 font-medium text-hh-earth-dk ring-1 ring-hh-sand-dk/20">
                Envoi {parcel.shipment.reference}
              </span>
            </>
          )}
        </div>
        {error && (
          <p className="mt-1 text-[11px] text-red-500">{error}</p>
        )}
      </div>

      {/* Actions */}
      {done === null ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => patch("COLLECTED", "accept")}
            className="flex items-center gap-1 rounded-[var(--hh-radius-md)] bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            {pending && action === "accept" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={12} />
            )}
            <span className="hidden sm:inline">Accepter</span>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => patch("ISSUE", "refuse")}
            className="flex items-center gap-1 rounded-[var(--hh-radius-md)] bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {pending && action === "refuse" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <X size={12} />
            )}
            <span className="hidden sm:inline">Refuser</span>
          </button>
        </div>
      ) : (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            done === "accepted"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {done === "accepted" ? "Accepté ✓" : "Refusé"}
        </span>
      )}
    </div>
  );
}

export function ParcelsToConfirmWidget({
  parcels,
}: {
  parcels: ForwarderParcelListRow[];
}) {
  if (parcels.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white px-4 py-10 text-center shadow-sm">
        <PackageCheck size={28} className="text-hh-savane opacity-40" />
        <p className="text-[14px] text-hh-muted">
          Aucun colis en attente d&apos;acceptation.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--hh-radius-lg)] border border-amber-200/60 bg-white shadow-sm divide-y divide-hh-sand-dk/15">
      {parcels.map((p) => (
        <ParcelRow key={p.id} parcel={p} />
      ))}
    </div>
  );
}
