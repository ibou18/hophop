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
    <div className="min-h-screen bg-hh-sand flex flex-col">
      <header className="flex flex-col items-center gap-1 pt-10 pb-6 px-6">
        <HopLogo href="/" />
        <p className="text-[11px] font-normal text-hh-muted tracking-normal">
          Suivi de colis, transitaires & expéditeurs
        </p>
      </header>
      <main className="flex flex-1 flex-col items-center justify-start px-4 pb-16 sm:px-6 w-full">
        {children}
      </main>
    </div>
  );
}
