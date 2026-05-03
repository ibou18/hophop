import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";
import { requireForwarderOrClient } from "@/lib/require-auth";

type Ctx = { params: Promise<{ id: string }> };

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireForwarderOrClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const parcel = await prisma.parcel.findFirst({
    where:
      auth.role === "FORWARDER"
        ? { id, client: { forwarderId: auth.forwarderId } }
        : { id, clientId: auth.clientId },
    include: {
      recipient: true,
      client: true,
    },
  });
  if (!parcel) return jsonError("Introuvable", 404);
  const fwd = await prisma.forwarder.findUnique({
    where: { id: parcel.client.forwarderId },
    select: { name: true, code5: true },
  });
  const qr = await QRCode.toDataURL(parcel.trackingCode, { width: 200, margin: 1 });
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><title>Étiquette ${esc(parcel.trackingCode)}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;max-width:480px;margin:0 auto;}
.row{margin:8px 0;} .muted{color:#555;font-size:14px;}
img.qr{display:block;margin:16px auto;}
hr{border:0;border-top:1px solid #ccc;margin:16px 0;}
</style></head><body>
<h1>Colis ${esc(parcel.trackingCode)}</h1>
<p class="muted">${esc(fwd?.name ?? "")} — code ${esc(fwd?.code5 ?? "")}</p>
<img class="qr" src="${qr}" alt="QR" width="200" height="200"/>
<p><strong>Code:</strong> ${esc(parcel.trackingCode)}</p>
<hr/>
<div class="row"><strong>Expéditeur</strong><br/>${esc(parcel.client.firstName)} ${esc(parcel.client.lastName)}</div>
<div class="row"><strong>Destinataire</strong><br/>${esc(parcel.recipient.firstName)} ${esc(parcel.recipient.lastName)}<br/>
${esc(parcel.recipient.phone)} — ${esc(parcel.recipient.city)}, ${esc(parcel.recipient.country)}</div>
${parcel.description ? `<div class="row"><strong>Description</strong><br/>${esc(parcel.description)}</div>` : ""}
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
