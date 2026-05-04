import Link from "next/link";
import { HopLogo } from "@/components/auth/hop-logo";
import { HeroSection } from "@/components/landing/hero-section";
import { ScrollSections } from "@/components/landing/scroll-section";
import { UpcomingDepartures } from "@/components/landing/upcoming-departures";
import { getPublicUpcomingShipments } from "@/lib/public-shipments-data";

export default async function Home() {
  const upcomingShipments = await getPublicUpcomingShipments(5);

  return (
    <div className="flex min-h-screen flex-col bg-hh-sand">
      {/* ── Nav ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <HopLogo href="/" variant="wide" height={36} priority />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-white/60 transition hover:text-white"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center rounded-lg border border-hh-saffron/40 bg-hh-saffron/10 px-4 text-sm font-medium text-hh-saffron transition hover:bg-hh-saffron hover:text-white"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Animated hero ── */}
      <HeroSection />

      {/* ── Prochains départs publics ── */}
      <UpcomingDepartures shipments={upcomingShipments} />

      {/* ── Scroll sections ── */}
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
              © {new Date().getFullYear()} Hophop — Chaleureux, fiable.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
