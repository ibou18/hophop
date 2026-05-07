"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Plane, Heart, Ship } from "lucide-react";
import { gsap, SplitText } from "@/lib/gsap";
import { TrackingSearch } from "./tracking-search";

export function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pictosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // 1) Headline avec SplitText
      let split: SplitText | null = null;
      try {
        split = new SplitText(headlineRef.current!, {
          type: "words,chars",
          wordsClass: "inline-block overflow-hidden align-baseline",
          charsClass: "inline-block",
        });
      } catch {
        // fallback silencieux
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        sunRef.current,
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4, ease: "power2.out" },
        0,
      );
      tl.fromTo(
        badgeRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.1,
      );

      if (split?.chars?.length) {
        tl.from(
          split.chars,
          {
            yPercent: 110,
            opacity: 0,
            stagger: 0.018,
            duration: 0.7,
            ease: "power3.out",
          },
          0.25,
        );
      } else {
        tl.from(headlineRef.current, { y: 30, opacity: 0, duration: 0.8 }, 0.25);
      }

      tl.from(subRef.current, { y: 18, opacity: 0, duration: 0.7 }, 0.85);
      tl.from(trackerRef.current, { y: 18, opacity: 0, duration: 0.7 }, 1);
      tl.from(ctaRef.current, { y: 18, opacity: 0, duration: 0.7 }, 1.15);

      // Pulsation très douce du soleil
      gsap.to(sunRef.current, {
        scale: 1.05,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Vague qui se trace une fois (puis statique)
      if (pathRef.current) {
        gsap.fromTo(
          pathRef.current,
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: 2.4,
            delay: 0.4,
            ease: "power1.inOut",
          },
        );
      }

      // Apparition douce des pictos (statiques)
      if (pictosRef.current) {
        gsap.from(
          pictosRef.current.querySelectorAll<HTMLElement>("[data-picto]"),
          {
            opacity: 0,
            scale: 0.6,
            stagger: 0.2,
            duration: 0.6,
            delay: 1.4,
            ease: "back.out(2)",
          },
        );
      }

      return () => {
        split?.revert();
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden bg-gradient-to-b from-hh-sand via-white to-hh-sand pt-24 pb-12 sm:pt-32 sm:pb-20"
    >
      {/* Soleil chaleureux derrière le titre */}
      <div
        ref={sunRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full opacity-90 sm:top-32 sm:h-[520px] sm:w-[520px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.28) 0%, rgba(245,200,120,0.18) 35%, transparent 70%)",
        }}
      />

      {/* Texture sable très subtile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(122,63,4,0.07) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Vague discrète derrière le texte (pleine largeur, pas trop haute en mobile) */}
      <svg
        aria-hidden
        viewBox="0 0 1400 500"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 -z-[5] mx-auto h-full w-full"
      >
        <defs>
          <linearGradient id="hop-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8820c" stopOpacity="0" />
            <stop offset="20%" stopColor="#e8820c" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#c13b1b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c13b1b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d="M 0 280 C 280 160, 560 200, 840 270 S 1200 320, 1400 240"
          fill="none"
          stroke="url(#hop-wave)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      </svg>

      {/* Pictos avion + bateau (en HTML, repositionnables en responsive) */}
      <div
        ref={pictosRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[4]"
      >
        {/* Avion : visible mobile (plus petit, en bas) + desktop (centré-gauche au-dessus de la vague) */}
        <div
          data-picto
          className="absolute flex items-center justify-center rounded-full border border-hh-saffron/40 bg-white shadow-sm
                     left-[12%] bottom-6 h-9 w-9
                     sm:left-[22%] sm:top-[42%] sm:bottom-auto sm:h-12 sm:w-12"
        >
          <Plane
            size={18}
            className="-rotate-12 text-hh-saffron sm:size-5"
            strokeWidth={1.7}
          />
        </div>

        {/* Bateau : visible mobile (plus petit, en bas droite) + desktop (centré-droite) */}
        <div
          data-picto
          className="absolute flex items-center justify-center rounded-full border border-hh-kola/40 bg-white shadow-sm
                     right-[12%] bottom-6 h-9 w-9
                     sm:right-[22%] sm:top-[52%] sm:bottom-auto sm:h-12 sm:w-12"
          style={{ borderColor: "rgba(193, 59, 27, 0.4)" }}
        >
          <Ship
            size={18}
            className="text-[#c13b1b] sm:size-5"
            strokeWidth={1.7}
          />
        </div>
      </div>

      {/* Contenu central */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 text-center sm:gap-7">
        {/* Badge confiance */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 rounded-full border border-hh-saffron/30 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-hh-saffron-dk shadow-sm backdrop-blur-sm sm:px-4 sm:text-xs"
        >
          <Heart size={12} className="text-hh-saffron" fill="currentColor" />
          Construit pour la diaspora ouest-africaine
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-hh-nuit sm:text-6xl lg:text-7xl"
        >
          Vos colis, <span className="text-hh-saffron">en confiance</span>,
          <br className="hidden sm:block" /> jusqu&rsquo;à la maison.
        </h1>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="max-w-xl text-[15px] leading-relaxed text-hh-muted sm:text-lg"
        >
          Hophop relie transitaires et familles en Afrique et dans la diaspora.
          Suivez chaque étape, sans appeler, sans deviner.
        </p>

        {/* Tracking input */}
        <div ref={trackerRef} className="w-full max-w-lg">
          <TrackingSearch />
          <p className="mt-2.5 text-[11px] text-hh-muted/80 sm:text-xs">
            Entrez votre code de suivi — aucune connexion requise
          </p>
        </div>

        {/* CTAs (full-width sur mobile, en ligne dès sm) */}
        <div
          ref={ctaRef}
          className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center"
        >
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-hh-saffron px-6 text-sm font-medium text-white shadow-md shadow-hh-saffron/25 transition-all hover:-translate-y-0.5 hover:bg-hh-saffron/95 hover:shadow-lg hover:shadow-hh-saffron/30 sm:px-7"
          >
            Créer un compte gratuit
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-hh-sand-dk bg-white px-6 text-sm font-medium text-hh-earth-dk transition-all hover:border-hh-saffron/40 hover:bg-hh-saffron-lt sm:px-7"
          >
            <Plane size={14} className="text-hh-saffron" />
            Je suis transitaire
          </Link>
        </div>
      </div>
    </section>
  );
}
