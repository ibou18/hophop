import Link from "next/link";
import { HopLogo } from "@/components/auth/hop-logo";
import { TrackingSearch } from "@/components/landing/tracking-search";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-hh-sand px-5 text-center">
      <HopLogo />

      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl font-bold text-hh-sand-dk">404</span>
        <h1 className="text-xl font-semibold text-hh-nuit">Page introuvable</h1>
        <p className="max-w-sm text-sm leading-relaxed text-hh-muted">
          Cette page n&rsquo;existe pas. Vous pouvez suivre un colis ci-dessous
          ou retourner à l&rsquo;accueil.
        </p>
      </div>

      <TrackingSearch />

      <Link
        href="/"
        className="text-sm font-medium text-hh-saffron-dk transition-colors hover:text-hh-saffron"
      >
        ← Retour à l&rsquo;accueil
      </Link>
    </div>
  );
}
