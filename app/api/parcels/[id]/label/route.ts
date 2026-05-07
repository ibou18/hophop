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

  // QR miniature pour les coins (taille réduite)
  const qrSmall = await QRCode.toDataURL(parcel.trackingCode, {
    width: 100,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrMain = await QRCode.toDataURL(parcel.trackingCode, {
    width: 260,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

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
      background: #e8e8e8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 40px;
      gap: 16px;
      color: #111;
    }

    /* ── Bouton impression ─────────────────────── */
    .print-bar {
      width: 100%;
      max-width: 560px;
      display: flex;
      justify-content: flex-end;
    }
    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #111;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.2px;
    }
    .btn-print:hover { background: #333; }

    /* ── Carte étiquette ───────────────────────── */
    .label {
      width: 100%;
      max-width: 560px;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.12);
      overflow: hidden;
      position: relative;
    }

    /* ── QR codes aux coins ────────────────────── */
    /*
     * Disposition : 4 petits QR dans les coins.
     * Le contenu principal est en zone centrale.
     * Si le document est plié en 2 (h ou v) ou en 4,
     * au moins un QR reste visible.
     */
    .corner-qr {
      position: absolute;
      width: 72px;
      height: 72px;
      padding: 3px;
      background: #fff;
    }
    .corner-qr img { width: 100%; height: 100%; display: block; }
    .corner-tl { top: 10px;    left: 10px;  }
    .corner-tr { top: 10px;    right: 10px; }
    .corner-bl { bottom: 10px; left: 10px;  }
    .corner-br { bottom: 10px; right: 10px; }

    /* ── En-tête ───────────────────────────────── */
    .label-header {
      border-bottom: 2px solid #111;
      padding: 14px 96px 12px; /* marges lat pour ne pas chevaucher les QR */
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #fff;
    }
    .brand {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #111;
      text-transform: lowercase;
    }
    .fwd-name {
      font-size: 13px;
      font-weight: 700;
      color: #111;
      text-align: right;
    }
    .fwd-code {
      font-size: 11px;
      color: #888;
      font-family: 'Courier New', monospace;
      margin-top: 2px;
      text-align: right;
    }

    /* ── Route ─────────────────────────────────── */
    .route {
      border-bottom: 1px solid #ddd;
      padding: 12px 96px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f7f7f7;
    }
    .route-point { flex: 1; min-width: 0; }
    .route-lbl {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #999;
      margin-bottom: 3px;
    }
    .route-place {
      font-size: 14px;
      font-weight: 800;
      color: #111;
      line-height: 1.2;
    }
    .route-meta {
      font-size: 11px;
      color: #777;
      margin-top: 3px;
    }
    .route-arrow {
      flex-shrink: 0;
      font-size: 18px;
      color: #bbb;
      padding: 0 8px;
      font-weight: 300;
    }

    /* ── Corps ─────────────────────────────────── */
    .label-body {
      padding: 18px 20px;
    }

    /* Tracking + QR central */
    .tracking-section {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-bottom: 16px;
      border-bottom: 1px dashed #ccc;
      margin-bottom: 16px;
    }
    .qr-main { flex-shrink: 0; }
    .qr-main img {
      width: 120px;
      height: 120px;
      display: block;
      border: 1px solid #e0e0e0;
    }
    .tracking-info { flex: 1; min-width: 0; }
    .tracking-lbl {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #999;
      margin-bottom: 6px;
    }
    .tracking-code {
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #111;
      letter-spacing: 1px;
      line-height: 1;
    }
    .tracking-url {
      font-size: 11px;
      color: #aaa;
      margin-top: 7px;
      font-family: 'Courier New', monospace;
    }
    .shipment-ref {
      margin-top: 8px;
      font-size: 11px;
      color: #666;
    }
    .shipment-ref strong { font-weight: 700; color: #333; }

    /* Expéditeur / Destinataire */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .party-block {
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
    }
    .party-block.recipient {
      border: 1.5px solid #111;
      background: #fff;
    }
    .party-role {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #999;
      margin-bottom: 5px;
    }
    .party-block.recipient .party-role { color: #555; }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #111;
    }
    .party-detail {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
      line-height: 1.4;
    }
    .party-phone {
      font-size: 12px;
      font-weight: 700;
      color: #111;
      margin-top: 4px;
      font-family: 'Courier New', monospace;
    }

    /* Description */
    .desc-block {
      padding: 9px 11px;
      border: 1px solid #e0e0e0;
      background: #f7f7f7;
      font-size: 12px;
      color: #444;
    }
    .desc-block .sec-lbl {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #999;
      display: block;
      margin-bottom: 3px;
    }

    /* ── Pied de page ──────────────────────────── */
    .label-footer {
      border-top: 1px solid #e0e0e0;
      padding: 78px 96px 10px; /* hauteur pour les QR coins bas */
      font-size: 9px;
      color: #bbb;
      text-align: center;
      background: #fff;
    }

    /* ── Impression ────────────────────────────── */
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

    @page { margin: 8mm; size: A5 portrait; }
  </style>
</head>
<body>

  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">
      🖨&nbsp; Imprimer l'étiquette
    </button>
  </div>

  <div class="label">

    <!-- ── QR coins ── -->
    <div class="corner-qr corner-tl"><img src="${qrSmall}" alt=""/></div>
    <div class="corner-qr corner-tr"><img src="${qrSmall}" alt=""/></div>
    <div class="corner-qr corner-bl"><img src="${qrSmall}" alt=""/></div>
    <div class="corner-qr corner-br"><img src="${qrSmall}" alt=""/></div>

    <!-- ── En-tête ── -->
    <div class="label-header">
      <span class="brand">hophop</span>
      <div>
        <div class="fwd-name">${esc(fwd?.name)}</div>
        <div class="fwd-code">Code ${esc(fwd?.code5)}</div>
      </div>
    </div>

    <!-- ── Route ── -->
    <div class="route">
      <div class="route-point">
        <div class="route-lbl">Départ</div>
        <div class="route-place">${originLine}</div>
        ${transportMode ? `<div class="route-meta">${esc(TRANSPORT_LABELS[transportMode] ?? transportMode)}</div>` : ""}
      </div>
      <div class="route-arrow">→</div>
      <div class="route-point" style="text-align:right">
        <div class="route-lbl">Arrivée</div>
        <div class="route-place">${destLine}</div>
        ${departureDate ? `<div class="route-meta">Départ le ${esc(departureDate)}</div>` : ""}
      </div>
    </div>

    <!-- ── Corps ── -->
    <div class="label-body">

      <!-- Tracking + QR central -->
      <div class="tracking-section">
        <div class="qr-main">
          <img src="${qrMain}" alt="QR Code" width="120" height="120"/>
        </div>
        <div class="tracking-info">
          <div class="tracking-lbl">Code de suivi</div>
          <div class="tracking-code">${esc(parcel.trackingCode)}</div>
          <div class="tracking-url">hophop.ca/track/${esc(parcel.trackingCode)}</div>
          ${parcel.shipment ? `<div class="shipment-ref">Réf. envoi : <strong>${esc(parcel.shipment.reference)}</strong></div>` : ""}
        </div>
      </div>

      <!-- Expéditeur / Destinataire -->
      <div class="parties">
        <div class="party-block">
          <div class="party-role">Expéditeur</div>
          <div class="party-name">${esc(parcel.client.firstName)} ${esc(parcel.client.lastName)}</div>
          ${parcel.client.phone ? `<div class="party-detail">${esc(parcel.client.phone)}</div>` : ""}
        </div>
        <div class="party-block recipient">
          <div class="party-role">Destinataire</div>
          <div class="party-name">${esc(parcel.recipient.firstName)} ${esc(parcel.recipient.lastName)}</div>
          <div class="party-detail">${esc(parcel.recipient.city)}${parcel.recipient.city ? ", " : ""}${esc(COUNTRY_LABELS[parcel.recipient.country] ?? parcel.recipient.country)}</div>
          ${parcel.recipient.phone ? `<div class="party-phone">${esc(parcel.recipient.phone)}</div>` : ""}
        </div>
      </div>

      <!-- Contenu / description -->
      ${parcel.description ? `
      <div class="desc-block">
        <span class="sec-lbl">Contenu</span>
        ${esc(parcel.description)}
      </div>` : ""}

    </div>

    <!-- ── Pied de page (espace pour QR bas) ── -->
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
