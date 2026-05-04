import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  ArrowRight,
  Plane,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { HopLogo } from "@/components/auth/hop-logo";
import { ForwarderProfileCta } from "@/components/public/forwarder-profile-cta";
import { countryLabelFr } from "@/lib/country-label-fr";
import { ShipmentStatus } from "@/app/generated/prisma/enums";

type Props = { params: Promise<{ code5: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code5 } = await params;
  const f = await prisma.forwarder.findUnique({
    where: { code5 },
    select: { name: true, city: true },
  });
  if (!f) return { title: "Transitaire introuvable" };
  return {
    title: `${f.name} — Hophop`,
    description: `Consultez les envois et rejoignez ${f.name} sur Hophop.`,
  };
}

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "En préparation",
  CONFIRMED: "Confirmé",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  CLOSED: "Clôturé",
};

const STATUS_DOT: Record<ShipmentStatus, string> = {
  DRAFT: "bg-hh-muted",
  CONFIRMED: "bg-hh-savane",
  IN_TRANSIT: "bg-hh-saffron",
  ARRIVED: "bg-hh-savane",
  CLOSED: "bg-hh-muted/40",
};

function formatDate(d: Date | null): string {
  if (!d) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function ForwarderProfilePage({ params }: Props) {
  const { code5 } = await params;

  const [forwarder, session] = await Promise.all([
    prisma.forwarder.findUnique({
      where: { code5, isActive: true },
      include: {
        shipments: {
          where: {
            isPublished: true,
            status: {
              in: [
                ShipmentStatus.DRAFT,
                ShipmentStatus.CONFIRMED,
                ShipmentStatus.IN_TRANSIT,
              ],
            },
          },
          orderBy: { departureDate: "asc" },
          select: {
            id: true,
            reference: true,
            status: true,
            originCountry: true,
            destinationCountry: true,
            destinationCity: true,
            departureDate: true,
            arrivalDate: true,
            _count: { select: { parcels: true } },
          },
        },
        _count: { select: { shipments: true } },
      },
    }),
    auth(),
  ]);

  if (!forwarder) notFound();

  const clientId = session?.user?.role === "CLIENT" ? session.user.clientId : null;
  const isAuthenticated = !!clientId;

  let isLinked = false;
  if (clientId) {
    const link = await prisma.clientForwarder.findUnique({
      where: { clientId_forwarderId: { clientId, forwarderId: forwarder.id } },
    });
    isLinked = !!link;
  }

  const initials = forwarder.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-hh-sand">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-hh-nuit/95 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-5">
          <HopLogo href="/" />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/client/dashboard"
                className="text-sm font-medium text-white/60 transition hover:text-white"
              >
                Mon espace →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-white/60 transition hover:text-white"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-hh-saffron px-4 py-1.5 text-sm font-medium text-white transition hover:bg-hh-saffron/90"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-hh-nuit">
        {/* Background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-64 -top-64 h-[600px] w-[600px] rounded-full bg-hh-saffron/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-hh-earth/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {forwarder.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={forwarder.logoUrl}
                  alt={forwarder.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/10 sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-hh-saffron to-hh-earth text-2xl font-bold text-white ring-2 ring-white/10 sm:h-24 sm:w-24">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-saffron/30 bg-hh-saffron/10 px-3 py-0.5 text-[11px] font-medium uppercase tracking-wider text-hh-saffron">
                  Transitaire · Code {forwarder.code5}
                </span>
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {forwarder.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {forwarder.city}, {countryLabelFr(forwarder.country)}
                </span>
                {forwarder.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} />
                    {forwarder.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Mail size={13} />
                  {forwarder.email}
                </span>
              </div>
              {forwarder.description && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
                  {forwarder.description}
                </p>
              )}

              {/* CTA */}
              <div className="mt-7">
                <ForwarderProfileCta
                  code5={forwarder.code5}
                  forwarderName={forwarder.name}
                  isAuthenticated={isAuthenticated}
                  isLinked={isLinked}
                />
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
            {[
              {
                value: forwarder._count.shipments,
                label: "envois au total",
              },
              {
                value: forwarder.shipments.length,
                label: "départs à venir",
              },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold text-white">
                  {s.value}
                </span>
                <span className="text-xs text-white/40">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shipments ── */}
      <main className="mx-auto max-w-5xl px-5 py-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-hh-nuit">
              Départs à venir
            </h2>
            <p className="mt-0.5 text-sm text-hh-muted">
              Envois publiés — rejoignez pour associer vos colis
            </p>
          </div>
          <Plane size={20} className="text-hh-muted" />
        </div>

        {forwarder.shipments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hh-sand-dk bg-white py-16 text-center">
            <Package size={32} className="text-hh-sand-dk" />
            <p className="text-sm font-medium text-hh-muted">
              Aucun départ publié pour l&rsquo;instant
            </p>
            <p className="text-xs text-hh-muted/70">
              Revenez prochainement ou contactez le transitaire
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forwarder.shipments.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-2xl border border-hh-sand-dk/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Status */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-hh-muted">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s.status]}`}
                    />
                    {STATUS_LABEL[s.status]}
                  </div>
                  <span className="rounded-md bg-hh-sand px-2 py-0.5 font-mono text-[10px] text-hh-muted">
                    {s.reference}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-semibold text-hh-nuit">
                      {s.originCountry}
                    </span>
                    <span className="text-[10px] text-hh-muted">
                      {countryLabelFr(s.originCountry)}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-1 px-2">
                    <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
                    <Plane
                      size={13}
                      className="text-hh-saffron rotate-0"
                    />
                    <div className="h-px flex-1 border-t border-dashed border-hh-sand-dk" />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-semibold text-hh-nuit">
                      {s.destinationCountry}
                    </span>
                    <span className="text-[10px] text-hh-muted">
                      {s.destinationCity ?? countryLabelFr(s.destinationCountry)}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-4 space-y-1.5 border-t border-hh-sand-dk/30 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-hh-muted">
                      <Calendar size={11} />
                      Départ
                    </span>
                    <span className="font-medium text-hh-nuit">
                      {formatDate(s.departureDate)}
                    </span>
                  </div>
                  {s.arrivalDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-hh-muted">
                        <Calendar size={11} />
                        Arrivée
                      </span>
                      <span className="font-medium text-hh-nuit">
                        {formatDate(s.arrivalDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-hh-muted">Colis enregistrés</span>
                    <span className="font-medium text-hh-nuit">
                      {s._count.parcels}
                    </span>
                  </div>
                </div>

                {/* Join nudge */}
                {!isLinked && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-hh-saffron-lt px-3 py-2 text-xs">
                    <span className="text-hh-saffron-dk">
                      Rejoignez pour participer
                    </span>
                    <ArrowRight size={12} className="text-hh-saffron" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Contact section ── */}
      {(forwarder.address ?? forwarder.addressFormatted) && (
        <section className="border-t border-hh-sand-dk bg-white px-5 py-12">
          <div className="mx-auto max-w-5xl">
            <h3 className="mb-6 text-lg font-semibold text-hh-nuit">
              Nous trouver
            </h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-hh-saffron-lt">
                  <MapPin size={15} className="text-hh-saffron" />
                </div>
                <div>
                  <p className="text-xs text-hh-muted">Adresse</p>
                  <p className="mt-0.5 text-sm font-medium text-hh-nuit">
                    {forwarder.addressFormatted ?? forwarder.address}
                  </p>
                  <p className="text-xs text-hh-muted">
                    {forwarder.city}, {countryLabelFr(forwarder.country)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-hh-sand-dk px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <HopLogo href="/" />
          <p className="text-xs text-hh-muted">
            Page partageable — code{" "}
            <span className="font-mono">{forwarder.code5}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
