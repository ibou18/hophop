"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Calendar, Package, Plane, ArrowRight } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { Country, ShipmentStatus } from "@/app/generated/prisma/enums";
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

export interface ShipmentCardData {
  id: string;
  reference: string;
  status: ShipmentStatus;
  originCountry: Country;
  destinationCountry: Country;
  destinationCity: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  parcelCount: number;
}

function formatDate(d: string | null): string {
  if (!d) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

interface Props {
  shipments: ShipmentCardData[];
  isLinked: boolean;
  /** Depuis un lien partagé (`?envoi=`). */
  highlightShipmentId?: string;
}

export function ForwarderShipmentsGrid({
  shipments,
  isLinked,
  highlightShipmentId,
}: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!highlightShipmentId) return;
    const id = `shipment-card-${highlightShipmentId}`;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
      {shipments.map((s, i) => (
        <motion.div
          id={`shipment-card-${s.id}`}
          key={s.id}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-hh-sand-dk/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg",
            highlightShipmentId === s.id &&
              "ring-2 ring-hh-saffron shadow-lg ring-offset-2 ring-offset-hh-sand",
          )}
        >
          {/* Status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-hh-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
              {STATUS_LABEL[s.status]}
            </div>
            <span className="rounded-md bg-hh-sand px-2 py-0.5 font-mono text-[10px] text-hh-muted">
              {s.reference}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-semibold text-hh-nuit">
                {s.originCountry}
              </span>
              <span className="text-[10px] text-hh-muted">
                {countryLabelFr(s.originCountry)}
              </span>
            </div>
            <div className="flex flex-1 items-center gap-1 px-2">
              <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              >
                <Plane size={13} className="text-hh-saffron" />
              </motion.div>
              <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-semibold text-hh-nuit">
                {s.destinationCountry}
              </span>
              <span className="text-[10px] text-hh-muted">
                {s.destinationCity ?? countryLabelFr(s.destinationCountry)}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-4 space-y-1.5 border-t border-hh-sand-dk/30 pt-4">
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
                  Arrivée
                </span>
                <span className="font-medium text-hh-nuit">
                  {formatDate(s.arrivalDate)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-hh-muted">Colis enregistrés</span>
              <span className="font-medium text-hh-nuit">{s.parcelCount}</span>
            </div>
          </div>

          {/* Join nudge */}
          {!isLinked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.07 + 0.3 }}
              className="mt-4 flex items-center justify-between rounded-xl bg-hh-saffron-lt px-3 py-2 text-xs"
            >
              <span className="text-hh-saffron-dk">Rejoignez pour participer</span>
              <ArrowRight size={12} className="text-hh-saffron" />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
