"use client";

import { useEffect, useRef } from "react";
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
import { gsap, ScrollTrigger } from "@/lib/gsap";
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
  ML: "🇲🇱",
  GM: "🇬🇲",
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
    iconBg: "rgba(14,165,233,0.10)",
    bar: "#38bdf8",
  },
  SEA: {
    Icon: Ship,
    label: "Maritime",
    iconColor: "#0f766e",
    iconBg: "rgba(20,184,166,0.10)",
    bar: "#2dd4bf",
  },
  ROAD: {
    Icon: Truck,
    label: "Route",
    iconColor: "#b45309",
    iconBg: "rgba(245,158,11,0.10)",
    bar: "#fbbf24",
  },
  CONTAINER: {
    Icon: Container,
    label: "Conteneur",
    iconColor: "#4338ca",
    iconBg: "rgba(99,102,241,0.10)",
    bar: "#818cf8",
  },
  RORO: {
    Icon: Ship,
    label: "RoRo",
    iconColor: "#7c3aed",
    iconBg: "rgba(139,92,246,0.10)",
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
      <span className="font-semibold text-red-600">Aujourd&apos;hui !</span>
    );
  if (days === 1)
    return <span className="font-semibold text-hh-saffron-dk">Demain</span>;
  if (days <= 7)
    return (
      <span className="font-semibold text-hh-saffron-dk">Dans {days} j.</span>
    );
  return <span className="font-medium text-hh-muted">Dans {days} j.</span>;
}

export function UpcomingDepartures({
  shipments,
}: {
  shipments: PublicUpcomingShipment[];
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const cards = rootRef.current!.querySelectorAll<HTMLElement>(
        "[data-shipment-card]"
      );
      if (!cards.length) return;

      gsap.from(cards, {
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 75%",
          once: true,
        },
        immediateRender: false,
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(rootRef.current!.querySelectorAll<HTMLElement>("[data-fade]"), {
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 80%",
          once: true,
        },
        immediateRender: false,
        y: 24,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [shipments.length]);

  if (shipments.length === 0) return null;

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-hh-sand px-5 py-20"
    >
      {/* Halo soleil léger */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <p
            data-fade
            className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk"
          >
            En ce moment sur Hophop
          </p>
          <h2
            data-fade
            className="text-3xl font-semibold text-hh-nuit sm:text-4xl"
          >
            Prochains départs
          </h2>
          <p
            data-fade
            className="mt-3 max-w-md text-sm text-hh-muted"
          >
            Ces envois groupés partent bientôt. Rejoignez-en un pour expédier
            votre colis ou votre véhicule.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shipments.map((s) => {
            const m = MODE[s.transportMode];
            const { Icon } = m;
            const pricing = formatPricing(s);

            return (
              <Link
                key={s.id}
                data-shipment-card
                href={`/p/${s.forwarder.code5}`}
                className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-hh-saffron/40 hover:shadow-xl hover:shadow-hh-saffron/10"
              >
                {/* Top row: mode + countdown */}
                <div className="mr-10 flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: m.iconBg }}
                  >
                    <Icon size={16} style={{ color: m.iconColor }} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-hh-sand-dk bg-hh-sand/60 px-2.5 py-1 text-xs">
                    <CalendarDays size={10} className="text-hh-muted" />
                    <Countdown date={s.departureDate} />
                  </div>
                </div>

                {/* Route */}
                <div>
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-hh-nuit">
                    <span>{COUNTRY_FLAG[s.originCountry] ?? ""}</span>
                    <span className="text-hh-muted/50">→</span>
                    <span>{COUNTRY_FLAG[s.destinationCountry] ?? ""}</span>
                    <span className="truncate">
                      {countryLabelFr(s.destinationCountry as Country)}
                      {s.destinationCity && (
                        <span className="ml-1 text-[13px] font-normal text-hh-muted">
                          · {s.destinationCity}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-hh-muted">
                    depuis {countryLabelFr(s.originCountry as Country)}
                  </p>
                </div>

                {/* Bottom: forwarder + date + tarif */}
                <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-hh-earth-dk">
                      {s.forwarder.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-hh-muted">
                      {format(s.departureDate, "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>

                  {pricing && (
                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-hh-saffron-lt px-2 py-1 text-[11px] font-semibold text-hh-saffron-dk">
                      <Tag size={10} />
                      {pricing}
                    </div>
                  )}
                </div>

                {/* Bottom bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: m.bar }}
                />

                {/* Arrow */}
                <ArrowRight
                  size={14}
                  className="absolute right-4 top-4 text-hh-muted/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-hh-saffron"
                />
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div
          data-fade
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-saffron px-7 text-sm font-medium text-white shadow-md shadow-hh-saffron/25 transition-all hover:-translate-y-0.5 hover:bg-hh-saffron/90"
          >
            Rejoindre un envoi
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-hh-sand-dk bg-white px-7 text-sm font-medium text-hh-earth-dk transition-all hover:border-hh-saffron/40 hover:bg-hh-saffron-lt"
          >
            Déjà inscrit ?
          </Link>
        </div>
      </div>
    </section>
  );
}
