import Link from "next/link";
import type { Metadata } from "next";
import { HopLogo } from "@/components/auth/hop-logo";
import { HeroSection } from "@/components/landing/hero-section";
import { CountryMarquee } from "@/components/landing/country-marquee";
import { ScrollSections } from "@/components/landing/scroll-section";
import { Testimonials } from "@/components/landing/testimonials";
import { UpcomingDepartures } from "@/components/landing/upcoming-departures";
import { getPublicUpcomingShipments } from "@/lib/public-shipments-data";

const HOME_TITLE = "hOpOp | Envoi et suivi colis diaspora Afrique";
const HOME_DESCRIPTION =
  "Envoie et suis tes colis entre diaspora et Afrique avec hOpOp. Suivi en temps reel, transitaires verifies, livraisons plus sereines.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "envoi colis Afrique",
    "suivi colis diaspora",
    "transitaire Afrique",
    "expedition France Afrique",
    "livraison colis Afrique",
    "hOpOp",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "hOpOp",
    locale: "fr_FR",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: "/assets/logos/logo-b.png",
        alt: "hOpOp - Envoi et suivi de colis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
      "max-video-preview": -1,
    },
  },
};

export default async function Home() {
  const upcomingShipments = await getPublicUpcomingShipments();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "hOpOp",
        url: "/",
        logo: "/assets/logos/logo-b.png",
      },
      {
        "@type": "WebSite",
        name: "hOpOp",
        url: "/",
        inLanguage: "fr",
        description: HOME_DESCRIPTION,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-hh-sand">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Nav (sur fond clair désormais) ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <HopLogo href="/" variant="wide" height={36} priority />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-hh-earth-dk/70 transition hover:text-hh-earth-dk"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center rounded-lg bg-hh-saffron px-4 text-sm font-medium text-white shadow-sm transition hover:bg-hh-saffron/90"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero clair animé ── */}
      <HeroSection />

      {/* ── Bandeau pays (marquee) ── */}
      <CountryMarquee />

      {/* ── Prochains départs publics ── */}
      <UpcomingDepartures shipments={upcomingShipments} />

      {/* ── Témoignages diaspora & transitaires ── */}
      <Testimonials />

      {/* ── Stats + Features + Comment ça marche + CTA final ── */}
      <ScrollSections />

      {/* ── Footer ── */}
      <footer className="border-t border-hh-sand-dk bg-hh-sand px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <HopLogo href="/" variant="wide" height={28} />
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <nav
              aria-label="Informations légales"
              className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-hh-muted sm:justify-end"
            >
              <Link
                href="/legal/conditions"
                className="transition hover:text-hh-earth-dk hover:underline"
              >
                Conditions d&apos;utilisation
              </Link>
              <Link
                href="/legal/confidentialite"
                className="transition hover:text-hh-earth-dk hover:underline"
              >
                Politique de confidentialité
              </Link>
            </nav>
            <p className="text-xs text-hh-muted">
              © {new Date().getFullYear()} hOpOp — Chaleureux, fiable.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
