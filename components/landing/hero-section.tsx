"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrackingSearch } from "./tracking-search";
import { FloatingParcels } from "./floating-parcels";

const HEADLINE_WORDS = [
  { text: "Vos colis,", highlight: false },
  { text: "tracés", highlight: true },
  { text: "à chaque", highlight: false },
  { text: "étape.", highlight: false },
];

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const word = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-hh-nuit px-5 py-24">
      {/* Dot grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Floating parcel cards */}
      <FloatingParcels />

      {/* Content */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-7 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-hh-saffron/25 bg-hh-saffron/10 px-4 py-1.5 text-xs font-medium text-hh-saffron"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hh-saffron opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-hh-saffron" />
          </span>
          Plateforme de suivi — CA · FR · GN · SN · CI · CM
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          {HEADLINE_WORDS.map((w, i) => (
            <motion.span
              key={i}
              variants={word}
              className={w.highlight ? "text-hh-saffron" : "text-white"}
            >
              {w.text}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.7 }}
          className="max-w-xl text-base leading-relaxed text-white/50 sm:text-lg"
        >
          Hophop connecte transitaires et clients pour un suivi transparent
          de chaque colis, de la collecte jusqu&rsquo;à la livraison finale.
        </motion.p>

        {/* Tracking input */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.9 }}
          className="w-full max-w-lg"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
            <TrackingSearch dark />
          </div>
          <p className="mt-2.5 text-xs text-white/30">
            Entrez votre code de suivi — aucune connexion requise
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 1.05 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-saffron px-7 text-sm font-medium text-white shadow-lg shadow-hh-saffron/20 transition-all hover:bg-hh-saffron/90 hover:shadow-hh-saffron/30"
          >
            Créer un compte gratuit
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-7 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Se connecter
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 pt-1.5"
        >
          <div className="h-1.5 w-0.5 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
