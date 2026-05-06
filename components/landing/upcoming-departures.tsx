import Link from "next/link";
import {
  Plane,
  Ship,
  Truck,
  Container,
  Tag,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PublicUpcomingShipment } from "@/lib/public-shipments-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import type {
  Country,
  Currency,
  PricingType,
  TransportMode,
} from "@/app/generated/prisma/enums";

const COUNTRY_FLAG: Record<string, string> = {
  CA: "🇨🇦",
  FR: "🇫🇷",
  GN: "🇬🇳",
  SN: "🇸🇳",
  CI: "🇨🇮",
  CM: "🇨🇲",
};

const MODE: Record<
  TransportMode,
  {
    Icon: typeof Plane;
    label: string;
    iconColor: string;
    iconBg: string;
    bar: string;
  }
> = {
  AIR: {
    Icon: Plane,
    label: "Avion",
    iconColor: "#0369a1",
    iconBg: "rgba(14,165,233,0.12)",
    bar: "#38bdf8",
  },
  SEA: {
    Icon: Ship,
    label: "Maritime",
    iconColor: "#0f766e",
    iconBg: "rgba(20,184,166,0.12)",
    bar: "#2dd4bf",
  },
  ROAD: {
    Icon: Truck,
    label: "Route",
    iconColor: "#b45309",
    iconBg: "rgba(245,158,11,0.12)",
    bar: "#fbbf24",
  },
  CONTAINER: {
    Icon: Container,
    label: "Conteneur",
    iconColor: "#4338ca",
    iconBg: "rgba(99,102,241,0.12)",
    bar: "#818cf8",
  },
  RORO: {
    Icon: Ship,
    label: "RoRo",
    iconColor: "#7c3aed",
    iconBg: "rgba(139,92,246,0.12)",
    bar: "#a78bfa",
  },
};

function formatPricing(s: PublicUpcomingShipment): string | null {
  if (!s.pricingType) return null;
  const sym = CURRENCY_SYMBOL[s.currency as Currency] ?? s.currency;
  switch (s.pricingType as PricingType) {
    case "WEIGHT_KG":
      return s.ratePerKg != null ? `${s.ratePerKg} ${sym} / kg` : null;
    case "PER_BOX":
      return s.ratePerBox != null ? `${s.ratePerBox} ${sym} / carton` : null;
    case "FLAT":
      return s.flatRate != null ? `${s.flatRate} ${sym} / colis` : null;
    case "VOLUMETRIC":
      return s.ratePerVolume != null ? `${s.ratePerVolume} ${sym} / u.vol` : null;
    case "PER_VEHICLE":
      return s.ratePerVehicle != null ? `${s.ratePerVehicle} ${sym} / véhicule` : null;
  }
}

function Countdown({ date }: { date: Date }) {
  const days = differenceInCalendarDays(date, new Date());
  if (days === 0)
    return (
      <span className="font-semibold text-hh-kola">Aujourd&apos;hui !</span>
    );
  if (days === 1)
    return <span className="font-semibold text-hh-saffron">Demain</span>;
  if (days <= 7)
    return (
      <span className="font-semibold text-hh-saffron">Dans {days} j.</span>
    );
  return <span className="font-medium text-white/60">Dans {days} j.</span>;
}

export function UpcomingDepartures({
  shipments,
}: {
  shipments: PublicUpcomingShipment[];
}) {
  if (shipments.length === 0) return null;

  return (
    <section className="bg-hh-nuit px-5 pt-4 pb-10 sm:pt-6">
      {/* Subtle radial glow top-center */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -mt-20 h-72 w-72 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron">
            En ce moment sur Hophop
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Prochains départs
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/45">
            Ces envois groupés partent bientôt. Inscrivez-vous et rejoignez
            l&apos;un d&apos;eux pour expédier votre colis.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shipments.map((s) => {
            const m = MODE[s.transportMode];
            const { Icon } = m;
            const days = differenceInCalendarDays(s.departureDate, new Date());
            const isUrgent = days <= 3;
            const pricing = formatPricing(s);

            return (
              <Link
                key={s.id}
                href={`/p/${s.forwarder.code5}`}
                className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-hh-saffron/30 hover:bg-white/8 hover:shadow-xl hover:shadow-hh-saffron/5 hover:-translate-y-0.5"
              >
                {/* Urgency glow on urgent cards */}
                {isUrgent && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      boxShadow: "inset 0 0 40px rgba(232,130,12,0.08)",
                    }}
                  />
                )}

                {/* Top row: mode icon + countdown */}
                <div className="flex items-center justify-between mr-10">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: m.iconBg }}
                  >
                    <Icon size={16} style={{ color: m.iconColor }} />
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                    <CalendarDays size={10} className="text-white/40" />
                    <Countdown date={s.departureDate} />
                  </div>
                </div>

                {/* Route */}
                <div>
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <span>{COUNTRY_FLAG[s.originCountry] ?? ""}</span>
                    <span className="text-white/30">→</span>
                    <span>{COUNTRY_FLAG[s.destinationCountry] ?? ""}</span>
                    <span className="truncate">
                      {countryLabelFr(s.destinationCountry as Country)}
                      {s.destinationCity && (
                        <span className="ml-1 text-[13px] font-normal text-white/45">
                          · {s.destinationCity}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-white/40">
                    depuis {countryLabelFr(s.originCountry as Country)}
                  </p>
                </div>

                {/* Bottom: forwarder + date + tarif */}
                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-white/70">
                      {s.forwarder.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {format(s.departureDate, "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>

                  {pricing && (
                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-hh-saffron/10 px-2 py-1 text-[11px] font-semibold text-hh-saffron">
                      <Tag size={10} />
                      {pricing}
                    </div>
                  )}
                </div>

                {/* Colored bottom bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40 transition-opacity group-hover:opacity-80"
                  style={{ backgroundColor: m.bar }}
                />

                {/* Arrow */}
                <ArrowRight
                  size={14}
                  className="absolute right-4 top-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-hh-saffron/70"
                />
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-saffron px-7 text-sm font-medium text-white shadow-lg shadow-hh-saffron/20 transition-all hover:bg-hh-saffron/90"
          >
            Rejoindre un envoi
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-white/10 px-7 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            Déjà inscrit ?
          </Link>
        </div>
      </div>
    </section>
  );
}
