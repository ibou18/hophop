import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAdminShipmentById,
  SHIPMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
  PARCEL_STATUS_LABELS,
} from "@/lib/admin-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { PRICING_TYPE_LABEL, CURRENCY_SYMBOL } from "@/lib/pricing";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { AdminShipmentShareButtons } from "@/components/admin/shipment-share-buttons";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  BadgeCheck,
  Box,
  Plane,
  Ship,
  Truck,
  Container,
} from "lucide-react";
import type { TransportMode, PricingType, Currency, ShipmentStatus } from "@/app/generated/prisma/enums";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAdminShipmentById(id);
  return { title: s ? `${s.reference} — Admin Hophop` : "Envoi — Admin" };
}

// ── helpers ───────────────────────────────────────────────────────────────────

const TRANSPORT_ICON: Record<TransportMode, React.ReactNode> = {
  AIR:       <Plane       size={18} strokeWidth={1.5} />,
  SEA:       <Ship        size={18} strokeWidth={1.5} />,
  ROAD:      <Truck       size={18} strokeWidth={1.5} />,
  CONTAINER: <Container   size={18} strokeWidth={1.5} />,
  RORO:      <Truck       size={18} strokeWidth={1.5} />,
};

const TRANSPORT_EMOJI: Record<TransportMode, string> = {
  AIR: "✈️", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};

const STATUS_STYLE: Record<ShipmentStatus, { bg: string; text: string; dot: string }> = {
  DRAFT:      { bg: "bg-slate-100",   text: "text-slate-600",  dot: "bg-slate-400"  },
  CONFIRMED:  { bg: "bg-blue-50",     text: "text-blue-700",   dot: "bg-blue-400"   },
  IN_TRANSIT: { bg: "bg-amber-50",    text: "text-amber-700",  dot: "bg-amber-400"  },
  ARRIVED:    { bg: "bg-violet-50",   text: "text-violet-700", dot: "bg-violet-400" },
  CLOSED:     { bg: "bg-emerald-50",  text: "text-emerald-700",dot: "bg-emerald-500"},
};

const PARCEL_STATUS_DOT: Record<string, string> = {
  DECLARED:   "bg-slate-400",
  COLLECTED:  "bg-blue-400",
  IN_TRANSIT: "bg-amber-400",
  ARRIVED:    "bg-violet-400",
  READY:      "bg-cyan-400",
  DELIVERED:  "bg-emerald-500",
  ISSUE:      "bg-red-400",
};

function fmt(d: Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", opts ?? {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(d));
}

function fmtShort(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "2-digit" }).format(new Date(d));
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function AdminShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getAdminShipmentById(id);
  if (!s) notFound();

  const st = STATUS_STYLE[s.status];
  const modeEmoji = TRANSPORT_EMOJI[s.transportMode];
  const modeLabel = TRANSPORT_MODE_LABELS[s.transportMode] ?? s.transportMode;
  const originLabel = countryLabelFr(s.originCountry);
  const destLabel = countryLabelFr(s.destinationCountry);

  const base = getAppBaseUrl();
  const publicUrl = `${base}/envois/${s.id}`;

  const pricingRate = (() => {
    if (!s.pricingType) return null;
    const sym = CURRENCY_SYMBOL[s.currency as Currency] ?? s.currency;
    switch (s.pricingType as PricingType) {
      case "WEIGHT_KG":  return s.ratePerKg   != null ? `${s.ratePerKg} ${sym}/kg`    : null;
      case "PER_BOX":    return s.ratePerBox   != null ? `${s.ratePerBox} ${sym}/carton`: null;
      case "FLAT":       return s.flatRate     != null ? `${s.flatRate} ${sym}/colis`  : null;
      case "VOLUMETRIC": return s.ratePerVolume!= null ? `${s.ratePerVolume} ${sym}/unité vol.`: null;
      case "PER_VEHICLE":return s.ratePerVehicle!=null ? `${s.ratePerVehicle} ${sym}/véhicule`: null;
      default: return null;
    }
  })();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">

      {/* ── Back nav + share ─────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shipments"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4 text-slate-600" />
          </Link>
          <span className="text-[14px] text-slate-500">Retour aux envois</span>
        </div>
        <AdminShipmentShareButtons publicUrl={publicUrl} reference={s.reference} />
      </div>

      {/* ══════════════════════════════════════════
          SHAREABLE CARD
          Encadré dans max-w-2xl centré → screenshot parfait
      ══════════════════════════════════════════ */}
      <div className="flex justify-center">
        <div
          id="shipment-card"
          className="w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
          style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #2d3550 50%, #1e2d40 100%)" }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #f5a623, #e8890a)" }} />

          <div className="px-8 py-7">
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                  Hophop · Envoi
                </p>
                <p className="mt-0.5 font-mono text-[22px] font-bold text-white tracking-wider">
                  {s.reference}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${st.bg} ${st.text}`}>
                  {SHIPMENT_STATUS_LABELS[s.status]}
                </span>
                {s.isPublished && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <BadgeCheck size={12} /> Publié
                  </span>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Départ</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-white">{originLabel}</p>
                {s.originCity && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-400">
                    <MapPin size={11} /> {s.originCity}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 px-2">
                <div className="flex items-center gap-2 text-amber-400">
                  {TRANSPORT_ICON[s.transportMode]}
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-px w-10 bg-slate-600" />
                  <ArrowRight size={12} className="text-slate-500" />
                  <div className="h-px w-10 bg-slate-600" />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                  {modeEmoji} {s.transportMode}
                </p>
              </div>

              <div className="flex-1 text-right">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Arrivée</p>
                <p className="mt-1 text-[24px] font-bold leading-none text-white">{destLabel}</p>
                {s.destinationCity && (
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[13px] text-slate-400">
                    {s.destinationCity} <MapPin size={11} />
                  </p>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="my-6 flex items-center gap-3">
              <div className="size-3 rounded-full bg-slate-700 ring-2 ring-slate-600" />
              <div className="flex-1 border-t border-dashed border-slate-600" />
              <div className="size-3 rounded-full bg-slate-700 ring-2 ring-slate-600" />
            </div>

            {/* Key info grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Départ</p>
                <p className="mt-1 text-[14px] font-semibold text-white">{fmtShort(s.departureDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Arrivée est.</p>
                <p className="mt-1 text-[14px] font-semibold text-white">{fmtShort(s.arrivalDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tarif</p>
                <p className="mt-1 text-[14px] font-semibold text-amber-300">
                  {pricingRate ?? (s.pricingType ? PRICING_TYPE_LABEL[s.pricingType as PricingType] : "Non défini")}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-700/60 pt-4">
              <div className="flex items-center gap-2.5">
                {s.forwarder.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.forwarder.logoUrl} alt="" className="size-7 rounded-full object-cover" />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400">
                    {s.forwarder.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-semibold text-white">{s.forwarder.name}</p>
                  <p className="text-[11px] text-slate-500">{s.forwarder.city}</p>
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-600">hophop.ca</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FULL DETAILS
      ══════════════════════════════════════════ */}

      {/* Route & dates */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-4 text-[14px] font-semibold text-slate-700">Trajet & dates</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Origine" value={`${originLabel}${s.originCity ? ` · ${s.originCity}` : ""}`} />
          <InfoItem label="Destination" value={`${destLabel}${s.destinationCity ? ` · ${s.destinationCity}` : ""}`} />
          <InfoItem label="Mode de transport" value={modeLabel} />
          <InfoItem label="Date de départ" value={fmt(s.departureDate)} />
          <InfoItem label="Arrivée estimée" value={fmt(s.arrivalDate)} />
          <InfoItem label="Statut" value={SHIPMENT_STATUS_LABELS[s.status]} />
        </dl>
      </div>

      {/* Transitaire & meta */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-4 text-[14px] font-semibold text-slate-700">Transitaire & configuration</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Transitaire" value={s.forwarder.name} />
          <InfoItem label="Code" value={s.forwarder.code5} />
          <InfoItem label="Ville" value={s.forwarder.city ?? "—"} />
          <InfoItem label="Publié" value={s.isPublished ? "Oui" : "Non"} />
          <InfoItem label="Véhicules acceptés" value={s.acceptsVehicles ? "Oui" : "Non"} />
          <InfoItem label="Créé le" value={fmt(s.createdAt)} />
        </dl>
        {s.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 text-[13px] text-slate-700 whitespace-pre-wrap">{s.notes}</p>
          </div>
        )}
      </div>

      {/* Tarification */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-4 text-[14px] font-semibold text-slate-700">Tarification</h2>
        {!s.pricingType ? (
          <p className="text-[13px] text-slate-400">Grille globale du transitaire (aucun tarif spécifique).</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Type" value={PRICING_TYPE_LABEL[s.pricingType as PricingType]} />
            <InfoItem label="Devise" value={`${CURRENCY_SYMBOL[s.currency as Currency]} ${s.currency}`} />
            {s.ratePerKg      != null && <InfoItem label="Tarif / kg"      value={`${s.ratePerKg} ${s.currency}`} />}
            {s.ratePerBox     != null && <InfoItem label="Tarif / carton"  value={`${s.ratePerBox} ${s.currency}`} />}
            {s.flatRate       != null && <InfoItem label="Prix fixe / colis"value={`${s.flatRate} ${s.currency}`} />}
            {s.ratePerVolume  != null && <InfoItem label="Tarif volumétrique" value={`${s.ratePerVolume} ${s.currency}`} />}
            {s.ratePerVehicle != null && <InfoItem label="Tarif / véhicule"value={`${s.ratePerVehicle} ${s.currency}`} />}
            {s.minimumCharge  > 0    && <InfoItem label="Minimum"         value={`${s.minimumCharge} ${s.currency}`} />}
            {s.pricingType === "VOLUMETRIC" && (
              <InfoItem label="Diviseur volumétrique" value={String(s.volumeDivisor)} />
            )}
          </dl>
        )}
      </div>

      {/* Colis */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[14px] font-semibold text-slate-700">
            Colis ({s._count.parcels})
          </h2>
        </div>

        {s.parcels.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Box className="size-7 text-slate-300" strokeWidth={1.5} />
            <p className="text-[13px] text-slate-400">Aucun colis dans cet envoi.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 bg-slate-50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Client · Destinataire</span>
              <span className="text-right">Poids</span>
              <span className="text-right">Date</span>
              <span className="text-right">Statut</span>
            </div>
            {s.parcels.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] font-semibold text-slate-700">
                    {p.trackingCode}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {p.client ? `${p.client.firstName} ${p.client.lastName}` : "—"}
                    {p.recipient && (
                      <> → {p.recipient.firstName} · {p.recipient.city}</>
                    )}
                  </p>
                </div>
                <span className="text-right text-[12px] text-slate-500">
                  {p.weightKg != null ? `${p.weightKg} kg` : "—"}
                </span>
                <span className="text-right text-[11px] text-slate-400">
                  {fmtShort(p.createdAt)}
                </span>
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`size-1.5 shrink-0 rounded-full ${PARCEL_STATUS_DOT[p.status] ?? "bg-slate-300"}`} />
                  <span className="text-[11px] font-medium text-slate-600">
                    {PARCEL_STATUS_LABELS[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-slate-700">{value}</dd>
    </div>
  );
}
