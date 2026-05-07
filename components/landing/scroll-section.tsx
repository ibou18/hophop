"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Package,
  MapPin,
  Truck,
  Users,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const FEATURES = [
  {
    icon: Package,
    title: "Déclarez en quelques clics",
    body: "Saisissez le contenu, le poids et le destinataire. Un code de suivi est généré instantanément.",
    color: "#e8820c",
    bg: "rgba(232,130,12,0.10)",
  },
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    body: "Chaque étape — collecte, transit, arrivée — est visible pour vous et votre destinataire sans connexion.",
    color: "#c13b1b",
    bg: "rgba(193,59,27,0.10)",
  },
  {
    icon: Truck,
    title: "Rejoignez un envoi groupé",
    body: "Associez votre colis à un envoi existant et réduisez les délais et coûts d'expédition.",
    color: "#8b4513",
    bg: "rgba(139,69,19,0.10)",
  },
  {
    icon: Users,
    title: "Multi-transitaires",
    body: "Travaillez avec plusieurs transitaires depuis un seul compte client unifié.",
    color: "#4a7c59",
    bg: "rgba(74,124,89,0.10)",
  },
  {
    icon: FileText,
    title: "Étiquettes PDF",
    body: "Générez des étiquettes avec QR code directement depuis l'interface. Aucun outil externe.",
    color: "#e8820c",
    bg: "rgba(232,130,12,0.10)",
  },
  {
    icon: ShieldCheck,
    title: "Accès sécurisé",
    body: "Chaque colis est accessible uniquement aux personnes autorisées. Connexion email ou Google.",
    color: "#4a7c59",
    bg: "rgba(74,124,89,0.10)",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Inscrivez-vous",
    body: "Créez votre compte et liez-le à votre transitaire via son code à 5 chiffres.",
  },
  {
    n: "02",
    title: "Déclarez votre colis",
    body: "Renseignez le contenu, le poids et le destinataire. Un code de suivi est généré.",
  },
  {
    n: "03",
    title: "Suivez l'expédition",
    body: "Recevez les mises à jour à chaque étape jusqu'à la livraison finale.",
  },
];

const STATS = [
  {
    value: 100,
    suffix: "%",
    label: "Suivi transparent",
    sub: "De la collecte à la livraison",
  },
  {
    value: 8,
    suffix: "+",
    label: "Pays couverts",
    sub: "GN · SN · CI · CM · ML · GM · FR · CA",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Accès au statut",
    sub: "Sans connexion requise",
  },
];

/** Compteur GSAP qui s'anime à l'arrivée en viewport */
function StatsBlock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const numbers = ref.current!.querySelectorAll<HTMLSpanElement>(
        "[data-counter]"
      );

      ScrollTrigger.batch(numbers, {
        start: "top 85%",
        once: true,
        onEnter: (els) => {
          els.forEach((rawEl) => {
            const el = rawEl as HTMLElement;
            const target = Number(el.dataset.counter ?? "0");
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.val));
              },
            });
          });
        },
      });

      gsap.from(ref.current!.querySelectorAll<HTMLElement>("[data-stat]"), {
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="border-y border-hh-sand-dk bg-white"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 px-5 sm:grid-cols-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            data-stat
            className={`flex flex-col gap-1 px-6 py-10 ${
              i < STATS.length - 1
                ? "border-b border-hh-sand-dk sm:border-b-0 sm:border-r"
                : ""
            }`}
          >
            <span className="text-4xl font-semibold text-hh-saffron-dk sm:text-5xl">
              <span data-counter={s.value}>0</span>
              <span className="text-hh-saffron">{s.suffix}</span>
            </span>
            <span className="mt-2 text-sm font-semibold text-hh-nuit">
              {s.label}
            </span>
            <span className="text-xs text-hh-muted">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesBlock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll<HTMLElement>("[data-fade]"), {
        scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
        y: 24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(
        ref.current!.querySelectorAll<HTMLElement>("[data-feature-card]"),
        {
          scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
          y: 36,
          opacity: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: "power3.out",
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-hh-sand px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p
            data-fade
            className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk"
          >
            Fonctionnalités
          </p>
          <h2
            data-fade
            className="text-3xl font-semibold text-hh-nuit sm:text-4xl"
          >
            Tout ce dont vous avez besoin
          </h2>
          <p data-fade className="mt-3 text-sm text-hh-muted">
            Une plateforme pensée pour les transitaires et leurs clients.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                data-feature-card
                className="group rounded-2xl border border-hh-sand-dk bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-hh-saffron/30 hover:shadow-lg hover:shadow-hh-saffron/10"
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: f.bg }}
                >
                  <Icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold text-hh-nuit">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-hh-muted">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksBlock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll<HTMLElement>("[data-fade]"), {
        scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
        y: 24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(ref.current!.querySelectorAll<HTMLElement>("[data-step]"), {
        scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });

      // Trait pointillé qui se trace entre les étapes
      const line = ref.current!.querySelector<SVGPathElement>(
        "[data-step-line]"
      );
      if (line) {
        gsap.fromTo(
          line,
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: 2,
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 60%",
              once: true,
            },
          }
        );
      }
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-white px-5 py-24">
      {/* Soleil en fond */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 h-72 w-72 -translate-y-1/2 translate-x-1/3 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p
            data-fade
            className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk"
          >
            Comment ça marche
          </p>
          <h2
            data-fade
            className="text-3xl font-semibold text-hh-nuit sm:text-4xl"
          >
            Trois étapes simples
          </h2>
        </div>

        {/* Trait décoratif desktop */}
        <svg
          aria-hidden
          viewBox="0 0 1000 20"
          className="pointer-events-none absolute left-0 right-0 top-[210px] mx-auto hidden h-5 w-full max-w-3xl md:block"
          preserveAspectRatio="none"
        >
          <path
            data-step-line
            d="M 50 10 L 950 10"
            fill="none"
            stroke="#e8820c"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeOpacity="0.4"
          />
        </svg>

        <div className="relative grid gap-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              data-step
              className="relative flex flex-col items-center gap-3 text-center md:items-start md:text-left"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hh-saffron-lt ring-4 ring-white">
                <span className="text-xl font-bold text-hh-saffron-dk">
                  {s.n}
                </span>
              </div>
              <h3 className="text-base font-semibold text-hh-nuit">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-hh-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** CTA final — seule section sombre, parallax doux sur le décor */
function FinalCTABlock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const card = ref.current!.querySelector<HTMLElement>("[data-cta-card]");
      const sun = ref.current!.querySelector<HTMLElement>("[data-cta-sun]");
      const dots = ref.current!.querySelector<HTMLElement>("[data-cta-dots]");

      if (card) {
        gsap.from(card, {
          scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
          y: 60,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
        });
      }

      // Parallax doux : le soleil et le pattern bougent au scroll
      if (sun) {
        gsap.to(sun, {
          y: -60,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }
      if (dots) {
        gsap.to(dots, {
          y: 30,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      }
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="bg-hh-sand px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div
          data-cta-card
          className="relative overflow-hidden rounded-3xl bg-hh-nuit px-8 py-16 text-center shadow-2xl"
        >
          {/* Pattern parallax */}
          <div
            data-cta-dots
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Soleil parallax */}
          <div
            data-cta-sun
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,130,12,0.35) 0%, transparent 70%)",
            }}
          />

          <p className="relative mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron">
            Commencez maintenant
          </p>
          <h2 className="relative text-3xl font-semibold text-white sm:text-4xl">
            Prêt à expédier vers chez vous&nbsp;?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-white/65">
            Rejoignez Hophop gratuitement. Aucune carte bancaire requise. Vos
            premiers colis suivis en moins de cinq minutes.
          </p>
          <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-hh-saffron px-8 text-sm font-medium text-white shadow-lg shadow-hh-saffron/30 transition-all hover:-translate-y-0.5 hover:bg-hh-saffron/90 sm:w-auto"
            >
              Créer un compte
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScrollSections() {
  return (
    <>
      <StatsBlock />
      <FeaturesBlock />
      <HowItWorksBlock />
      <FinalCTABlock />
    </>
  );
}
