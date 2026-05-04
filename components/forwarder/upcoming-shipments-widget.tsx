import Link from "next/link";
import { Plane, Ship, Truck, Package, ArrowRight, CalendarClock } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { UpcomingShipmentRow } from "@/lib/forwarder-dashboard-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { cn } from "@/lib/utils";
import type { TransportMode } from "@/app/generated/prisma/enums";

const MODE_CONFIG: Record<
  TransportMode,
  { Icon: React.ElementType; border: string; bg: string; text: string; iconBg: string }
> = {
  AIR: {
    Icon: Plane,
    border: "border-l-sky-400",
    bg: "bg-sky-50",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
  },
  SEA: {
    Icon: Ship,
    border: "border-l-teal-400",
    bg: "bg-teal-50",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
  },
  ROAD: {
    Icon: Truck,
    border: "border-l-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
  },
};

function DaysCountdown({ date }: { date: Date }) {
  const days = differenceInCalendarDays(date, new Date());

  if (days === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-hh-kola-lt px-2 py-0.5 text-[11px] font-semibold text-hh-kola-dk ring-1 ring-hh-kola/20">
        Aujourd'hui
      </span>
    );
  if (days === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-hh-saffron-lt px-2 py-0.5 text-[11px] font-semibold text-hh-saffron-dk ring-1 ring-hh-saffron/20">
        Demain
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-hh-saffron-lt px-2 py-0.5 text-[11px] font-medium text-hh-saffron-dk ring-1 ring-hh-saffron/15">
        Dans {days} jours
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-hh-sand px-2 py-0.5 text-[11px] font-medium text-hh-muted ring-1 ring-hh-sand-dk/25">
      Dans {days} jours
    </span>
  );
}

function UrgencyBar({ date }: { date: Date }) {
  const days = differenceInCalendarDays(date, new Date());
  const MAX_DAYS = 30;
  const pct = Math.max(0, Math.min(100, (1 - days / MAX_DAYS) * 100));

  const barColor =
    days === 0
      ? "bg-hh-kola"
      : days <= 3
        ? "bg-hh-saffron"
        : days <= 7
          ? "bg-hh-saffron/70"
          : "bg-hh-sand-dk";

  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-hh-sand-dk/30">
      <div
        className={cn("h-full rounded-full transition-all", barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function UpcomingShipmentsWidget({
  shipments,
}: {
  shipments: UpcomingShipmentRow[];
}) {
  if (shipments.length === 0) {
    return (
      <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-8 text-center">
        <CalendarClock size={28} strokeWidth={1.25} className="mx-auto mb-2.5 text-hh-sand-dk" />
        <p className="text-[14px] font-medium text-hh-earth-dk">Aucun départ à venir</p>
        <p className="mt-1 text-[13px] text-hh-muted">
          Les envois confirmés avec une date de départ apparaîtront ici.
        </p>
        <Link
          href="/shipments"
          className="mt-4 inline-flex h-8 items-center justify-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          Gérer les envois
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {shipments.map((s) => {
        const cfg = MODE_CONFIG[s.transportMode];
        const { Icon } = cfg;
        const depDate = s.departureDate!;

        return (
          <Link
            key={s.id}
            href={`/shipments/${s.id}`}
            className={cn(
              "group relative flex items-center gap-3.5 overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/20 bg-white pl-4 pr-4 pt-3.5 pb-3 shadow-sm ring-1 ring-transparent transition-all",
              "hover:ring-hh-saffron/25 hover:border-hh-saffron/25 hover:shadow-md",
              "border-l-[3px]",
              cfg.border,
            )}
          >
            {/* Transport icon */}
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--hh-radius-md)]",
                cfg.iconBg,
              )}
            >
              <Icon size={17} className={cfg.text} />
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-medium text-hh-muted">
                      {s.reference}
                    </span>
                    {s.status === "IN_TRANSIT" && (
                      <span className="inline-flex h-4 items-center rounded-full bg-hh-saffron-lt px-1.5 text-[10px] font-semibold text-hh-saffron-dk ring-1 ring-hh-saffron/20">
                        En transit
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[14px] font-medium text-hh-earth-dk leading-snug">
                    {countryLabelFr(s.originCountry)}
                    <span className="mx-1.5 text-hh-muted">→</span>
                    {countryLabelFr(s.destinationCountry)}
                    {s.destinationCity && (
                      <span className="ml-1 text-[13px] font-normal text-hh-muted">
                        · {s.destinationCity}
                      </span>
                    )}
                  </p>
                </div>

                {/* Countdown pill */}
                <div className="shrink-0">
                  <DaysCountdown date={depDate} />
                </div>
              </div>

              {/* Bottom row: date + parcel count */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="mt-0.5">
                  <UrgencyBar date={depDate} />
                </div>
                <div className="flex shrink-0 items-center gap-3 ml-2">
                  <span className="flex items-center gap-1 text-[12px] text-hh-muted">
                    <CalendarClock size={11} />
                    {format(depDate, "d MMM yyyy", { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-hh-muted">
                    <Package size={11} />
                    {s._count.parcels} colis
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow hint */}
            <ArrowRight
              size={14}
              className="shrink-0 text-hh-sand-dk transition-transform group-hover:translate-x-0.5 group-hover:text-hh-saffron"
            />
          </Link>
        );
      })}
    </div>
  );
}
