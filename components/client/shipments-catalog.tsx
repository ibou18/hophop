"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plane,
  Ship,
  Truck,
  Calendar,
  Package,
  ArrowRight,
  MapPin,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countryLabelFr, COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import type { Country, ShipmentStatus, TransportMode } from "@/app/generated/prisma/enums";

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "En préparation",
  CONFIRMED: "Confirmé",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  CLOSED: "Clôturé",
};

const STATUS_DOT: Record<ShipmentStatus, string> = {
  DRAFT: "bg-hh-muted",
  CONFIRMED: "bg-emerald-400",
  IN_TRANSIT: "bg-hh-saffron",
  ARRIVED: "bg-emerald-400",
  CLOSED: "bg-hh-muted/40",
};

const STATUS_BG: Record<ShipmentStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-600 ring-gray-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  IN_TRANSIT: "bg-amber-50 text-amber-700 ring-amber-200",
  ARRIVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-gray-50 text-gray-500 ring-gray-100",
};

const TRANSPORT_CONFIG: Record<
  TransportMode,
  {
    Icon: React.ElementType;
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeRing: string;
    iconColor: string;
    accentBorder: string;
    accentBg: string;
  }
> = {
  AIR: {
    Icon: Plane,
    label: "Avion",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeRing: "ring-sky-200",
    iconColor: "text-sky-500",
    accentBorder: "border-t-sky-300",
    accentBg: "from-sky-50/60",
  },
  SEA: {
    Icon: Ship,
    label: "Maritime",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeRing: "ring-teal-200",
    iconColor: "text-teal-500",
    accentBorder: "border-t-teal-300",
    accentBg: "from-teal-50/60",
  },
  ROAD: {
    Icon: Truck,
    label: "Route",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-amber-200",
    iconColor: "text-amber-500",
    accentBorder: "border-t-amber-300",
    accentBg: "from-amber-50/60",
  },
};

function formatDate(d: Date | null): string {
  if (!d) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

const FLAG: Record<string, string> = {
  CA: "🇨🇦",
  FR: "🇫🇷",
  GN: "🇬🇳",
  SN: "🇸🇳",
  CI: "🇨🇮",
  CM: "🇨🇲",
  TG: "🇹🇬",
  BF: "🇧🇫",
  NG: "🇳🇬",
};

export type CatalogRow = {
  id: string;
  reference: string;
  transportMode: TransportMode;
  originCountry: Country;
  destinationCountry: Country;
  destinationCity: string | null;
  departureDate: Date | null;
  arrivalDate: Date | null;
  status: ShipmentStatus;
  forwarder: {
    name: string;
    code5: string;
    city: string | null;
    country: Country;
  };
  _count: { parcels: number };
};

interface Props {
  rows: CatalogRow[];
}

export function ShipmentsCatalog({ rows }: Props) {
  const [originFilter, setOriginFilter] = useState<string>("");
  const [destFilter, setDestFilter] = useState<string>("");

  const originCountries = useMemo(() => {
    const set = new Set(rows.map((r) => r.originCountry));
    return COUNTRY_OPTIONS.filter((o) => set.has(o.value as Country));
  }, [rows]);

  const destCountries = useMemo(() => {
    const set = new Set(rows.map((r) => r.destinationCountry));
    return COUNTRY_OPTIONS.filter((o) => set.has(o.value as Country));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (originFilter && r.originCountry !== originFilter) return false;
      if (destFilter && r.destinationCountry !== destFilter) return false;
      return true;
    });
  }, [rows, originFilter, destFilter]);

  const hasFilters = originFilter || destFilter;

  return (
    <div className="flex flex-col gap-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-hh-muted">
          <Filter size={13} />
          Filtrer par
        </div>

        {/* Filtre départ */}
        <div className="relative">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className={cn(
              "h-8 appearance-none rounded-full border pl-3 pr-7 text-[12px] font-medium outline-none transition-all cursor-pointer",
              originFilter
                ? "border-hh-saffron bg-hh-saffron-lt text-hh-saffron-dk"
                : "border-hh-sand-dk/40 bg-white text-hh-earth-dk hover:border-hh-saffron/50"
            )}
          >
            <option value="">🌍 Pays de départ</option>
            {originCountries.map((o) => (
              <option key={o.value} value={o.value}>
                {FLAG[o.value] ?? "🌍"} {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-hh-muted">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-hh-muted/50 shrink-0">
          <path d="M1 5h12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Filtre arrivée */}
        <div className="relative">
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className={cn(
              "h-8 appearance-none rounded-full border pl-3 pr-7 text-[12px] font-medium outline-none transition-all cursor-pointer",
              destFilter
                ? "border-hh-saffron bg-hh-saffron-lt text-hh-saffron-dk"
                : "border-hh-sand-dk/40 bg-white text-hh-earth-dk hover:border-hh-saffron/50"
            )}
          >
            <option value="">🏁 Pays d'arrivée</option>
            {destCountries.map((o) => (
              <option key={o.value} value={o.value}>
                {FLAG[o.value] ?? "🏁"} {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-hh-muted">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setOriginFilter(""); setDestFilter(""); }}
            className="flex h-8 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 text-[12px] font-medium text-red-600 transition hover:bg-red-100"
          >
            <X size={11} />
            Effacer
          </button>
        )}

        <span className="ml-auto text-[12px] text-hh-muted">
          {filtered.length} envoi{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grille de cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hh-sand-dk/40 bg-white px-5 py-14 text-center">
          <Package className="mx-auto mb-3 size-8 text-hh-sand-dk" strokeWidth={1.25} />
          <p className="text-[14px] font-medium text-hh-earth-dk">
            {hasFilters ? "Aucun envoi pour cette route" : "Aucun envoi ouvert pour le moment"}
          </p>
          <p className="mt-1 text-[13px] text-hh-muted">
            {hasFilters
              ? "Essaie d'autres pays ou efface les filtres."
              : "Reviens plus tard ou contacte directement un transitaire."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const tc = TRANSPORT_CONFIG[row.transportMode];
            const Icon = tc.Icon;

            return (
              <Link
                key={row.id}
                href={`/p/${row.forwarder.code5}?envoi=${row.id}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border-t-2 bg-white shadow-sm ring-1 ring-hh-sand-dk/20 transition-all hover:shadow-md hover:ring-hh-saffron/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hh-saffron",
                  tc.accentBorder
                )}
              >
                {/* Gradient header subtil */}
                <div className={cn("absolute inset-x-0 top-0 h-16 bg-gradient-to-b opacity-60", tc.accentBg)} />

                <div className="relative flex flex-col flex-1 p-4 gap-3">
                  {/* Top row : statut + mode de transport */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                        STATUS_BG[row.status]
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[row.status])} />
                      {STATUS_LABEL[row.status]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                        tc.badgeBg, tc.badgeText, tc.badgeRing
                      )}
                    >
                      <Icon size={10} />
                      {tc.label}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                      <span className="text-2xl leading-none">{FLAG[row.originCountry] ?? "🌍"}</span>
                      <span className="text-[11px] font-semibold text-hh-nuit mt-0.5">{row.originCountry}</span>
                      <span className="text-[10px] text-hh-muted truncate max-w-[60px] text-center">
                        {countryLabelFr(row.originCountry)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="h-px w-5 border-t border-dashed border-hh-sand-dk" />
                        <Icon size={12} className={tc.iconColor} />
                        <div className="h-px w-5 border-t border-dashed border-hh-sand-dk" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                      <span className="text-2xl leading-none">{FLAG[row.destinationCountry] ?? "🏁"}</span>
                      <span className="text-[11px] font-semibold text-hh-nuit mt-0.5">{row.destinationCountry}</span>
                      <span className="text-[10px] text-hh-muted truncate max-w-[60px] text-center">
                        {row.destinationCity ?? countryLabelFr(row.destinationCountry)}
                      </span>
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="border-t border-hh-sand-dk/30" />

                  {/* Infos : transitaire + dates */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-hh-muted shrink-0" />
                      <span className="text-[12px] font-medium text-hh-earth-dk truncate">
                        {row.forwarder.name}
                      </span>
                      <span className="text-[11px] font-mono text-hh-muted ml-auto shrink-0">
                        {row.forwarder.code5}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-hh-muted shrink-0" />
                      <span className="text-[12px] text-hh-muted">Départ</span>
                      <span className="text-[12px] font-medium text-hh-nuit ml-auto">
                        {formatDate(row.departureDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Package size={11} className="text-hh-muted shrink-0" />
                      <span className="text-[12px] text-hh-muted">
                        {row._count.parcels} colis enregistré{row._count.parcels !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA footer */}
                <div className="border-t border-hh-sand-dk/20 bg-hh-sand/30 px-4 py-2.5 transition-colors group-hover:bg-hh-saffron-lt/50">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-hh-saffron-dk">Voir le transitaire</span>
                    <ArrowRight size={12} className="text-hh-saffron transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
