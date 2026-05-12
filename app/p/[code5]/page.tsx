import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Plane, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { HopLogo } from "@/components/auth/hop-logo";
import { ForwarderProfileHero } from "@/components/public/forwarder-profile-hero";
import { ForwarderShipmentsGrid } from "@/components/public/forwarder-shipments-grid";
import type { ShipmentCardData } from "@/components/public/forwarder-shipments-grid";
import { ForwarderShareButtons } from "@/components/public/forwarder-share-buttons";
import { ForwarderTrustBlock } from "@/components/public/forwarder-trust-block";
import { ForwarderContactBlock } from "@/components/public/forwarder-contact-block";
import { TrackingSearch } from "@/components/landing/tracking-search";
import { countryLabelFr } from "@/lib/country-label-fr";
import { publicVitrineShipmentWhere } from "@/lib/shipment-public-visibility";
import {
  buildForwarderJsonLd,
  describeRoutes,
  uniqueCountries,
} from "@/lib/forwarder-public-meta";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import type { Country } from "@/app/generated/prisma/enums";

type Props = {
  params: Promise<{ code5: string }>;
  searchParams: Promise<{ envoi?: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { code5 } = await params;
  const sp = (await searchParams) ?? {};
  const f = await prisma.forwarder.findUnique({
    where: { code5, isActive: true },
    select: {
      name: true,
      city: true,
      country: true,
      description: true,
      logoUrl: true,
      shipments: {
        where: publicVitrineShipmentWhere(),
        select: {
          id: true,
          reference: true,
          originCountry: true,
          destinationCountry: true,
          destinationCity: true,
          departureDate: true,
        },
      },
    },
  });

  if (!f) {
    return {
      title: "Transitaire introuvable",
      description: "Cette page transitaire n'existe pas ou a été désactivée.",
      robots: { index: false, follow: false },
    };
  }

  const base = getAppBaseUrl();
  const rawEnvoi = typeof sp.envoi === "string" ? sp.envoi.trim() : "";
  const highlightedShipment =
    rawEnvoi && UUID_RE.test(rawEnvoi)
      ? f.shipments.find((s) => s.id === rawEnvoi)
      : null;
  const url = highlightedShipment
    ? `${base}/p/${code5}?envoi=${encodeURIComponent(highlightedShipment.id)}`
    : `${base}/p/${code5}`;
  const routes = describeRoutes(f.shipments, 3);
  const country = countryLabelFr(f.country as Country);
  const shipmentRoute = highlightedShipment
    ? `${countryLabelFr(highlightedShipment.originCountry as Country)} → ${countryLabelFr(highlightedShipment.destinationCountry as Country)}`
    : null;

  const titleBase = highlightedShipment
    ? `${f.name} — Envoi ${highlightedShipment.reference} · ${shipmentRoute}`
    : `${f.name} — Transitaire ${f.city} · ${country}`;
  const description = highlightedShipment
    ? `Partage envoi ${highlightedShipment.reference} avec ${f.name}. Route ${shipmentRoute}${highlightedShipment.destinationCity ? ` · ${highlightedShipment.destinationCity}` : ""}. Déclarez vos colis et suivez chaque étape sur Hophop.`
    : f.description ??
      (routes
        ? `Envoyez vos colis avec ${f.name}, transitaire à ${f.city}. Routes : ${routes}. ${f.shipments.length} départ${f.shipments.length > 1 ? "s" : ""} publié${f.shipments.length > 1 ? "s" : ""}. Suivi en temps réel sur Hophop.`
        : `Transitaire à ${f.city}, ${country}. Envoyez vos colis et suivez chaque étape sur Hophop.`);

  return {
    title: titleBase,
    description,
    keywords: [
      "transitaire",
      f.name,
      f.city,
      country,
      "Hophop",
      "envoi colis",
      "suivi colis",
      "Afrique de l'Ouest",
      "diaspora",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: titleBase,
      description,
      siteName: "Hophop",
      locale: "fr_FR",
      images: [
        {
          url: "/assets/logos/logo-b.png",
          alt: highlightedShipment
            ? `Envoi ${highlightedShipment.reference} - ${f.name}`
            : `${f.name} - Hophop`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleBase,
      description,
      images: ["/assets/logos/logo-b.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

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
            ratePerVehicle: true,
            rateDrumSmall: true,
            rateDrumMedium: true,
            rateDrumLarge: true,
            rateCartonSmall: true,
            rateCartonMedium: true,
            rateCartonLarge: true,
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

  // Préparer les shipments pour le grid client
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
    ratePerVehicle: s.ratePerVehicle,
    rateDrumSmall: s.rateDrumSmall,
    rateDrumMedium: s.rateDrumMedium,
    rateDrumLarge: s.rateDrumLarge,
    rateCartonSmall: s.rateCartonSmall,
    rateCartonMedium: s.rateCartonMedium,
    rateCartonLarge: s.rateCartonLarge,
    volumeDivisor: s.volumeDivisor,
    minimumCharge: s.minimumCharge,
    currency: s.currency,
  }));

  // Routes uniques (pour bandeau hero)
  const routesMap = new Map<
    string,
    {
      origin: string;
      originLabel: string;
      destination: string;
      destinationLabel: string;
      destinationCity: string | null;
    }
  >();
  for (const s of forwarder.shipments) {
    const key = `${s.originCountry}-${s.destinationCountry}-${s.destinationCity ?? ""}`;
    if (!routesMap.has(key)) {
      routesMap.set(key, {
        origin: s.originCountry,
        originLabel: countryLabelFr(s.originCountry as Country),
        destination: s.destinationCountry,
        destinationLabel: countryLabelFr(s.destinationCountry as Country),
        destinationCity: s.destinationCity,
      });
    }
  }
  const routes = Array.from(routesMap.values()).slice(0, 8);
  const routesCount = routesMap.size;

  // Pays uniques desservis (pour JSON-LD)
  const { destinations: destCountries } = uniqueCountries(forwarder.shipments);

  // JSON-LD
  const jsonLd = buildForwarderJsonLd({
    name: forwarder.name,
    code5: forwarder.code5,
    email: forwarder.email,
    phone: forwarder.phone,
    city: forwarder.city,
    country: forwarder.country,
    address: forwarder.address,
    addressFormatted: forwarder.addressFormatted,
    latitude: forwarder.latitude,
    longitude: forwarder.longitude,
    description: forwarder.description,
    logoUrl: forwarder.logoUrl,
    destinationCountries: destCountries,
  });

  const rawEnvoi = typeof sp.envoi === "string" ? sp.envoi.trim() : "";
  const highlightShipmentId =
    rawEnvoi &&
    UUID_RE.test(rawEnvoi) &&
    shipmentCards.some((s) => s.id === rawEnvoi)
      ? rawEnvoi
      : undefined;

  return (
    <div className="min-h-screen bg-hh-sand">
      {/* JSON-LD pour Google */}
      <Script
        id="forwarder-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Sticky nav (clair maintenant) ── */}
      <header className="sticky top-0 z-30 border-b border-hh-sand-dk bg-hh-sand/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <HopLogo href="/" variant="wide" height={32} />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/client/dashboard"
                className="text-sm font-medium text-hh-earth-dk transition hover:text-hh-saffron-dk"
              >
                Mon espace →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-hh-earth-dk/70 transition hover:text-hh-earth-dk"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-hh-saffron px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-hh-saffron/90"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero clair animé ── */}
      <ForwarderProfileHero
        name={forwarder.name}
        code5={forwarder.code5}
        city={forwarder.city}
        country={countryLabelFr(forwarder.country as Country)}
        countryCode={forwarder.country}
        phone={forwarder.phone}
        email={forwarder.email}
        description={forwarder.description}
        logoUrl={forwarder.logoUrl}
        initials={initials}
        statsShipments={forwarder._count.shipments}
        statsUpcoming={forwarder.shipments.length}
        routesCount={routesCount}
        routes={routes}
        isAuthenticated={isAuthenticated}
        isLinked={isLinked}
        memberSince={forwarder.createdAt}
      />

      {/* ── Bandeau partage social ── */}
      <section className="border-t border-hh-sand-dk bg-white px-5 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-hh-saffron-dk">
              Partager cette page
            </p>
            <p className="mt-0.5 text-sm text-hh-muted">
              Aidez votre famille et vos clients à vous retrouver
            </p>
          </div>
          <ForwarderShareButtons
            code5={forwarder.code5}
            forwarderName={forwarder.name}
            city={forwarder.city}
            country={countryLabelFr(forwarder.country as Country)}
          />
        </div>
      </section>

      {/* ── Tracking + Shipments ── */}
      <main className="mx-auto max-w-5xl px-5 py-14">
        <section
          className="mb-12 overflow-hidden rounded-2xl border border-hh-sand-dk bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="suivi-colis-heading"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hh-saffron-lt">
              <Search size={18} className="text-hh-saffron" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="suivi-colis-heading"
                className="text-lg font-semibold text-hh-nuit"
              >
                Suivre un colis
              </h2>
              <p className="mt-0.5 text-sm text-hh-muted">
                Entre le code de suivi indiqué sur ton étiquette ou dans les
                messages (format HOP-…).
              </p>
              <div className="mt-4 max-w-xl">
                <TrackingSearch />
              </div>
            </div>
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
          <Plane size={20} className="text-hh-saffron" />
        </div>

        <ForwarderShipmentsGrid
          shipments={shipmentCards}
          forwarderCode5={forwarder.code5}
          isAuthenticated={isAuthenticated}
          highlightShipmentId={highlightShipmentId}
        />
      </main>

      {/* ── Pourquoi ce transitaire ── */}
      <ForwarderTrustBlock forwarderName={forwarder.name} />

      {/* ── Contact enrichi ── */}
      <ForwarderContactBlock
        name={forwarder.name}
        email={forwarder.email}
        phone={forwarder.phone}
        address={forwarder.addressFormatted ?? forwarder.address}
        city={forwarder.city}
        country={countryLabelFr(forwarder.country as Country)}
        latitude={forwarder.latitude}
        longitude={forwarder.longitude}
      />

      {/* ── Footer ── */}
      <footer className="border-t border-hh-sand-dk bg-hh-sand px-5 py-8">
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
