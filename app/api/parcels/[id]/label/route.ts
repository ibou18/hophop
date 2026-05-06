import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";
import { requireForwarderOrClient } from "@/lib/require-auth";

type Ctx = { params: Promise<{ id: string }> };

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const COUNTRY_LABELS: Record<string, string> = {
  CA: "Canada", FR: "France", GN: "Guinée", SN: "Sénégal",
  CI: "Côte d'Ivoire", CM: "Cameroun", TG: "Togo", BF: "Burkina Faso", NG: "Nigeria",
};
const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦", FR: "🇫🇷", GN: "🇬🇳", SN: "🇸🇳", CI: "🇨🇮", CM: "🇨🇲", TG: "🇹🇬", BF: "🇧🇫", NG: "🇳🇬",
};

function countryLine(code: string, city: string | null | undefined): string {
  const flag = COUNTRY_FLAGS[code] ?? "";
  const name = COUNTRY_LABELS[code] ?? code;
  const parts = [city?.trim(), name].filter(Boolean).join(", ");
  return `${flag} ${parts}`;
}

const TRANSPORT_LABELS: Record<string, string> = {
  AIR: "✈ Avion", SEA: "🚢 Maritime", ROAD: "🚛 Route",
  CONTAINER: "📦 Conteneur", RORO: "🚗 RoRo",
};

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;

  const parcel = await prisma.parcel.findFirst({
    where:
      auth.role === "FORWARDER"
        ? { id, forwarderId: auth.forwarderId }
        : { id, clientId: auth.clientId },
    include: {
      recipient: true,
      client: true,
      shipment: {
        select: {
          reference: true,
          transportMode: true,
          originCountry: true,
          originCity: true,
          destinationCountry: true,
          destinationCity: true,
          departureDate: true,
        },
      },
    },
  });
  if (!parcel) return jsonError("Introuvable", 404);

  const fwd = await prisma.forwarder.findUnique({
    where: { id: parcel.forwarderId },
    select: { name: true, code5: true, city: true, country: true },
  });

  const qr = await QRCode.toDataURL(parcel.trackingCode, {
    width: 240,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  // Route info — prefer shipment data, fall back to forwarder/recipient
  const originCountry  = parcel.shipment?.originCountry  ?? fwd?.country ?? "";
  const originCity     = parcel.shipment?.originCity      ?? fwd?.city    ?? null;
  const destCountry    = parcel.shipment?.destinationCountry ?? parcel.recipient.country;
  const destCity       = parcel.shipment?.destinationCity    ?? parcel.recipient.city;
  const transportMode  = parcel.shipment?.transportMode ?? null;
  const departureDate  = parcel.shipment?.departureDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        .format(parcel.shipment.departureDate)
    : null;

  const originLine = esc(countryLine(originCountry, originCity));
  const destLine   = esc(countryLine(destCountry, destCity));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Étiquette — ${esc(parcel.trackingCode)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 40px;
      gap: 16px;
    }

    /* Print button */
    .print-bar {
      width: 100%;
      max-width: 520px;
      display: flex;
      justify-content: flex-end;
    }
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e8820c;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 9px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-print:hover { background: #c96e09; }

    /* Label card */
    .label {
      width: 100%;
      max-width: 520px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      overflow: hidden;
    }

    /* Header */
    .label-header {
      background: #1a1a2e;
      color: #fff;
      padding: 16px 20px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #e8820c;
    }
    .fwd-info {
      text-align: right;
    }
    .fwd-name {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }
    .fwd-code {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      font-family: 'Courier New', monospace;
      margin-top: 2px;
    }

    /* Route banner */
    .route {
      background: #f8f5f0;
      border-bottom: 1px solid #e8e0d5;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .route-point {
      flex: 1;
      min-width: 0;
    }
    .route-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      margin-bottom: 3px;
    }
    .route-place {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }
    .route-arrow {
      flex-shrink: 0;
      font-size: 20px;
      color: #e8820c;
      padding: 0 4px;
    }
    .transport-badge {
      font-size: 11px;
      color: #777;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Body */
    .label-body {
      padding: 18px 20px;
    }

    /* QR + tracking */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 18px;
      border-bottom: 1px dashed #ddd;
      margin-bottom: 18px;
    }
    .qr-section img {
      width: 110px;
      height: 110px;
      border-radius: 10px;
      border: 2px solid #f0f0f0;
      flex-shrink: 0;
    }
    .tracking-block { flex: 1; min-width: 0; }
    .tracking-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      margin-bottom: 6px;
    }
    .tracking-code {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 1px;
      word-break: break-all;
      line-height: 1.1;
    }
    .tracking-url {
      font-size: 11px;
      color: #aaa;
      margin-top: 8px;
    }
    ${departureDate ? `.departure {
      margin-top: 8px;
      font-size: 12px;
      color: #777;
    }` : ""}

    /* Sender / Recipient */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .party-block {
      padding: 12px;
      border-radius: 10px;
      background: #f8f8f8;
    }
    .party-block.recipient {
      background: #fffbf5;
      border: 1px solid #f0e8d8;
    }
    .party-role {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      margin-bottom: 5px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .party-detail {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
      line-height: 1.4;
    }
    .party-phone {
      font-size: 12px;
      font-weight: 600;
      color: #e8820c;
      margin-top: 4px;
    }

    /* Description */
    .description-block {
      padding: 10px 12px;
      border-radius: 10px;
      background: #f3f4f6;
      font-size: 12px;
      color: #555;
    }
    .description-block strong {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      display: block;
      margin-bottom: 3px;
    }

    /* Footer */
    .label-footer {
      border-top: 1px solid #f0f0f0;
      padding: 10px 20px;
      font-size: 10px;
      color: #bbb;
      text-align: center;
    }

    /* ── Print ──────────────────────────────────── */
    @media print {
      body { background: #fff; padding: 0; }
      .print-bar { display: none; }
      .label {
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
        page-break-inside: avoid;
      }
    }

    @page { margin: 12mm; size: A5 portrait; }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">
      🖨 Imprimer l'étiquette
    </button>
  </div>

  <div class="label">

    <!-- Header -->
    <div class="label-header">
      <span class="brand">hophop</span>
      <div class="fwd-info">
        <div class="fwd-name">${esc(fwd?.name)}</div>
        <div class="fwd-code">Code ${esc(fwd?.code5)}</div>
      </div>
    </div>

    <!-- Route -->
    <div class="route">
      <div class="route-point">
        <div class="route-label">Départ</div>
        <div class="route-place">${originLine}</div>
        ${transportMode ? `<div class="transport-badge">${esc(TRANSPORT_LABELS[transportMode] ?? transportMode)}</div>` : ""}
      </div>
      <div class="route-arrow">→</div>
      <div class="route-point" style="text-align:right">
        <div class="route-label">Arrivée</div>
        <div class="route-place">${destLine}</div>
        ${departureDate ? `<div class="transport-badge">Départ le ${esc(departureDate)}</div>` : ""}
      </div>
    </div>

    <!-- Body -->
    <div class="label-body">

      <!-- QR + Tracking -->
      <div class="qr-section">
        <img src="${qr}" alt="QR Code" width="110" height="110"/>
        <div class="tracking-block">
          <div class="tracking-label">Code de suivi</div>
          <div class="tracking-code">${esc(parcel.trackingCode)}</div>
          <div class="tracking-url">hophop.ca/track/${esc(parcel.trackingCode)}</div>
          ${parcel.shipment ? `<div class="departure">Réf. envoi : <strong>${esc(parcel.shipment.reference)}</strong></div>` : ""}
        </div>
      </div>

      <!-- Sender & Recipient -->
      <div class="parties">
        <div class="party-block">
          <div class="party-role">Expéditeur</div>
          <div class="party-name">${esc(parcel.client.firstName)} ${esc(parcel.client.lastName)}</div>
        </div>
        <div class="party-block recipient">
          <div class="party-role">Destinataire</div>
          <div class="party-name">${esc(parcel.recipient.firstName)} ${esc(parcel.recipient.lastName)}</div>
          <div class="party-detail">${esc(parcel.recipient.city)}${parcel.recipient.city ? ", " : ""}${esc(COUNTRY_LABELS[parcel.recipient.country] ?? parcel.recipient.country)}</div>
          ${parcel.recipient.phone ? `<div class="party-phone">${esc(parcel.recipient.phone)}</div>` : ""}
        </div>
      </div>

      <!-- Description -->
      ${parcel.description ? `
      <div class="description-block">
        <strong>Contenu</strong>
        ${esc(parcel.description)}
      </div>` : ""}

    </div>

    <div class="label-footer">
      Étiquette générée par hophop.ca · ${new Date().toLocaleDateString("fr-FR")}
    </div>

  </div>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
