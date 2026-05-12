"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Calendar, Container, Package, Plane, Ship, Truck, ArrowRight, Tag } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL, DRUM_SIZE_LABEL_FR, CARTON_SIZE_LABEL_FR } from "@/lib/pricing";
import type { Country, Currency, PricingType, ShipmentStatus, TransportMode } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "En préparation",
  CONFIRMED: "Confirmé",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  CLOSED: "Clôturé",
};

const STATUS_DOT: Record<ShipmentStatus, string> = {
  DRAFT: "bg-hh-muted",
  CONFIRMED: "bg-hh-savane",
  IN_TRANSIT: "bg-hh-saffron",
  ARRIVED: "bg-hh-savane",
  CLOSED: "bg-hh-muted/40",
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
    cardAccent: string;
    animateX?: number[];
    animateY?: number[];
    animateDuration: number;
  }
> = {
  AIR: {
    Icon: Plane,
    label: "Avion",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeRing: "ring-sky-200",
    iconColor: "text-sky-500",
    cardAccent: "border-t-sky-200",
    animateX: [0, 5, 0],
    animateY: [0, -2, 0],
    animateDuration: 2.2,
  },
  SEA: {
    Icon: Ship,
    label: "Maritime",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeRing: "ring-teal-200",
    iconColor: "text-teal-500",
    cardAccent: "border-t-teal-200",
    animateX: [0, 2, -2, 0],
    animateY: [0, 2, 1, 0],
    animateDuration: 3.5,
  },
  ROAD: {
    Icon: Truck,
    label: "Route",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-amber-200",
    iconColor: "text-amber-500",
    cardAccent: "border-t-amber-200",
    animateX: [0, 4, 0],
    animateDuration: 1.8,
  },
  CONTAINER: {
    Icon: Container,
    label: "Conteneur",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    badgeRing: "ring-indigo-200",
    iconColor: "text-indigo-500",
    cardAccent: "border-t-indigo-200",
    animateDuration: 3.0,
  },
  RORO: {
    Icon: Ship,
    label: "RoRo",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeRing: "ring-purple-200",
    iconColor: "text-purple-500",
    cardAccent: "border-t-purple-200",
    animateX: [0, 2, -2, 0],
    animateY: [0, 2, 1, 0],
    animateDuration: 3.5,
  },
};

export interface ShipmentCardData {
  id: string;
  reference: string;
  status: ShipmentStatus;
  transportMode: TransportMode;
  originCountry: Country;
  destinationCountry: Country;
  destinationCity: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  // Tarification de l'envoi
  pricingType: PricingType | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  ratePerVehicle: number | null;
  rateDrumSmall: number | null;
  rateDrumMedium: number | null;
  rateDrumLarge: number | null;
  rateCartonSmall: number | null;
  rateCartonMedium: number | null;
  rateCartonLarge: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
}

function formatDate(d: string | null): string {
  if (!d) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function formatPricing(s: ShipmentCardData): { label: string; value: string } | null {
  if (!s.pricingType) return null;
  const sym = CURRENCY_SYMBOL[s.currency];
  switch (s.pricingType) {
    case "WEIGHT_KG":
      return s.ratePerKg != null
        ? { label: "Au kilo", value: `${s.ratePerKg} ${sym} / kg` }
        : null;
    case "PER_BOX":
      return s.ratePerBox != null
        ? { label: "Au carton", value: `${s.ratePerBox} ${sym} / carton` }
        : null;
    case "FLAT":
      return s.flatRate != null
        ? { label: "Prix fixe", value: `${s.flatRate} ${sym} / colis` }
        : null;
    case "VOLUMETRIC":
      return s.ratePerVolume != null
        ? { label: "Volumétrique", value: `${s.ratePerVolume} ${sym} / u.vol` }
        : null;
    case "PER_VEHICLE":
      return s.ratePerVehicle != null
        ? { label: "Par véhicule", value: `${s.ratePerVehicle} ${sym} / véhicule` }
        : null;
    case "PER_DRUM": {
      const bits = [
        s.rateDrumSmall != null ? `${DRUM_SIZE_LABEL_FR.SMALL} ${s.rateDrumSmall}` : null,
        s.rateDrumMedium != null ? `${DRUM_SIZE_LABEL_FR.MEDIUM} ${s.rateDrumMedium}` : null,
        s.rateDrumLarge != null ? `${DRUM_SIZE_LABEL_FR.LARGE} ${s.rateDrumLarge}` : null,
      ].filter(Boolean);
      return bits.length > 0
        ? { label: "Par fût", value: `${bits.join(" · ")} ${sym}` }
        : null;
    }
    case "PER_SIZED_CARTON": {
      const bits = [
        s.rateCartonSmall != null ? `${CARTON_SIZE_LABEL_FR.SMALL} ${s.rateCartonSmall}` : null,
        s.rateCartonMedium != null ? `${CARTON_SIZE_LABEL_FR.MEDIUM} ${s.rateCartonMedium}` : null,
        s.rateCartonLarge != null ? `${CARTON_SIZE_LABEL_FR.LARGE} ${s.rateCartonLarge}` : null,
      ].filter(Boolean);
      return bits.length > 0
        ? { label: "Par carton (taille)", value: `${bits.join(" · ")} ${sym}` }
        : null;
    }
  }
}

interface Props {
  shipments: ShipmentCardData[];
  forwarderCode5: string;
  isAuthenticated: boolean;
  highlightShipmentId?: string;
}

function declareUrl(forwarderCode5: string, shipmentId: string, isAuthenticated: boolean) {
  const path = `/client/declare?forwarder=${encodeURIComponent(forwarderCode5)}&envoi=${encodeURIComponent(shipmentId)}`;
  if (isAuthenticated) return path;
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}

export function ForwarderShipmentsGrid({
  shipments,
  forwarderCode5,
  isAuthenticated,
  highlightShipmentId,
}: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!highlightShipmentId) return;
    const id = `shipment-card-${highlightShipmentId}`;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => window.clearTimeout(t);
  }, [highlightShipmentId]);

  if (shipments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hh-sand-dk bg-white py-16 text-center"
      >
        <Package size={32} className="text-hh-sand-dk" />
        <p className="text-sm font-medium text-hh-muted">
          Aucun départ publié pour l&rsquo;instant
        </p>
        <p className="text-xs text-hh-muted/70">
          Revenez prochainement ou contactez le transitaire
        </p>
      </motion.div>
    );
  }

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shipments.map((s, i) => {
        const tc = TRANSPORT_CONFIG[s.transportMode];
        const Icon = tc.Icon;
        const pricing = formatPricing(s);
        const href = declareUrl(forwarderCode5, s.id, isAuthenticated);

        return (
          <Link
            id={`shipment-card-${s.id}`}
            key={s.id}
            href={href}
            scroll={false}
            className={cn(
              "group relative block overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hh-saffron",
              `border-t-2 ${tc.cardAccent} border-x-hh-sand-dk/60 border-b-hh-sand-dk/60`,
              highlightShipmentId === s.id &&
                "ring-2 ring-hh-saffron shadow-lg ring-offset-2 ring-offset-hh-sand",
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              {/* Header : statut + mode */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-1.5 text-[11px] text-hh-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                  {STATUS_LABEL[s.status]}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                    tc.badgeBg, tc.badgeText, tc.badgeRing,
                  )}
                >
                  <Icon size={10} />
                  {tc.label}
                </span>
              </div>

              {/* Route */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-0.5 min-w-0">
                    <span className="text-[18px] font-bold text-hh-nuit leading-none">
                      {s.originCountry}
                    </span>
                    <span className="text-[10px] text-hh-muted truncate max-w-[56px] text-center">
                      {countryLabelFr(s.originCountry)}
                    </span>
                  </div>

                  <div className="flex flex-1 items-center gap-1 px-1">
                    <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
                    <motion.div
                      animate={{ x: tc.animateX ?? [0, 4, 0], y: tc.animateY ?? [0, 0, 0] }}
                      transition={{ duration: tc.animateDuration, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                    >
                      <Icon size={13} className={tc.iconColor} />
                    </motion.div>
                    <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
                  </div>

                  <div className="flex flex-col items-center gap-0.5 min-w-0">
                    <span className="text-[18px] font-bold text-hh-nuit leading-none">
                      {s.destinationCountry}
                    </span>
                    <span className="text-[10px] text-hh-muted truncate max-w-[56px] text-center">
                      {s.destinationCity ?? countryLabelFr(s.destinationCountry)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="mx-4 border-t border-hh-sand-dk/30" />

              {/* Dates + tarif */}
              <div className="space-y-1.5 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-hh-muted">
                    <Calendar size={11} />
                    Départ
                  </span>
                  <span className="font-medium text-hh-nuit">
                    {formatDate(s.departureDate)}
                  </span>
                </div>

                {s.arrivalDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-hh-muted">
                      <Calendar size={11} />
                      Arrivée est.
                    </span>
                    <span className="font-medium text-hh-nuit">
                      {formatDate(s.arrivalDate)}
                    </span>
                  </div>
                )}

                {pricing && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-hh-muted">
                      <Tag size={11} />
                      {pricing.label}
                    </span>
                    <span className="font-semibold text-hh-saffron-dk">
                      {pricing.value}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.07 + 0.3 }}
                className="border-t border-hh-sand-dk/20 px-4 py-2.5"
              >
                <div className="flex items-center justify-between rounded-xl bg-hh-saffron-lt px-3 py-2 text-xs">
                  <span className="font-medium text-hh-saffron-dk">
                    {isAuthenticated
                      ? "Déclarer un colis sur cet envoi"
                      : "Connectez-vous pour déclarer"}
                  </span>
                  <ArrowRight size={12} className="text-hh-saffron shrink-0" />
                </div>
              </motion.div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
