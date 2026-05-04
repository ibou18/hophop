"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";
import type { Country } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import { cn } from "@/lib/utils";

const btnClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--hh-radius-md)] border px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:pointer-events-none disabled:opacity-40";

export function ShipmentShareBlock({
  code5,
  shipmentId,
  reference,
  originCountry,
  destinationCountry,
  forwarderName,
  isPublished,
}: {
  code5: string;
  shipmentId: string;
  reference: string;
  originCountry: Country;
  destinationCountry: Country;
  forwarderName: string;
  isPublished: boolean;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const sharePath = `/p/${code5}?envoi=${encodeURIComponent(shipmentId)}`;
  const fullUrl = origin ? `${origin}${sharePath}` : sharePath;

  const buildShareText = useCallback(
    (absoluteUrl: string) => {
      const route = `${countryLabelFr(originCountry)} → ${countryLabelFr(destinationCountry)}`;
      return `Envoi ${reference} (${route}) avec ${forwarderName} — Déclarez vos colis sur Hophop :\n${absoluteUrl}`;
    },
    [originCountry, destinationCountry, reference, forwarderName],
  );

  const openWhatsApp = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}${sharePath}`;
    const text = encodeURIComponent(buildShareText(url));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [buildShareText, sharePath]);

  const openFacebook = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (!base) return;
    const u = encodeURIComponent(`${base}${sharePath}`);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [sharePath]);

  const copyLink = useCallback(async () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const toCopy = base ? `${base}${sharePath}` : sharePath;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [sharePath]);

  if (!isPublished) {
    return (
      <div className="rounded-[var(--hh-radius-md)] border border-dashed border-hh-sand-dk/40 bg-hh-sand/40 px-4 py-3 text-[13px] text-hh-muted">
        <span className="font-medium text-hh-earth-dk">Partage</span>
        <p className="mt-1">
          Publie cet envoi sur ta vitrine publique pour générer des liens WhatsApp et Facebook vers
          ta page Hophop (avec mise en avant de cet envoi).
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
        Partager cet envoi
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-hh-earth-dk">
        Invite des expéditeurs à rejoindre cet envoi : ils arrivent sur ta page publique avec cet
        envoi mis en avant pour déclarer un colis.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openWhatsApp}
          className={cn(
            btnClass,
            "border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/18",
          )}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={openFacebook}
          className={cn(
            btnClass,
            "border-[#1877F2]/35 bg-[#1877F2]/8 text-[#1877F2] hover:bg-[#1877F2]/14",
          )}
        >
          <Share2 className="size-4 shrink-0" aria-hidden />
          Facebook
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className={cn(
            btnClass,
            "border-hh-sand-dk/35 bg-hh-sand/50 text-hh-earth-dk hover:bg-hh-sand-dk/15",
          )}
        >
          <Link2 className="size-4 shrink-0" aria-hidden />
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
      </div>
      <p className="mt-3 font-mono text-[11px] text-hh-muted break-all">{fullUrl}</p>
    </section>
  );
}
