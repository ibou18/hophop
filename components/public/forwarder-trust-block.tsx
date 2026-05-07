"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Bell, QrCode, Users } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface Props {
  forwarderName: string;
}

const FEATURES = [
  {
    icon: Bell,
    title: "Suivi en temps réel",
    body: "Statut mis à jour à chaque étape, partageable avec votre destinataire sans connexion.",
    bg: "bg-hh-saffron-lt",
    color: "text-hh-saffron",
  },
  {
    icon: QrCode,
    title: "Étiquettes & QR code",
    body: "Génération instantanée d'étiquettes avec code unique HOP-… pour scanner et identifier.",
    bg: "bg-hh-savane-lt",
    color: "text-hh-savane",
  },
  {
    icon: ShieldCheck,
    title: "Transitaire vérifié",
    body: "Identité, contact et localisation contrôlés à l'inscription. Compte actif sur Hophop.",
    bg: "bg-hh-earth-lt",
    color: "text-hh-earth",
  },
  {
    icon: Users,
    title: "Communauté Hophop",
    body: "Une plateforme partagée avec d'autres transitaires de confiance dans votre région.",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
];

export function ForwarderTrustBlock({ forwarderName }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const cards = rootRef.current!.querySelectorAll<HTMLElement>("[data-trust]");
      gsap.from(cards, {
        scrollTrigger: { trigger: rootRef.current, start: "top 80%", once: true },
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power3.out",
      });
      gsap.from(rootRef.current!.querySelectorAll<HTMLElement>("[data-trust-head]"), {
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
        y: 20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-t border-hh-sand-dk bg-white px-5 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p data-trust-head className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk">
            Pourquoi expédier avec ce transitaire ?
          </p>
          <h2 data-trust-head className="text-2xl font-semibold text-hh-nuit sm:text-3xl">
            {forwarderName} sur la plateforme Hophop
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                data-trust
                className="flex flex-col gap-3 rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-hh-saffron/30 hover:shadow-md"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
                  <Icon size={18} className={f.color} />
                </div>
                <h3 className="text-[15px] font-semibold text-hh-nuit">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-hh-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
