"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, CheckCircle2, Loader2, MapPin, PackageCheck, PlayCircle, Truck } from "lucide-react";
import type { Country, ShipmentStatus, TransportMode } from "@/app/generated/prisma/enums";
import { ShipmentStatus as ShipmentSt } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import { shipmentStatusLabelFr } from "@/lib/shipment-status-fr";
import { TransportModeBadge } from "@/components/transport-mode-selector";
import { cn } from "@/lib/utils";

type StatusVisual = {
  /** Couleur du badge statut. */
  className: string;
  /** Step index pour la timeline (0..4). */
  step: number;
};

const STATUS_VISUAL: Record<ShipmentStatus, StatusVisual> = {
  DRAFT: { className: "bg-hh-sand-dk/30 text-hh-earth-dk ring-1 ring-hh-sand-dk/40", step: 0 },
  CONFIRMED: { className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", step: 1 },
  IN_TRANSIT: { className: "bg-hh-saffron-lt text-hh-saffron-dk ring-1 ring-hh-saffron/40", step: 2 },
  ARRIVED: { className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", step: 3 },
  CLOSED: { className: "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/15", step: 4 },
};

const TIMELINE_STEPS: { key: ShipmentStatus; label: string }[] = [
  { key: "DRAFT", label: "Brouillon" },
  { key: "CONFIRMED", label: "Confirmé" },
  { key: "IN_TRANSIT", label: "En transit" },
  { key: "ARRIVED", label: "Arrivé" },
  { key: "CLOSED", label: "Clôturé" },
];

export type ShipmentHeroKpis = {
  parcelCount: number;
  vehicleCount: number;
  totalWeightKg: number | null;
  totalValue: number | null;
  paidCount: number;
  pendingRequestsCount: number;
};

export function ShipmentHero({
  shipmentId,
  reference,
  status,
  transportMode,
  originCountry,
  destinationCountry,
  destinationCity,
  departureDate,
  arrivalDate,
  currency,
  kpis,
  updatedAtIso,
}: {
  shipmentId: string;
  reference: string;
  status: ShipmentStatus;
  transportMode: TransportMode;
  originCountry: Country;
  destinationCountry: Country;
  destinationCity: string | null;
  departureDate: Date | null;
  arrivalDate: Date | null;
  currency: string;
  kpis: ShipmentHeroKpis;
  updatedAtIso: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const statusVisual = STATUS_VISUAL[status];
  const canConfirm = status === ShipmentSt.DRAFT;
  const canDispatch =
    (status === ShipmentSt.DRAFT || status === ShipmentSt.CONFIRMED) &&
    kpis.parcelCount > 0;
  const canArrive = status === ShipmentSt.IN_TRANSIT;

  const departureCountdown = departureDate ? daysFromNow(departureDate) : null;

  function run(label: string, success: string, fn: () => Promise<{ ok: boolean; message?: string }>): void {
    setError(null);
    startTransition(async () => {
      const loadingId = toast.loading(`${label}…`);
      try {
        const r = await fn();
        toast.dismiss(loadingId);
        if (!r.ok) {
          const msg = r.message ?? `Impossible : ${label}`;
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success(success);
        router.refresh();
      } catch {
        toast.dismiss(loadingId);
        setError("Erreur réseau");
        toast.error("Erreur réseau");
      }
    });
  }

  async function patchStatus(next: ShipmentStatus): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: next }),
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    return res.ok ? { ok: true } : { ok: false, message: j?.error };
  }

  async function postEndpoint(path: string): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch(`/api/shipments/${shipmentId}/${path}`, {
      method: "POST",
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    return res.ok ? { ok: true } : { ok: false, message: j?.error };
  }

  return (
    <section
      key={`${status}-${updatedAtIso}`}
      className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Top: back link + ref + transport mode + status badge */}
      <div className="flex flex-col gap-3">
        <Link
          href="/shipments"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          <ArrowLeft size={13} strokeWidth={1.8} />
          Envois
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[24px] font-medium tracking-tight text-hh-earth-dk sm:text-[26px]">
            {reference}
          </h1>
          <TransportModeBadge mode={transportMode} />
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              statusVisual.className,
            )}
          >
            {shipmentStatusLabelFr(status)}
          </span>
        </div>

        {/* Route line */}
        <p className="flex items-center gap-1.5 text-[13px] text-hh-muted">
          <MapPin size={13} strokeWidth={1.5} className="shrink-0" />
          <span className="text-hh-earth-dk">{countryLabelFr(originCountry)}</span>
          <span className="text-hh-muted/70">→</span>
          <span className="text-hh-earth-dk">
            {destinationCity ? `${destinationCity}, ` : ""}
            {countryLabelFr(destinationCountry)}
          </span>
          {departureCountdown !== null && status !== ShipmentSt.IN_TRANSIT && status !== ShipmentSt.ARRIVED && status !== ShipmentSt.CLOSED ? (
            <span className="ml-2 text-hh-muted">·</span>
          ) : null}
          {departureCountdown !== null && status !== ShipmentSt.IN_TRANSIT && status !== ShipmentSt.ARRIVED && status !== ShipmentSt.CLOSED ? (
            <span className={cn("font-medium", departureCountdown < 0 ? "text-red-600" : "text-hh-earth-dk")}>
              {formatCountdown(departureCountdown)}
            </span>
          ) : null}
        </p>
      </div>

      {/* Timeline stepper */}
      <div className="mt-5">
        <ol className="flex items-center gap-1">
          {TIMELINE_STEPS.map((s, i) => {
            const reached = i <= statusVisual.step;
            const current = i === statusVisual.step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex h-2 flex-1 rounded-full transition-colors",
                    reached ? "bg-hh-saffron" : "bg-hh-sand-dk/25",
                    current && "ring-2 ring-hh-saffron/40 ring-offset-1",
                  )}
                  aria-current={current ? "step" : undefined}
                  aria-label={s.label}
                />
              </li>
            );
          })}
        </ol>
        <ol className="mt-1.5 hidden grid-cols-5 text-center text-[10px] uppercase tracking-wide text-hh-muted sm:grid">
          {TIMELINE_STEPS.map((s, i) => (
            <li
              key={s.key}
              className={cn(i === statusVisual.step ? "font-semibold text-hh-earth-dk" : "")}
            >
              {s.label}
            </li>
          ))}
        </ol>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Colis" value={String(kpis.parcelCount)} />
        {kpis.vehicleCount > 0 ? (
          <Kpi label="Véhicules" value={String(kpis.vehicleCount)} />
        ) : (
          <Kpi label="Poids total" value={kpis.totalWeightKg != null ? `${formatNumber(kpis.totalWeightKg)} kg` : "—"} />
        )}
        <Kpi
          label="Valeur"
          value={
            kpis.totalValue != null
              ? `${formatNumber(kpis.totalValue)} ${currency}`
              : "—"
          }
        />
        <Kpi
          label="Paiements"
          value={
            kpis.parcelCount > 0
              ? `${kpis.paidCount} / ${kpis.parcelCount}`
              : "—"
          }
          accent={
            kpis.parcelCount > 0 && kpis.paidCount === kpis.parcelCount
              ? "good"
              : kpis.parcelCount > 0 && kpis.paidCount === 0
                ? "warn"
                : undefined
          }
        />
      </div>

      {/* Pending requests alert */}
      {kpis.pendingRequestsCount > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-saffron/30 bg-hh-saffron-lt/60 px-3 py-2 text-[13px] text-hh-saffron-dk">
          <Bell size={14} strokeWidth={2} />
          <span>
            {kpis.pendingRequestsCount} demande{kpis.pendingRequestsCount > 1 ? "s" : ""} en attente —
          </span>
          <a
            href="#tab-requests"
            className="font-medium underline underline-offset-2 hover:no-underline"
          >
            voir
          </a>
        </div>
      ) : null}

      {/* Contextual primary CTA */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hh-sand-dk/15 pt-4">
        {canConfirm ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("Confirmation", "Envoi confirmé ✓", () => patchStatus(ShipmentSt.CONFIRMED))}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} strokeWidth={2} />}
            Confirmer l&apos;envoi
          </button>
        ) : null}

        {canDispatch ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("Départ", "Départ enregistré — envoi en transit", () => postEndpoint("dispatch"))}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} strokeWidth={2} />}
            Enregistrer le départ
          </button>
        ) : null}

        {canArrive ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("Arrivée", "Envoi marqué arrivé ✓", () => postEndpoint("arrive"))}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-savane px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <PackageCheck size={15} strokeWidth={2} />}
            Marquer arrivé à destination
          </button>
        ) : null}

        {/* Hint when blocked */}
        {(status === ShipmentSt.DRAFT || status === ShipmentSt.CONFIRMED) && kpis.parcelCount === 0 ? (
          <p className="text-[12px] text-hh-muted">
            Ajoute au moins un colis collecté pour pouvoir enregistrer le départ.
          </p>
        ) : null}

        {status === ShipmentSt.CLOSED ? (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-hh-muted">
            <Truck size={13} strokeWidth={1.5} />
            Envoi clôturé — vue lecture seule.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-[12px] text-hh-kola" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "warn";
}) {
  return (
    <div className="rounded-[var(--hh-radius-md)] bg-hh-sand/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[16px] font-semibold tabular-nums text-hh-earth-dk",
          accent === "good" && "text-emerald-700",
          accent === "warn" && "text-amber-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function daysFromNow(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.floor(ms / 86_400_000);
}

function formatCountdown(days: number): string {
  if (days === 0) return "Départ aujourd'hui";
  if (days === 1) return "Départ demain";
  if (days > 0) return `Départ dans ${days} j`;
  if (days === -1) return "Retard d'1 jour";
  return `Retard de ${Math.abs(days)} jours`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n);
}
