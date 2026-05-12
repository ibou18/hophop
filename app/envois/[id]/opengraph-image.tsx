import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { Currency, ShipmentStatus } from "@/app/generated/prisma/enums";

export const runtime = "nodejs";
export const alt = "Envoi Hophop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TRANSPORT_EMOJI: Record<string, string> = {
  AIR: "✈", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};

const STATUS_FR: Record<ShipmentStatus, string> = {
  DRAFT: "Brouillon", CONFIRMED: "Confirmé", IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé", CLOSED: "Clôturé",
};

const STATUS_BADGE: Record<ShipmentStatus, { bg: string; color: string }> = {
  DRAFT:      { bg: "#f1f5f9", color: "#475569" },
  CONFIRMED:  { bg: "#eff6ff", color: "#1d4ed8" },
  IN_TRANSIT: { bg: "#fffbeb", color: "#b45309" },
  ARRIVED:    { bg: "#f5f3ff", color: "#7c3aed" },
  CLOSED:     { bg: "#ecfdf5", color: "#059669" },
};

const CURRENCY_SYM: Record<string, string> = {
  EUR: "€", CAD: "$CA", XOF: "FCFA", XAF: "FCFA", GNF: "GNF", NGN: "₦",
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(d));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const s = await prisma.shipment.findUnique({
    where: { id },
    select: {
      reference: true,
      status: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      originCity: true,
      destinationCity: true,
      departureDate: true,
      arrivalDate: true,
      isPublished: true,
      pricingType: true,
      ratePerKg: true,
      ratePerBox: true,
      flatRate: true,
      ratePerVehicle: true,
      currency: true,
      forwarder: { select: { name: true, city: true, logoUrl: true } },
    },
  });

  if (!s) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f2e" }}>
        <div style={{ color: "#64748b", fontSize: 28 }}>Envoi introuvable</div>
      </div>,
      { ...size },
    );
  }

  const origin = countryLabelFr(s.originCountry);
  const dest   = countryLabelFr(s.destinationCountry);
  const emoji  = TRANSPORT_EMOJI[s.transportMode] ?? "📦";
  const badge  = STATUS_BADGE[s.status];
  const sym    = CURRENCY_SYM[s.currency as Currency] ?? s.currency;

  const pricingRate = (() => {
    if (!s.pricingType) return "Sur devis";
    if (s.ratePerKg      != null) return `${s.ratePerKg} ${sym}/kg`;
    if (s.ratePerBox     != null) return `${s.ratePerBox} ${sym}/carton`;
    if (s.flatRate       != null) return `${s.flatRate} ${sym}/colis`;
    if (s.ratePerVehicle != null) return `${s.ratePerVehicle} ${sym}/véh.`;
    return "Sur devis";
  })();

  const initial = s.forwarder.name.charAt(0).toUpperCase();

  // Simulated dashes for separator
  const DASHES = Array.from({ length: 28 }, (_, i) => i);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a1f2e 0%, #2d3550 50%, #1e2d40 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* ── Amber top bar ── */}
        <div style={{ height: 8, width: "100%", background: "linear-gradient(90deg, #f5a623, #e8890a)", flexShrink: 0 }} />

        {/* ── Main content ── */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "44px 72px 40px" }}>

          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left: label + reference */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(245,166,35,0.85)", textTransform: "uppercase" }}>
                Hophop · Envoi
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "0.1em", fontFamily: "monospace" }}>
                {s.reference}
              </div>
            </div>

            {/* Right: status badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center",
                background: badge.bg, color: badge.color,
                borderRadius: 99, padding: "6px 18px",
                fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {STATUS_FR[s.status]}
              </div>
              {s.isPublished && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: "#34d399" }} />
                  Disponible
                </div>
              )}
            </div>
          </div>

          {/* Route hero */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 40, gap: 0 }}>
            {/* Origin */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", color: "#64748b", textTransform: "uppercase" }}>
                Départ
              </div>
              <div style={{ fontSize: 58, fontWeight: 900, color: "white", lineHeight: 1 }}>
                {origin}
              </div>
              {s.originCity && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16, color: "#64748b" }}>
                  📍 {s.originCity}
                </div>
              )}
            </div>

            {/* Arrow center */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 10, padding: "0 32px" }}>
              <div style={{ fontSize: 34, color: "#f5a623", lineHeight: 1 }}>{emoji}</div>
              <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 6 }}>
                <div style={{ flex: 1, height: 2, background: "rgba(100,116,139,0.35)" }} />
                <div style={{ color: "#475569", fontSize: 18 }}>→</div>
                <div style={{ flex: 1, height: 2, background: "rgba(100,116,139,0.35)" }} />
              </div>
            </div>

            {/* Destination */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", color: "#64748b", textTransform: "uppercase" }}>
                Arrivée
              </div>
              <div style={{ fontSize: 58, fontWeight: 900, color: "white", lineHeight: 1 }}>
                {dest}
              </div>
              {s.destinationCity && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16, color: "#64748b" }}>
                  {s.destinationCity} 📍
                </div>
              )}
            </div>
          </div>

          {/* Dashed separator with notch circles */}
          <div style={{ display: "flex", alignItems: "center", margin: "28px 0" }}>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: "#374151", border: "2px solid #4b5563", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              {DASHES.map((i) => (
                <div key={i} style={{ width: 14, height: 2, background: "#374151", borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: "#374151", border: "2px solid #4b5563", flexShrink: 0 }} />
          </div>

          {/* 3 facts */}
          <div style={{ display: "flex", gap: 0 }}>
            {/* Départ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#64748b", textTransform: "uppercase" }}>
                Départ prévu
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                {fmtDate(s.departureDate)}
              </div>
            </div>
            {/* Arrivée */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#64748b", textTransform: "uppercase" }}>
                Arrivée est.
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                {fmtDate(s.arrivalDate)}
              </div>
            </div>
            {/* Tarif */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#64748b", textTransform: "uppercase" }}>
                Tarif
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>
                {pricingRate}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "auto", paddingTop: 20,
            borderTop: "1px solid rgba(55,65,81,0.8)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 99,
                background: "rgba(245,166,35,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 800, color: "#f5a623",
                border: "2px solid rgba(245,166,35,0.2)",
              }}>
                {initial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>{s.forwarder.name}</div>
                {s.forwarder.city && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>{s.forwarder.city}</div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#334155", fontFamily: "monospace", letterSpacing: "0.05em" }}>
              hophop.ca
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
