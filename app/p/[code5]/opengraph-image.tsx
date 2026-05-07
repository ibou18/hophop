import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { countryLabelFr } from "@/lib/country-label-fr";
import { publicVitrineShipmentWhere } from "@/lib/shipment-public-visibility";
import type { Country } from "@/app/generated/prisma/enums";

export const runtime = "nodejs";
export const alt = "Page transitaire Hophop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FLAG: Record<string, string> = {
  CA: "🇨🇦",
  FR: "🇫🇷",
  GN: "🇬🇳",
  SN: "🇸🇳",
  CI: "🇨🇮",
  CM: "🇨🇲",
  ML: "🇲🇱",
  GM: "🇬🇲",
  TG: "🇹🇬",
  BF: "🇧🇫",
  NG: "🇳🇬",
};

export default async function Image({
  params,
}: {
  params: Promise<{ code5: string }>;
}) {
  const { code5 } = await params;
  const f = await prisma.forwarder.findUnique({
    where: { code5, isActive: true },
    select: {
      name: true,
      city: true,
      country: true,
      shipments: {
        where: publicVitrineShipmentWhere(),
        select: {
          originCountry: true,
          destinationCountry: true,
        },
      },
      _count: { select: { shipments: true } },
    },
  });

  if (!f) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1c1917",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          Hophop
        </div>
      ),
      { ...size },
    );
  }

  // Calcul des pays desservis (origines + destinations uniques)
  const destSet = new Set<string>();
  const originSet = new Set<string>();
  for (const s of f.shipments) {
    destSet.add(s.destinationCountry);
    originSet.add(s.originCountry);
  }
  const destinations = Array.from(destSet).slice(0, 6);
  const origins = Array.from(originSet).slice(0, 4);

  // Initiales pour l'avatar de fallback
  const initials = f.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #f7f3ed 0%, #ffffff 50%, #fdf0e0 100%)",
          padding: 64,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Soleil saffron en haut à droite */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,130,12,0.32) 0%, rgba(245,200,120,0.18) 35%, transparent 70%)",
          }}
        />
        {/* Halo earth en bas à gauche */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(193,59,27,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Top : logo Hophop + badge code */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#7a3f04",
              letterSpacing: -0.5,
            }}
          >
            ✦ Hophop
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "white",
              border: "1px solid #e8e0d4",
              fontSize: 18,
              color: "#1c1917",
              fontWeight: 500,
            }}
          >
            <span style={{ color: "#7c7060" }}>Code</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
              {code5}
            </span>
          </div>
        </div>

        {/* Hero : avatar + nom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginTop: 32,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              background: "linear-gradient(135deg, #e8820c 0%, #c13b1b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
              color: "white",
              boxShadow: "0 20px 40px rgba(232,130,12,0.25)",
            }}
          >
            {initials}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: "#7a3f04",
                fontWeight: 600,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Transitaire vérifié · Hophop
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#1c1917",
                lineHeight: 1.05,
                letterSpacing: -1.5,
                display: "flex",
              }}
            >
              {f.name}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 26,
                color: "#7c7060",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>📍</span>
              <span>
                {f.city}, {countryLabelFr(f.country as Country)}
              </span>
              <span style={{ fontSize: 32 }}>
                {FLAG[f.country] ?? ""}
              </span>
            </div>
          </div>
        </div>

        {/* Routes bandeau */}
        {origins.length > 0 && destinations.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 48,
              padding: 24,
              borderRadius: 24,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid #e8e0d4",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "#7c7060",
                marginBottom: 14,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              Routes desservies
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 36,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {origins.map((c) => (
                  <span key={c} style={{ display: "flex" }}>
                    {FLAG[c] ?? "🌍"}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#e8820c",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                ✈ →
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {destinations.map((c) => (
                  <span key={c} style={{ display: "flex" }}>
                    {FLAG[c] ?? "🌍"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer : URL + invite */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 64,
            right: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#7c7060",
            }}
          >
            <span>hophop.app/p/{code5}</span>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              background: "#e8820c",
              color: "white",
              fontWeight: 600,
            }}
          >
            Suivre & rejoindre →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
