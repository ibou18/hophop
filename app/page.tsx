import Link from "next/link";
import { HopLogo } from "@/components/auth/hop-logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-hh-sand px-6 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <HopLogo />
        <p className="max-w-md text-[15px] font-normal leading-relaxed text-hh-muted">
          Chaleureux, fiable — suivi de colis entre proches et transitaires.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Connexion
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-[var(--hh-radius-md)] border border-hh-saffron bg-hh-saffron-lt px-6 text-sm font-medium text-hh-saffron-dk transition-colors hover:bg-hh-saffron/10"
        >
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
