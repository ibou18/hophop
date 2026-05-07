"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

interface Props {
  code5: string;
  forwarderName: string;
  city: string;
  country: string;
  /** URL canonique côté client (récupérée à l'usage) */
  fallbackUrl?: string;
}

/**
 * Icônes SVG inline (pas de pack lucide pour ces marques) — plus net qu'un emoji
 */
function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 0 11.92C.003 5.339 5.335.006 11.893.006a11.821 11.821 0 0 1 8.413 3.486 11.81 11.81 0 0 1 3.48 8.414c-.003 6.582-5.335 11.915-11.893 11.915a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807a9.86 9.86 0 0 0 5.029 1.378h.004c5.448 0 9.886-4.434 9.889-9.885a9.873 9.873 0 0 0-2.892-6.99 9.823 9.823 0 0 0-6.991-2.898c-5.45 0-9.887 4.434-9.89 9.884a9.866 9.866 0 0 0 1.51 5.26l.235.374-1 3.654 3.752-.984.354.207zm5.034-3.07c-.515 0-1.213-.187-2.025-.6-1.193-.594-1.97-1.227-2.748-2.293-.396-.546-.715-1.179-.95-1.86a1.4 1.4 0 0 1 .314-1.484c.183-.18.39-.327.617-.434.189-.087.37-.07.522.05.18.144.605.736.66.86.07.16.11.347.022.518-.087.171-.131.276-.262.422a3.21 3.21 0 0 1-.214.213c-.08.073-.165.14-.087.298.078.16.347.611.745 1.025.508.527 1.014.789 1.302.928.296.144.467.124.642-.075.176-.198.737-.86.927-1.155.19-.296.378-.247.638-.149.262.099 1.66.783 1.945.926.286.144.476.214.546.333.07.119.07.687-.165 1.355-.235.668-1.358 1.279-1.91 1.36-.553.082-.815.235-1.41.149h.001z"
      />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function TwitterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function MessengerIcon({ className = "" }: { className?: string }) {
  // Telegram comme alternative (très utilisé en Afrique)
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
      />
    </svg>
  );
}

export function ForwarderShareButtons({
  code5,
  forwarderName,
  city,
  country,
  fallbackUrl,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  function getUrl(): string {
    if (typeof window !== "undefined") return window.location.href;
    return fallbackUrl ?? `https://hophop.app/p/${code5}`;
  }

  const message = `Suivez vos colis avec ${forwarderName} (${city}, ${country}) sur Hophop. Code transitaire ${code5}.`;

  function handleNativeShare() {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      navigator
        .share({
          title: `${forwarderName} — Hophop`,
          text: message,
          url: getUrl(),
        })
        .then(() => {
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        })
        .catch(() => {
          // l'utilisateur a annulé
        });
    } else {
      handleCopy();
    }
  }

  function handleCopy() {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(getUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const url = encodeURIComponent(getUrl());
  const text = encodeURIComponent(message);

  const links = [
    {
      key: "wa",
      href: `https://wa.me/?text=${text}%20${url}`,
      label: "WhatsApp",
      Icon: WhatsAppIcon,
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/10",
      ring: "ring-[#25D366]/30",
      hover: "hover:bg-[#25D366]/15",
    },
    {
      key: "tg",
      href: `https://t.me/share/url?url=${url}&text=${text}`,
      label: "Telegram",
      Icon: MessengerIcon,
      color: "text-[#229ED9]",
      bg: "bg-[#229ED9]/10",
      ring: "ring-[#229ED9]/30",
      hover: "hover:bg-[#229ED9]/15",
    },
    {
      key: "fb",
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      label: "Facebook",
      Icon: FacebookIcon,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10",
      ring: "ring-[#1877F2]/30",
      hover: "hover:bg-[#1877F2]/15",
    },
    {
      key: "x",
      href: `https://x.com/intent/tweet?url=${url}&text=${text}`,
      label: "X",
      Icon: TwitterIcon,
      color: "text-hh-nuit",
      bg: "bg-hh-sand",
      ring: "ring-hh-sand-dk",
      hover: "hover:bg-hh-sand-dk/40",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => {
          const Icon = l.Icon;
          return (
            <a
              key={l.key}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium ring-1 transition ${l.bg} ${l.color} ${l.ring} ${l.hover}`}
              aria-label={`Partager sur ${l.label}`}
            >
              <Icon className="size-4" />
              {l.label}
            </a>
          );
        })}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-hh-sand-dk bg-white px-3.5 py-2 text-[13px] font-medium text-hh-earth-dk transition hover:border-hh-saffron/40 hover:bg-hh-saffron-lt"
          aria-label="Copier le lien"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "Copié !" : "Copier le lien"}
        </button>

        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 rounded-full border border-hh-sand-dk bg-white px-3.5 py-2 text-[13px] font-medium text-hh-earth-dk transition hover:border-hh-saffron/40 hover:bg-hh-saffron-lt sm:hidden"
          aria-label="Partager"
        >
          <Share2 className="size-4" />
          {shared ? "Partagé !" : "Partager"}
        </button>
      </div>
    </div>
  );
}
