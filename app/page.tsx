import Link from "next/link";
import type { Metadata } from "next";
import { HopLogo } from "@/components/auth/hop-logo";
import { HeroSection } from "@/components/landing/hero-section";
import { CountryMarquee } from "@/components/landing/country-marquee";
import { ScrollSections } from "@/components/landing/scroll-section";
import { Testimonials } from "@/components/landing/testimonials";
import { UpcomingDepartures } from "@/components/landing/upcoming-departures";
import { getPublicUpcomingShipments } from "@/lib/public-shipments-data";
import { getAppBaseUrl } from "@/lib/mail/app-url";

export const dynamic = "force-dynamic";

const HOME_TITLE = "hOpOp | Envoi et suivi colis diaspora Afrique";
const HOME_DESCRIPTION =
  "Envoie et suis tes colis entre diaspora et Afrique avec hOpOp. Suivi en temps reel, transitaires verifies, livraisons plus sereines.";

const HOME_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Comment suivre un colis envoyé via hOpOp ?",
    a: "Saisis le code de suivi (format HOP-…) qui figure sur ton étiquette ou dans le message de ton transitaire sur la page d'accueil ou via /track/{code}. Tu vois en temps réel chaque étape : prise en charge, départ, arrivée et livraison.",
  },
  {
    q: "Quels pays sont desservis par hOpOp ?",
    a: "hOpOp relie la diaspora (France, Belgique, Suisse, Canada, États-Unis) à l'Afrique de l'Ouest et centrale : Sénégal, Côte d'Ivoire, Mali, Guinée, Cameroun, Togo, Burkina Faso, Nigeria, Gambie.",
  },
  {
    q: "Comment trouver un transitaire de confiance ?",
    a: "Chaque transitaire dispose d'une page publique sur hOpOp (/p/{code5}) avec ses départs à venir, ses routes, ses tarifs et ses coordonnées. Les transitaires actifs sont vérifiés par notre équipe.",
  },
  {
    q: "hOpOp est-il gratuit pour les expéditeurs ?",
    a: "Oui. Créer un compte client et suivre ses colis est gratuit. Les frais d'envoi dépendent du transitaire que tu choisis (au kilo, au volume, au carton ou forfait).",
  },
  {
    q: "Quels modes de transport sont disponibles ?",
    a: "Aérien (rapide), maritime (économique) et routier selon les routes proposées par le transitaire.",
  },
];

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
    "groupage colis Sénégal",
    "groupage colis Côte d'Ivoire",
    "cargo diaspora",
    "hOpOp",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "hOpOp",
    locale: "fr_FR",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
  const base = getAppBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "hOpOp",
        url: base,
        logo: `${base}/assets/logos/logo-b.png`,
        description: HOME_DESCRIPTION,
        areaServed: [
          "FR",
          "BE",
          "CH",
          "CA",
          "US",
          "SN",
          "CI",
          "ML",
          "GN",
          "CM",
          "TG",
          "BF",
          "NG",
          "GM",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "hOpOp",
        url: base,
        inLanguage: "fr",
        description: HOME_DESCRIPTION,
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/track/{search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Service",
        "@id": `${base}/#service`,
        name: "Suivi de colis et mise en relation transitaires",
        serviceType: "Parcel forwarding & tracking",
        provider: { "@id": `${base}/#organization` },
        areaServed: [
          { "@type": "Country", name: "Sénégal" },
          { "@type": "Country", name: "Côte d'Ivoire" },
          { "@type": "Country", name: "Mali" },
          { "@type": "Country", name: "Guinée" },
          { "@type": "Country", name: "Cameroun" },
          { "@type": "Country", name: "Togo" },
          { "@type": "Country", name: "Burkina Faso" },
          { "@type": "Country", name: "Nigeria" },
          { "@type": "Country", name: "Gambie" },
        ],
        audience: {
          "@type": "Audience",
          audienceType: "Diaspora ouest-africaine",
        },
        description: HOME_DESCRIPTION,
        url: base,
      },
      {
        "@type": "FAQPage",
        "@id": `${base}/#faq`,
        mainEntity: HOME_FAQ.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
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
