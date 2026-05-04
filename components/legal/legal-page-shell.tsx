import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HopLogo } from "@/components/auth/hop-logo";

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-hh-sand">
      <header className="border-b border-hh-sand-dk/20 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <HopLogo href="/" variant="wide" height={32} />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-hh-muted transition hover:text-hh-earth-dk"
          >
            <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
            Accueil
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-16">
        <p className="text-[12px] text-hh-muted">
          Dernière mise à jour : {updatedAt}
        </p>
        <h1 className="mt-2 text-[28px] font-medium tracking-tight text-hh-earth-dk">
          {title}
        </h1>
        <article className="mt-8 space-y-10 text-[15px] leading-relaxed text-hh-earth-dk">
          {children}
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-medium text-hh-earth-dk">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-hh-earth-dk/95 [&_a]:text-hh-saffron-dk [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-hh-saffron">
        {children}
      </div>
    </section>
  );
}
