import { ArrowRight, MapPin, BadgeCheck } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import type { PublicShipmentData } from "@/app/envois/[id]/page";
import type { Currency, TransportMode, ShipmentStatus } from "@/app/generated/prisma/enums";

const TRANSPORT_EMOJI: Record<TransportMode, string> = {
  AIR: "✈️", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};

const STATUS_STYLE: Record<ShipmentStatus, { bg: string; text: string }> = {
  DRAFT:      { bg: "bg-slate-100",   text: "text-slate-600"  },
  CONFIRMED:  { bg: "bg-blue-50",     text: "text-blue-700"   },
  IN_TRANSIT: { bg: "bg-amber-50",    text: "text-amber-700"  },
  ARRIVED:    { bg: "bg-violet-50",   text: "text-violet-700" },
  CLOSED:     { bg: "bg-emerald-50",  text: "text-emerald-700"},
};

const STATUS_FR: Record<ShipmentStatus, string> = {
  DRAFT: "Brouillon", CONFIRMED: "Confirmé", IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé", CLOSED: "Clôturé",
};

function fmtShort(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(d));
}

export function ShipmentPublicCard({ shipment: s }: { shipment: PublicShipmentData }) {
  const st = STATUS_STYLE[s.status];
  const emoji = TRANSPORT_EMOJI[s.transportMode];
  const sym = CURRENCY_SYMBOL[s.currency as Currency] ?? s.currency;
  const origin = countryLabelFr(s.originCountry);
  const dest   = countryLabelFr(s.destinationCountry);

  const pricingRate = (() => {
    if (!s.pricingType) return null;
    if (s.ratePerKg      != null) return `${s.ratePerKg} ${sym}/kg`;
    if (s.ratePerBox     != null) return `${s.ratePerBox} ${sym}/carton`;
    if (s.flatRate       != null) return `${s.flatRate} ${sym}/colis`;
    if (s.ratePerVehicle != null) return `${s.ratePerVehicle} ${sym}/véhicule`;
    return null;
  })();

  return (
    <div
      id="shipment-share-card"
      className="w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #2d3550 50%, #1e2d40 100%)" }}
    >
      {/* Amber top bar */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #f5a623, #e8890a)" }} />

      <div className="px-7 py-6 sm:px-10 sm:py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/80">
              Hophop · Envoi
            </p>
            <p className="mt-0.5 font-mono text-[22px] font-bold tracking-wider text-white">
              {s.reference}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}>
              {STATUS_FR[s.status]}
            </span>
            {s.isPublished && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <BadgeCheck size={12} /> Disponible
              </span>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="mt-6 flex items-center gap-3 sm:gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Départ</p>
            <p className="mt-1 text-[22px] sm:text-[26px] font-extrabold leading-none text-white truncate">
              {origin}
            </p>
            {s.originCity && (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-400">
                <MapPin size={10} /> {s.originCity}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-2xl text-amber-400">{emoji}</span>
            <div className="flex items-center gap-1">
              <div className="h-px w-6 sm:w-10 bg-slate-600" />
              <ArrowRight size={12} className="text-slate-500" />
              <div className="h-px w-6 sm:w-10 bg-slate-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Arrivée</p>
            <p className="mt-1 text-[22px] sm:text-[26px] font-extrabold leading-none text-white truncate">
              {dest}
            </p>
            {s.destinationCity && (
              <p className="mt-1 flex items-center justify-end gap-1 text-[12px] text-slate-400">
                {s.destinationCity} <MapPin size={10} />
              </p>
            )}
          </div>
        </div>

        {/* Dashed separator */}
        <div className="my-5 flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-slate-700 ring-2 ring-slate-600" />
          <div className="flex-1 border-t border-dashed border-slate-700" />
          <div className="size-2.5 rounded-full bg-slate-700 ring-2 ring-slate-600" />
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Départ" value={fmtShort(s.departureDate)} />
          <Fact label="Arrivée est." value={fmtShort(s.arrivalDate)} />
          <Fact label="Colis" value={String(s._count.parcels)} />
          <Fact label="Tarif" value={pricingRate ?? "Sur devis"} amber={!!pricingRate} />
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-700/60 pt-4">
          <div className="flex items-center gap-2.5">
            {s.forwarder.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.forwarder.logoUrl}
                alt=""
                className="size-8 rounded-full object-cover ring-2 ring-slate-600"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/20 text-[12px] font-bold text-amber-400">
                {s.forwarder.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-white">{s.forwarder.name}</p>
              {s.forwarder.city && (
                <p className="text-[11px] text-slate-500">{s.forwarder.city}</p>
              )}
            </div>
          </div>
          <p className="font-mono text-[11px] text-slate-600">hophop.ca</p>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-[13px] font-bold ${amber ? "text-amber-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
