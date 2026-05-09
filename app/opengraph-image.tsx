import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "hOpOp — Suivi de colis & transitaires diaspora-Afrique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #f7f3ed 0%, #fdf0e0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            <span style={{ color: "#4A1F08" }}>hOp</span>
            <span style={{ color: "#E8820C" }}>Op</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#1C1917",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Envoie et suis tes colis entre la diaspora et l&apos;Afrique.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#7A3F04",
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Transitaires vérifiés · Suivi en temps réel · Sénégal · Côte
            d&apos;Ivoire · Mali · Guinée · Cameroun
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#4A1F08",
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            <span>📦 Suivi temps réel</span>
            <span>✈️ Aérien · Maritime · Routier</span>
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "#E8820C",
              color: "white",
              fontWeight: 600,
            }}
          >
            hophop.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
