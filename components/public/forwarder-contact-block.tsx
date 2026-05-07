"use client";

import { useEffect, useRef } from "react";
import { MapPin, Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface Props {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

function whatsappFromPhone(phone: string): string {
  // Garde uniquement les chiffres + "+"
  const clean = phone.replace(/[^\d+]/g, "");
  // wa.me ne veut pas de +
  return `https://wa.me/${clean.replace(/^\+/, "")}`;
}

function mapsLink(opts: {
  address: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  if (opts.latitude != null && opts.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${opts.latitude},${opts.longitude}`;
  }
  const q = encodeURIComponent(
    [opts.address, opts.city, opts.country].filter(Boolean).join(", "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function ForwarderContactBlock({
  name,
  email,
  phone,
  address,
  city,
  country,
  latitude,
  longitude,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current!.querySelectorAll<HTMLElement>("[data-contact]"), {
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
        y: 24,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const hasMap = !!(address || (latitude != null && longitude != null));

  return (
    <section ref={rootRef} className="border-t border-hh-sand-dk bg-hh-sand px-5 py-14">
      <div className="mx-auto max-w-5xl">
        <div data-contact className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-hh-saffron-dk">
            Contact
          </p>
          <h2 className="text-2xl font-semibold text-hh-nuit sm:text-3xl">
            Joignez {name}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Adresse + Maps */}
          {hasMap && (
            <a
              data-contact
              href={mapsLink({ address, city, country, latitude, longitude })}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-hh-saffron/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hh-saffron-lt">
                  <MapPin size={18} className="text-hh-saffron" />
                </div>
                <ExternalLink
                  size={14}
                  className="text-hh-muted/60 transition-colors group-hover:text-hh-saffron"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-hh-muted">
                  Adresse
                </p>
                <p className="mt-1 text-sm font-medium text-hh-nuit">
                  {address ?? `${city}, ${country}`}
                </p>
                {address && (
                  <p className="mt-0.5 text-xs text-hh-muted">
                    {city}, {country}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-hh-saffron-dk">
                  Voir sur Google Maps →
                </p>
              </div>
            </a>
          )}

          {/* Téléphone */}
          {phone && (
            <a
              data-contact
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="group flex flex-col gap-3 rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-hh-saffron/30 hover:shadow-md"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hh-savane-lt">
                <Phone size={18} className="text-hh-savane" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-hh-muted">
                  Téléphone
                </p>
                <p className="mt-1 text-sm font-medium text-hh-nuit">{phone}</p>
                <p className="mt-3 text-xs font-medium text-hh-saffron-dk">
                  Appeler maintenant →
                </p>
              </div>
            </a>
          )}

          {/* WhatsApp (utilise le téléphone) */}
          {phone && (
            <a
              data-contact
              href={whatsappFromPhone(phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-[#25D366]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/15">
                  <MessageCircle size={18} className="text-[#25D366]" />
                </div>
                <ExternalLink
                  size={14}
                  className="text-hh-muted/60 transition-colors group-hover:text-[#25D366]"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-hh-muted">
                  WhatsApp
                </p>
                <p className="mt-1 text-sm font-medium text-hh-nuit">
                  Démarrer une conversation
                </p>
                <p className="mt-3 text-xs font-medium text-[#25D366]">
                  Envoyer un message →
                </p>
              </div>
            </a>
          )}

          {/* Email */}
          <a
            data-contact
            href={`mailto:${email}`}
            className="group flex flex-col gap-3 rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-hh-saffron/30 hover:shadow-md"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hh-earth-lt">
              <Mail size={18} className="text-hh-earth" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-hh-muted">
                Email
              </p>
              <p className="mt-1 truncate text-sm font-medium text-hh-nuit">
                {email}
              </p>
              <p className="mt-3 text-xs font-medium text-hh-saffron-dk">
                Écrire un email →
              </p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
