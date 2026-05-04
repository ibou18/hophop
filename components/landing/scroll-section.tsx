"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

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

const FEATURES = [
  {
    icon: Package,
    title: "Déclarez en quelques clics",
    body: "Saisissez le contenu, le poids et le destinataire. Un code de suivi est généré instantanément.",
    color: "#e8820c",
    bg: "rgba(232,130,12,0.08)",
  },
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    body: "Chaque étape — collecte, transit, arrivée — est visible pour vous et votre destinataire sans connexion.",
    color: "#c13b1b",
    bg: "rgba(193,59,27,0.08)",
  },
  {
    icon: Truck,
    title: "Rejoignez un envoi groupé",
    body: "Associez votre colis à un envoi existant et réduisez les délais et coûts d'expédition.",
    color: "#8b4513",
    bg: "rgba(139,69,19,0.08)",
  },
  {
    icon: Users,
    title: "Multi-transitaires",
    body: "Travaillez avec plusieurs transitaires depuis un seul compte client unifié.",
    color: "#4a7c59",
    bg: "rgba(74,124,89,0.08)",
  },
  {
    icon: FileText,
    title: "Étiquettes PDF",
    body: "Générez des étiquettes avec QR code directement depuis l'interface. Aucun outil externe.",
    color: "#e8820c",
    bg: "rgba(232,130,12,0.08)",
  },
  {
    icon: ShieldCheck,
    title: "Accès sécurisé",
    body: "Chaque colis est accessible uniquement aux personnes autorisées. Connexion email ou Google.",
    color: "#4a7c59",
    bg: "rgba(74,124,89,0.08)",
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

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggeredGrid({ children }: { children: React.ReactNode[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            delay: i * 0.08,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export function ScrollSections() {
  return (
    <>
      {/* ── Stats ── */}
      <div className="border-y border-hh-sand-dk bg-white">
        <div className="mx-auto max-w-5xl px-5">
          <StaggeredGrid>
            {[
              {
                value: "100%",
                label: "Suivi transparent",
                sub: "De la collecte à la livraison",
              },
              {
                value: "6+",
                label: "Pays couverts",
                sub: "CA · FR · GN · SN · CI · CM",
              },
              {
                value: "24/7",
                label: "Accès au statut",
                sub: "Sans connexion requise",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 border-r border-hh-sand-dk px-6 py-8 last:border-0"
              >
                <span className="text-3xl font-semibold text-hh-saffron-dk">
                  {s.value}
                </span>
                <span className="text-sm font-medium text-hh-nuit">
                  {s.label}
                </span>
                <span className="text-xs text-hh-muted">{s.sub}</span>
              </div>
            ))}
          </StaggeredGrid>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="mb-14 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron">
              Fonctionnalités
            </p>
            <h2 className="text-3xl font-semibold text-hh-nuit sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-3 text-sm text-hh-muted">
              Une plateforme pensée pour les transitaires et leurs clients.
            </p>
          </AnimatedSection>

          <StaggeredGrid>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-hh-sand-dk/60 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: f.bg }}
                  >
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-hh-nuit">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-hh-muted">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </StaggeredGrid>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-hh-nuit px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="mb-14 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron">
              Comment ça marche
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Trois étapes simples
            </h2>
          </AnimatedSection>

          <StaggeredGrid>
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex flex-col gap-4">
                {i < 2 && (
                  <div
                    aria-hidden
                    className="absolute right-0 top-5 hidden h-px w-1/2 border-t border-dashed border-white/15 sm:block"
                  />
                )}
                <span className="text-4xl font-bold text-hh-saffron/25">
                  {s.n}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/45">
                  {s.body}
                </p>
              </div>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-24">
        <AnimatedSection className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-hh-nuit px-8 py-14 text-center shadow-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(232,130,12,0.2) 0%, transparent 70%)",
              }}
            />
            <p className="relative mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron">
              Commencez maintenant
            </p>
            <h2 className="relative text-3xl font-semibold text-white sm:text-4xl">
              Prêt à expédier ?
            </h2>
            <p className="relative mt-3 text-sm text-white/50">
              Rejoignez Hophop gratuitement. Aucune carte bancaire requise.
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-hh-saffron px-8 text-sm font-medium text-white shadow-lg shadow-hh-saffron/20 transition-all hover:bg-hh-saffron/90 sm:w-auto"
              >
                Créer un compte
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
