import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Plane } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { HopLogo } from "@/components/auth/hop-logo";
import { ForwarderProfileHero } from "@/components/public/forwarder-profile-hero";
import { ForwarderShipmentsGrid } from "@/components/public/forwarder-shipments-grid";
import type { ShipmentCardData } from "@/components/public/forwarder-shipments-grid";
import { TrackingSearch } from "@/components/landing/tracking-search";
import { countryLabelFr } from "@/lib/country-label-fr";
import { publicVitrineShipmentWhere } from "@/lib/shipment-public-visibility";

type Props = {
  params: Promise<{ code5: string }>;
  searchParams: Promise<{ envoi?: string }>;
};

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ForwarderProfilePage({
  params,
  searchParams,
}: Props) {
  const { code5 } = await params;
  const sp = (await searchParams) ?? {};

  const [forwarder, session] = await Promise.all([
    prisma.forwarder.findUnique({
      where: { code5, isActive: true },
      include: {
        shipments: {
          where: publicVitrineShipmentWhere(),
          orderBy: { departureDate: "asc" },
          select: {
            id: true,
            reference: true,
            status: true,
            transportMode: true,
            originCountry: true,
            destinationCountry: true,
            destinationCity: true,
            departureDate: true,
            arrivalDate: true,
            pricingType: true,
            ratePerKg: true,
            ratePerBox: true,
            flatRate: true,
            ratePerVolume: true,
            volumeDivisor: true,
            minimumCharge: true,
            currency: true,
          },
        },
        _count: { select: { shipments: true } },
      },
    }),
    auth(),
  ]);

  if (!forwarder) notFound();

  const clientId =
    session?.user?.role === "CLIENT" ? session.user.clientId : null;
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

  // Serialize dates for client components
  const shipmentCards: ShipmentCardData[] = forwarder.shipments.map((s) => ({
    id: s.id,
    reference: s.reference,
    status: s.status,
    transportMode: s.transportMode,
    originCountry: s.originCountry,
    destinationCountry: s.destinationCountry,
    destinationCity: s.destinationCity,
    departureDate: s.departureDate?.toISOString() ?? null,
    arrivalDate: s.arrivalDate?.toISOString() ?? null,
    pricingType: s.pricingType,
    ratePerKg: s.ratePerKg,
    ratePerBox: s.ratePerBox,
    flatRate: s.flatRate,
    ratePerVolume: s.ratePerVolume,
    volumeDivisor: s.volumeDivisor,
    minimumCharge: s.minimumCharge,
    currency: s.currency,
  }));

  const rawEnvoi = typeof sp.envoi === "string" ? sp.envoi.trim() : "";
  const highlightShipmentId =
    rawEnvoi &&
    UUID_RE.test(rawEnvoi) &&
    shipmentCards.some((s) => s.id === rawEnvoi)
      ? rawEnvoi
      : undefined;

  return (
    <div className="min-h-screen bg-hh-sand">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-hh-nuit/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <HopLogo href="/" variant="wide" height={32} />
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
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-hh-nuit">
        {/* Dot grid */}
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

        <ForwarderProfileHero
          name={forwarder.name}
          code5={forwarder.code5}
          city={forwarder.city}
          country={countryLabelFr(forwarder.country)}
          phone={forwarder.phone}
          email={forwarder.email}
          description={forwarder.description}
          logoUrl={forwarder.logoUrl}
          initials={initials}
          statsShipments={forwarder._count.shipments}
          statsUpcoming={forwarder.shipments.length}
          isAuthenticated={isAuthenticated}
          isLinked={isLinked}
        />
      </div>

      {/* ── Shipments ── */}
      <main className="mx-auto max-w-5xl px-5 py-14">
        <section
          className="mb-10 rounded-[var(--hh-radius-lg)] bg-white p-5 shadow-sm ring-1 ring-hh-sand-dk/20 sm:p-6"
          aria-labelledby="suivi-colis-heading"
        >
          <h2
            id="suivi-colis-heading"
            className="text-lg font-semibold text-hh-nuit"
          >
            Suivre un colis
          </h2>
          <p className="mt-1 text-sm text-hh-muted">
            Entre le code de suivi indiqué sur ton étiquette ou dans les
            messages (format HOP-…).
          </p>
          <div className="mt-4 max-w-xl">
            <TrackingSearch />
          </div>
        </section>

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

        <ForwarderShipmentsGrid
          shipments={shipmentCards}
          forwarderCode5={forwarder.code5}
          isAuthenticated={isAuthenticated}
          highlightShipmentId={highlightShipmentId}
        />
      </main>

      {/* ── Contact ── */}
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
          <HopLogo href="/" variant="wide" height={32} />
          <p className="text-xs text-hh-muted">
            Page partageable — code{" "}
            <span className="font-mono">{forwarder.code5}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
