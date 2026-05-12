"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Link2 } from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { PublicShipmentData } from "@/app/envois/[id]/page";

const TRANSPORT_EMOJI: Record<string, string> = {
  AIR: "✈️", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};

function buildWhatsAppText(s: PublicShipmentData, url: string): string {
  const origin = countryLabelFr(s.originCountry);
  const dest = countryLabelFr(s.destinationCountry);
  const emoji = TRANSPORT_EMOJI[s.transportMode] ?? "📦";
  const dep = s.departureDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s.departureDate))
    : null;

  const lines = [
    `${emoji} *Envoi disponible — ${origin} → ${dest}*`,
    s.destinationCity ? `📍 Livraison à ${s.destinationCity}` : "",
    dep ? `📅 Départ prévu le ${dep}` : "",
    `🚚 Transitaire : ${s.forwarder.name}`,
    `🔖 Réf : ${s.reference}`,
    "",
    `👉 Voir l'envoi et déclarer un colis :`,
    url,
  ].filter((l) => l !== undefined);

  return lines.join("\n");
}

export function ShipmentShareButtons({
  publicUrl,
  shipment,
}: {
  publicUrl: string;
  shipment: PublicShipmentData;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const waText = buildWhatsAppText(shipment, publicUrl);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <p className="text-center text-[12px] font-semibold uppercase tracking-widest text-hh-muted">
        Partager cet envoi
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {/* WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          <MessageCircle size={18} strokeWidth={2} />
          Partager sur WhatsApp
        </a>

        {/* Copy link */}
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-2.5 rounded-2xl border border-hh-sand-dk/30 bg-white px-5 py-3 text-[14px] font-semibold text-hh-earth-dk shadow-sm transition-colors hover:bg-hh-sand/40"
        >
          {copied ? (
            <>
              <Check size={18} className="text-emerald-500" />
              <span className="text-emerald-600">Lien copié !</span>
            </>
          ) : (
            <>
              <Copy size={18} />
              Copier le lien
            </>
          )}
        </button>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 rounded-xl border border-hh-sand-dk/20 bg-white/70 px-4 py-2.5 backdrop-blur-sm">
        <Link2 size={14} className="shrink-0 text-hh-muted" />
        <span className="flex-1 truncate font-mono text-[12px] text-hh-muted">{publicUrl}</span>
      </div>
    </div>
  );
}
