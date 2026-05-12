"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";

export function AdminShipmentShareButtons({
  publicUrl,
  reference,
}: {
  publicUrl: string;
  reference: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const waText = `📦 Envoi *${reference}* disponible sur Hophop :\n${publicUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ background: "#25D366" }}
      >
        <MessageCircle size={15} strokeWidth={2} />
        WhatsApp
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        {copied ? (
          <>
            <Check size={15} className="text-emerald-500" />
            <span className="text-emerald-600">Copié !</span>
          </>
        ) : (
          <>
            <Copy size={15} />
            Copier le lien
          </>
        )}
      </button>

      {/* Open public page */}
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <ExternalLink size={15} />
        Page publique
      </a>
    </div>
  );
}
