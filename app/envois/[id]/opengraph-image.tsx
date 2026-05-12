import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { countryLabelFr } from "@/lib/country-label-fr";

export const runtime = "nodejs";
export const alt = "Envoi Hophop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TRANSPORT_EMOJI: Record<string, string> = {
  AIR: "✈", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const s = await prisma.shipment.findUnique({
    where: { id },
    select: {
      reference: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      originCity: true,
      destinationCity: true,
      departureDate: true,
      status: true,
      forwarder: { select: { name: true, city: true } },
    },
  });

  const origin = s ? countryLabelFr(s.originCountry) : "—";
  const dest   = s ? countryLabelFr(s.destinationCountry) : "—";
  const ref    = s?.reference ?? "—";
  const emoji  = s ? (TRANSPORT_EMOJI[s.transportMode] ?? "📦") : "📦";
  const fwd    = s?.forwarder.name ?? "";
  const dep    = s?.departureDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s.departureDate))
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1a1f2e 0%, #2d3550 50%, #1e2d40 100%)",
          fontFamily: "sans-serif",
          padding: 0,
        }}
      >
        {/* Top amber bar */}
        <div style={{ height: 6, background: "linear-gradient(90deg, #f5a623, #e8890a)", width: "100%" }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 64px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(245,166,35,0.8)", textTransform: "uppercase" }}>
                Hophop · Envoi
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "white", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                {ref}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 16px" }}>
              <div style={{ fontSize: 24 }}>{emoji}</div>
              <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>
                {s?.transportMode ?? ""}
              </div>
            </div>
          </div>

          {/* Route — main hero */}
          <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: "#64748b", textTransform: "uppercase" }}>
                Départ
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: "white", lineHeight: 1 }}>
                {origin}
              </div>
              {s?.originCity && (
                <div style={{ fontSize: 18, color: "#64748b" }}>{s.originCity}</div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 8 }}>
              <div style={{ fontSize: 36, color: "#f5a623" }}>{emoji}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
                <div style={{ flex: 1, height: 2, background: "rgba(100,116,139,0.4)" }} />
                <div style={{ color: "#64748b", fontSize: 20, padding: "0 12px" }}>→</div>
                <div style={{ flex: 1, height: 2, background: "rgba(100,116,139,0.4)" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: "#64748b", textTransform: "uppercase" }}>
                Arrivée
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: "white", lineHeight: 1 }}>
                {dest}
              </div>
              {s?.destinationCity && (
                <div style={{ fontSize: 18, color: "#64748b" }}>{s.destinationCity}</div>
              )}
            </div>
          </div>

          {/* Bottom info row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
            <div style={{ display: "flex", gap: 32 }}>
              {dep && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#64748b", textTransform: "uppercase" }}>Départ prévu</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f5a623" }}>{dep}</div>
                </div>
              )}
              {fwd && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#64748b", textTransform: "uppercase" }}>Transitaire</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{fwd}</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 15, color: "#334155", fontFamily: "monospace" }}>hophop.ca</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
