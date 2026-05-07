"use client";

import { useEffect, useRef } from "react";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Plane,
  Package,
  Globe2,
} from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ForwarderProfileCta } from "./forwarder-profile-cta";

const FLAG: Record<string, string> = {
  BE: "🇧🇪",
  BF: "🇧🇫",
  CA: "🇨🇦",
  CH: "🇨🇭",
  CI: "🇨🇮",
  CM: "🇨🇲",
  FR: "🇫🇷",
  GM: "🇬🇲",
  GN: "🇬🇳",
  ML: "🇲🇱",
  NG: "🇳🇬",
  SN: "🇸🇳",
  TG: "🇹🇬",
  US: "🇺🇸",
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

interface RouteItem {
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  destinationCity: string | null;
}

interface Props {
  name: string;
  code5: string;
  city: string;
  country: string;
  countryCode: string;
  phone: string | null;
  email: string;
  description: string | null;
  logoUrl: string | null;
  initials: string;
  statsShipments: number;
  statsUpcoming: number;
  routesCount: number;
  routes: RouteItem[];
  isAuthenticated: boolean;
  isLinked: boolean;
  memberSince: Date;
}

export function ForwarderProfileHero({
  name,
  code5,
  city,
  country,
  countryCode,
  phone,
  email,
  description,
  logoUrl,
  initials,
  statsShipments,
  statsUpcoming,
  routesCount,
  routes,
  isAuthenticated,
  isLinked,
  memberSince,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-h-anim='avatar']", {
        opacity: 0,
        scale: 0.8,
        duration: 0.7,
        ease: "back.out(1.7)",
      });
      tl.from(
        "[data-h-anim='badge']",
        { opacity: 0, y: -10, duration: 0.5 },
        0.15,
      );
      tl.from(
        "[data-h-anim='title']",
        { opacity: 0, y: 20, duration: 0.7 },
        0.25,
      );
      tl.from(
        "[data-h-anim='meta']",
        { opacity: 0, y: 16, duration: 0.6 },
        0.4,
      );
      tl.from(
        "[data-h-anim='desc']",
        { opacity: 0, y: 12, duration: 0.6 },
        0.55,
      );
      tl.from(
        "[data-h-anim='cta']",
        { opacity: 0, y: 16, duration: 0.6 },
        0.65,
      );
      tl.from(
        "[data-h-anim='route']",
        { opacity: 0, x: -16, stagger: 0.06, duration: 0.5 },
        0.75,
      );

      // Counter sur les stats
      const numbers =
        rootRef.current!.querySelectorAll<HTMLSpanElement>("[data-counter]");
      ScrollTrigger.batch(numbers, {
        start: "top 90%",
        once: true,
        onEnter: (els) => {
          els.forEach((rawEl) => {
            const el = rawEl as HTMLElement;
            const target = Number(el.dataset.counter ?? "0");
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.val));
              },
            });
          });
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const since = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(memberSince);

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden bg-gradient-to-b from-hh-sand via-white to-hh-sand"
    >
      {/* Soleil */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-100px] top-[-100px] h-[480px] w-[480px] rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(circle, rgba(232,130,12,0.22) 0%, rgba(245,200,120,0.14) 35%, transparent 70%)",
        }}
      />
      {/* Texture sable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(122,63,4,0.06) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-8">
          {/* Avatar */}
          <div data-h-anim="avatar" className="flex-shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={name}
                className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white shadow-lg sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-hh-saffron to-hh-earth text-2xl font-bold text-white ring-4 ring-white shadow-lg sm:h-28 sm:w-28">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Badge vérifié */}
            <div
              data-h-anim="badge"
              className="mb-3 flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-saffron/30 bg-hh-saffron-lt px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-hh-saffron-dk">
                <ShieldCheck size={12} />
                Transitaire vérifié
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-sand-dk bg-white px-3 py-1 text-[11px] font-medium text-hh-muted">
                Code {code5}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-sand-dk bg-white px-3 py-1 text-[11px] font-medium text-hh-muted">
                Membre depuis {since}
              </span>
            </div>

            {/* Nom */}
            <h1
              data-h-anim="title"
              className="text-[34px] font-semibold leading-tight tracking-tight text-hh-nuit sm:text-[44px]"
            >
              {name}
            </h1>

            {/* Meta : ville, contact */}
            <div
              data-h-anim="meta"
              className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-hh-muted"
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-hh-saffron" />
                {city}, {country}{" "}
                <span className="ml-1">{FLAG[countryCode] ?? ""}</span>
              </span>
              {phone ? (
                <a
                  href={telHref(phone)}
                  className="flex items-center gap-1.5 transition hover:text-hh-earth-dk"
                >
                  <Phone size={14} className="text-hh-saffron" />
                  {phone}
                </a>
              ) : null}
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 transition hover:text-hh-earth-dk"
              >
                <Mail size={14} className="text-hh-saffron" />
                {email}
              </a>
            </div>

            {/* Description */}
            {description && (
              <p
                data-h-anim="desc"
                className="mt-5 max-w-2xl text-[15px] leading-relaxed text-hh-earth-dk"
              >
                {description}
              </p>
            )}

            {/* CTAs */}
            <div data-h-anim="cta" className="mt-7">
              <ForwarderProfileCta
                code5={code5}
                forwarderName={name}
                isAuthenticated={isAuthenticated}
                isLinked={isLinked}
              />
            </div>
          </div>
        </div>

        {/* Bandeau routes desservies */}
        {routes.length > 0 && (
          <div className="mt-10 rounded-2xl border border-hh-sand-dk bg-white/70 p-4 backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-hh-saffron-dk">
                Routes desservies
              </p>
              <span className="text-[11px] text-hh-muted">
                {routesCount} route{routesCount > 1 ? "s" : ""} active
                {routesCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {routes.map((r, i) => (
                <div
                  key={`${r.origin}-${r.destination}-${r.destinationCity ?? ""}-${i}`}
                  data-h-anim="route"
                  className="inline-flex items-center gap-2 rounded-full border border-hh-sand-dk bg-white px-3 py-1.5 text-[13px] shadow-sm"
                >
                  <span className="text-base leading-none">
                    {FLAG[r.origin] ?? "🌍"}
                  </span>
                  <span className="font-medium text-hh-earth-dk">
                    {r.originLabel}
                  </span>
                  <span className="text-hh-saffron">→</span>
                  <span className="font-medium text-hh-nuit">
                    {r.destinationCity ?? r.destinationLabel}
                  </span>
                  <span className="text-base leading-none">
                    {FLAG[r.destination] ?? "🌍"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              icon: Package,
              value: statsShipments,
              label: "envois publiés",
              color: "text-hh-saffron",
              bg: "bg-hh-saffron-lt",
            },
            {
              icon: Plane,
              value: statsUpcoming,
              label: "à venir",
              color: "text-hh-earth",
              bg: "bg-hh-earth-lt",
            },
            {
              icon: Globe2,
              value: routesCount,
              label: "routes actives",
              color: "text-hh-savane",
              bg: "bg-hh-savane-lt",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border border-hh-sand-dk bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.bg}`}
                >
                  <Icon size={18} className={s.color} />
                </div>
                <div className="min-w-0">
                  <span className="block text-2xl font-semibold text-hh-nuit">
                    <span data-counter={s.value}>0</span>
                  </span>
                  <span className="block truncate text-[11px] text-hh-muted sm:text-xs">
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
