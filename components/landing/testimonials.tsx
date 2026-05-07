"use client";

import { useEffect, useRef } from "react";
import { Quote, Star } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Testimonial = {
  initials: string;
  name: string;
  role: string;
  city: string;
  flag: string;
  quote: string;
  bg: string;
  ring: string;
  text: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    initials: "MC",
    name: "Mariama Camara",
    role: "Cliente",
    city: "Conakry",
    flag: "🇬🇳",
    quote:
      "Avant je devais appeler trois fois par semaine pour savoir où était le carton de ma mère. Maintenant je regarde mon téléphone, c'est tout.",
    bg: "bg-hh-saffron-lt",
    ring: "ring-hh-saffron/30",
    text: "text-hh-saffron-dk",
  },
  {
    initials: "OD",
    name: "Ousmane Diallo",
    role: "Transitaire partenaire",
    city: "Dakar",
    flag: "🇸🇳",
    quote:
      "Mes clients voient le statut, j'ai moins de coups de fil. Hophop me fait gagner deux heures par jour, je peux me concentrer sur les départs.",
    bg: "bg-hh-savane-lt",
    ring: "ring-hh-savane/30",
    text: "text-hh-savane-dk",
  },
  {
    initials: "AT",
    name: "Aïcha Touré",
    role: "Cliente",
    city: "Abidjan ↔ Montréal",
    flag: "🇨🇮",
    quote:
      "J'envoie chaque mois à ma famille. Le QR code sur l'étiquette, le suivi partagé avec mon frère à Yopougon — c'est exactement ce qu'il me fallait.",
    bg: "bg-hh-earth-lt",
    ring: "ring-hh-earth/30",
    text: "text-hh-earth-dk",
  },
];

export function Testimonials() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const cards = rootRef.current!.querySelectorAll<HTMLElement>(
        "[data-testimonial]"
      );
      gsap.from(cards, {
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 75%",
          once: true,
        },
        immediateRender: false,
        y: 50,
        opacity: 0,
        rotation: -2,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(rootRef.current!.querySelectorAll<HTMLElement>("[data-fade]"), {
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 85%",
          once: true,
        },
        immediateRender: false,
        y: 24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-gradient-to-b from-white to-hh-sand px-5 py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p
            data-fade
            className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk"
          >
            Ils nous font confiance
          </p>
          <h2
            data-fade
            className="text-3xl font-semibold text-hh-nuit sm:text-4xl"
          >
            Des familles, des transitaires,
            <br className="hidden sm:block" />
            <span className="text-hh-saffron"> une même certitude.</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              data-testimonial
              className="group relative flex flex-col gap-4 rounded-2xl border border-hh-sand-dk bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-hh-saffron/10"
            >
              <Quote
                size={28}
                className="absolute right-5 top-5 text-hh-saffron/15"
                strokeWidth={1.5}
              />

              {/* Étoiles */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className="fill-hh-saffron text-hh-saffron"
                  />
                ))}
              </div>

              {/* Citation */}
              <blockquote className="text-[14.5px] leading-relaxed text-hh-earth-dk">
                « {t.quote} »
              </blockquote>

              {/* Auteur */}
              <figcaption className="mt-auto flex items-center gap-3 border-t border-hh-sand-dk pt-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ${t.bg} ${t.ring}`}
                >
                  <span className={`text-sm font-semibold ${t.text}`}>
                    {t.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-hh-nuit">
                    {t.name}
                  </p>
                  <p className="flex items-center gap-1 text-[12px] text-hh-muted">
                    <span>{t.flag}</span>
                    <span className="truncate">
                      {t.role} · {t.city}
                    </span>
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
