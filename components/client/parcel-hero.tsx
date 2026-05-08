import Link from "next/link";
import { ArrowLeft, MapPin, Package, Printer } from "lucide-react";
import type { ParcelStatus, Country } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { cn } from "@/lib/utils";

const TIMELINE_STEPS: { key: ParcelStatus; label: string }[] = [
  { key: "DECLARED",   label: "Déclaré"   },
  { key: "COLLECTED",  label: "Collecté"  },
  { key: "IN_TRANSIT", label: "Transit"   },
  { key: "ARRIVED",    label: "Arrivé"    },
  { key: "READY",      label: "Retrait"   },
  { key: "DELIVERED",  label: "Livré"     },
];

const STATUS_STEP: Partial<Record<ParcelStatus, number>> = {
  DECLARED:   0,
  COLLECTED:  1,
  IN_TRANSIT: 2,
  ARRIVED:    3,
  READY:      4,
  DELIVERED:  5,
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--hh-radius-md)] bg-hh-sand/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">
        {label}
      </p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-hh-earth-dk">
        {value}
      </p>
    </div>
  );
}

export function ParcelHero({
  parcelId,
  trackingCode,
  status,
  recipientFirstName,
  recipientLastName,
  recipientCity,
  recipientCountry,
  itemCount,
  weightKg,
  shipmentReference,
}: {
  parcelId: string;
  trackingCode: string;
  status: ParcelStatus;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCity: string | null;
  recipientCountry: Country;
  itemCount: number;
  weightKg: number | null;
  shipmentReference: string | null;
}) {
  const step = STATUS_STEP[status] ?? -1;
  const isIssue = status === "ISSUE";

  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm sm:p-6">
      {/* Top */}
      <div className="flex flex-col gap-3">
        <Link
          href="/client/parcels"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          <ArrowLeft size={13} strokeWidth={1.8} />
          Mes colis
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[22px] font-medium tracking-tight text-hh-earth-dk sm:text-[24px]">
            {trackingCode}
          </span>
          <ParcelStatusBadge status={status} />
        </div>

        <p className="flex items-center gap-1.5 text-[13px] text-hh-muted">
          <MapPin size={13} strokeWidth={1.5} className="shrink-0" />
          <span className="text-hh-earth-dk">
            {recipientFirstName} {recipientLastName}
          </span>
          <span className="text-hh-muted/70">·</span>
          <span className="text-hh-earth-dk">
            {recipientCity ? `${recipientCity}, ` : ""}
            {countryLabelFr(recipientCountry)}
          </span>
        </p>
      </div>

      {/* Status stepper */}
      {!isIssue ? (
        <div className="mt-5">
          <ol className="flex items-center gap-1">
            {TIMELINE_STEPS.map((s, i) => {
              const reached = i <= step;
              const current = i === step;
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
          <ol className="mt-1.5 hidden grid-cols-6 text-center text-[10px] uppercase tracking-wide text-hh-muted sm:grid">
            {TIMELINE_STEPS.map((s, i) => (
              <li
                key={s.key}
                className={cn(i === step ? "font-semibold text-hh-earth-dk" : "")}
              >
                {s.label}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--hh-radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Un incident a été signalé sur ce colis. Contacte ton transitaire pour plus d&apos;infos.
        </div>
      )}

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi label="Contenu" value={itemCount > 0 ? `${itemCount} article${itemCount > 1 ? "s" : ""}` : "—"} />
        <Kpi label="Poids" value={weightKg != null ? `${weightKg} kg` : "—"} />
        <Kpi label="Envoi" value={shipmentReference ?? "Non affecté"} />
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hh-sand-dk/15 pt-4">
        <Link
          href={`/api/parcels/${parcelId}/label`}
          target="_blank"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-saffron bg-hh-saffron-lt px-4 text-[13px] font-medium text-hh-saffron-dk hover:bg-hh-saffron/10"
        >
          <Printer size={14} strokeWidth={1.5} />
          {"Imprimer l'étiquette"}
        </Link>
        <Link
          href={`/track/${trackingCode}`}
          target="_blank"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-sand-dk bg-white px-4 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand"
        >
          <Package size={14} strokeWidth={1.5} />
          Suivi public
        </Link>
      </div>
    </section>
  );
}
