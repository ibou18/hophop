import type { Metadata } from "next";
import { HopLogo } from "@/components/auth/hop-logo";

export const metadata: Metadata = {
  title: "Compte — Hophop",
  description: "Connexion et inscription Hophop",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-hh-sand">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(232,130,12,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(139,69,19,0.08),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4] [background-image:radial-gradient(var(--color-hh-sand-dk)_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden
      />

      <header className="relative z-10 flex flex-col items-center gap-3 px-6 pb-4 pt-12 sm:pt-14">
        <div className="rounded-2xl border border-white/60 bg-white/40 px-5 py-3 shadow-sm shadow-black/[0.03] ring-1 ring-hh-sand-dk/15 backdrop-blur-md">
          <HopLogo href="/" variant="wide" height={42} priority />
        </div>
        <p className="max-w-sm text-center text-[12px] font-medium leading-snug tracking-wide text-hh-muted">
          Suivi de colis · transitaires · expéditeurs
        </p>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col items-center px-4 pb-20 sm:px-6">
        {children}
      </main>
    </div>
  );
}
