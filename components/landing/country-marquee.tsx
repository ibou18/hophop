"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const COUNTRIES = [
  { flag: "🇬🇳", name: "Guinée" },
  { flag: "🇸🇳", name: "Sénégal" },
  { flag: "🇨🇮", name: "Côte d'Ivoire" },
  { flag: "🇨🇲", name: "Cameroun" },
  { flag: "🇲🇱", name: "Mali" },
  { flag: "🇬🇲", name: "Gambie" },
  { flag: "🇧🇫", name: "Burkina Faso" },
  { flag: "🇹🇬", name: "Togo" },
  { flag: "🇧🇪", name: "Belgique" },
  { flag: "🇨🇭", name: "Suisse" },
  { flag: "🇺🇸", name: "États-Unis" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇨🇦", name: "Canada" },
];

// On duplique la liste pour faire une boucle infinie sans saut visible
const LOOP = [...COUNTRIES, ...COUNTRIES];

export function CountryMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // On déplace la moitié de la track : comme la liste est doublée,
    // arriver à -50% donne un raccord parfait avec le début.
    const ctx = gsap.context(() => {
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    }, track);

    return () => ctx.revert();
  }, []);

  const onEnter = () => tweenRef.current?.timeScale(0.25);
  const onLeave = () => tweenRef.current?.timeScale(1);

  return (
    <div
      className="group relative overflow-hidden border-y border-hh-sand-dk/60 bg-gradient-to-r from-hh-sand via-white to-hh-sand py-5 max-w-6xl mx-auto"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label="Pays desservis par Hophop"
    >
      {/* Fades sur les bords */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-hh-sand to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-hh-sand to-transparent" />

      <div ref={trackRef} className="flex w-max gap-3 will-change-transform">
        {LOOP.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-hh-sand-dk/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm"
          >
            <span className="text-xl leading-none">{c.flag}</span>
            <span className="text-sm font-medium text-hh-earth-dk">
              {c.name}
            </span>
          </div>
        ))}
      </div>

      {/* Légende centrée optionnelle */}
      <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-widest text-hh-muted">
        Une plateforme · Un réseau · Plusieurs pays
      </p>
    </div>
  );
}
