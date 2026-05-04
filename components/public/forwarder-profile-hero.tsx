"use client";

import { motion } from "motion/react";
import { MapPin, Phone, Mail } from "lucide-react";
import { ForwarderProfileCta } from "./forwarder-profile-cta";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Lien tel: explicite = même arbre SSR/client (évite l’auto-lien du navigateur). */
function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

interface Props {
  name: string;
  code5: string;
  city: string;
  country: string;
  phone: string | null;
  email: string;
  description: string | null;
  logoUrl: string | null;
  initials: string;
  statsShipments: number;
  statsUpcoming: number;
  isAuthenticated: boolean;
  isLinked: boolean;
}

export function ForwarderProfileHero({
  name, code5, city, country, phone, email, description,
  logoUrl, initials, statsShipments, statsUpcoming,
  isAuthenticated, isLinked,
}: Props) {
  return (
    <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex-shrink-0"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/10 sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-hh-saffron to-hh-earth text-2xl font-bold text-white ring-2 ring-white/10 sm:h-24 sm:w-24">
              {initials}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="flex flex-wrap items-center gap-2 mb-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-saffron/30 bg-hh-saffron/10 px-3 py-0.5 text-[11px] font-medium uppercase tracking-wider text-hh-saffron">
              Transitaire · Code {code5}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
            className="text-3xl font-semibold text-white sm:text-4xl"
          >
            {name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
            className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50"
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              {city}, {country}
            </span>
            {phone ? (
              <a
                href={telHref(phone)}
                className="flex items-center gap-1.5 underline-offset-2 hover:underline"
              >
                <Phone size={13} className="flex-shrink-0" />
                {phone}
              </a>
            ) : null}
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 underline-offset-2 hover:underline"
            >
              <Mail size={13} className="flex-shrink-0" />
              {email}
            </a>
          </motion.div>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: EASE }}
              className="mt-4 max-w-xl text-sm leading-relaxed text-white/60"
            >
              {description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44, ease: EASE }}
            className="mt-7"
          >
            <ForwarderProfileCta
              code5={code5}
              forwarderName={name}
              isAuthenticated={isAuthenticated}
              isLinked={isLinked}
            />
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
        className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8"
      >
        {[
          { value: statsShipments, label: "envois au total" },
          { value: statsUpcoming, label: "départs à venir" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.08, ease: EASE }}
            className="flex flex-col gap-0.5"
          >
            <span className="text-2xl font-semibold text-white">{s.value}</span>
            <span className="text-xs text-white/40">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
