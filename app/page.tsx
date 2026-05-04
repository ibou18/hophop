import Link from "next/link";
import { Package, MapPin, Users, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import { HopLogo } from "@/components/auth/hop-logo";
import { TrackingSearch } from "@/components/landing/tracking-search";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-hh-sand">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-hh-sand-dk/60 bg-hh-sand/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <HopLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-hh-muted transition-colors hover:text-hh-nuit"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center rounded-[var(--radius-hh-md)] bg-hh-saffron px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pb-24 pt-20 sm:pt-28">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-hh-saffron/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-hh-savane/8 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hh-saffron/30 bg-hh-saffron-lt px-3.5 py-1 text-xs font-medium text-hh-saffron-dk">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hh-saffron opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-hh-saffron" />
            </span>
            Suivi en temps réel
          </span>

          <h1 className="text-4xl font-semibold tracking-tight text-hh-nuit sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Expédier et suivre vos colis{" "}
            <span className="text-hh-saffron">entre proches</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-hh-muted sm:text-lg">
            Hophop connecte clients et transitaires pour un suivi transparent
            de chaque colis, de Montréal à Conakry et au-delà.
          </p>

          {/* Tracking input */}
          <div className="mt-2 w-full max-w-lg">
            <TrackingSearch />
            <p className="mt-2 text-xs text-hh-muted">
              Entrez votre code de suivi pour localiser votre colis
            </p>
          </div>

          {/* CTA secondary */}
          <div className="mt-1 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-hh-saffron-dk transition-colors hover:text-hh-saffron"
            >
              Créer un compte gratuitement
              <ArrowRight size={14} />
            </Link>
            <span className="hidden text-hh-sand-dk sm:block">·</span>
            <Link
              href="/login"
              className="text-sm text-hh-muted transition-colors hover:text-hh-nuit"
            >
              Déjà inscrit ? Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-y border-hh-sand-dk bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-hh-sand-dk px-5 py-6 text-center">
          {[
            { value: "100%", label: "Suivi transparent" },
            { value: "24/7", label: "Accès au statut" },
            { value: "Multi-pays", label: "CA · FR · GN · SN" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-2">
              <div className="text-2xl font-semibold text-hh-saffron-dk">
                {s.value}
              </div>
              <div className="mt-0.5 text-xs text-hh-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-hh-nuit sm:text-3xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-2 text-sm text-hh-muted">
              Une plateforme pensée pour les transitaires et leurs clients
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Package,
                color: "hh-saffron",
                bg: "hh-saffron-lt",
                title: "Déclarez vos colis",
                body:
                  "Saisissez les détails de votre envoi en quelques étapes : poids, contenu, destinataire.",
              },
              {
                icon: MapPin,
                color: "hh-kola",
                bg: "hh-kola-lt",
                title: "Suivez en temps réel",
                body:
                  "Chaque étape — collecte, transit, arrivée — est visible pour vous et le destinataire.",
              },
              {
                icon: Truck,
                color: "hh-earth",
                bg: "hh-earth-lt",
                title: "Rejoignez un envoi",
                body:
                  "Associez votre colis à un envoi groupé et réduisez les délais et coûts d'expédition.",
              },
              {
                icon: Users,
                color: "hh-savane",
                bg: "hh-savane-lt",
                title: "Multi-transitaires",
                body:
                  "Un client peut travailler avec plusieurs transitaires depuis un seul compte.",
              },
              {
                icon: ShieldCheck,
                color: "hh-savane",
                bg: "hh-savane-lt",
                title: "Accès sécurisé",
                body:
                  "Connexion par email ou Google. Chaque colis est accessible uniquement aux personnes concernées.",
              },
              {
                icon: Package,
                color: "hh-saffron",
                bg: "hh-saffron-lt",
                title: "Étiquettes PDF",
                body:
                  "Générez et imprimez des étiquettes de colis avec QR code directement depuis l'interface.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-[var(--radius-hh-lg)] border border-hh-sand-dk bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-hh-md)] bg-${f.bg}`}
                  >
                    <Icon size={18} className={`text-${f.color}`} />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-hh-nuit">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-hh-muted">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-hh-nuit px-5 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Comment ça marche ?
            </h2>
            <p className="mt-2 text-sm text-white/50">
              Trois étapes simples pour envoyer un colis
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Inscrivez-vous",
                body: "Créez votre compte client et liez-le à votre transitaire via son code à 5 chiffres.",
              },
              {
                step: "02",
                title: "Déclarez votre colis",
                body: "Renseignez le contenu, le poids, et le destinataire. Un code de suivi est généré.",
              },
              {
                step: "03",
                title: "Suivez l'expédition",
                body: "Recevez les mises à jour à chaque étape jusqu'à la livraison finale.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative flex flex-col gap-3">
                {i < 2 && (
                  <div
                    aria-hidden
                    className="absolute right-0 top-5 hidden h-px w-1/2 border-t border-dashed border-white/20 sm:block"
                  />
                )}
                <span className="text-3xl font-bold text-hh-saffron/30">
                  {s.step}
                </span>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-hh-lg)] border border-hh-saffron/20 bg-hh-saffron-lt px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold text-hh-nuit sm:text-3xl">
            Prêt à commencer ?
          </h2>
          <p className="mt-2 text-sm text-hh-muted">
            Rejoignez Hophop gratuitement dès aujourd&rsquo;hui.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-hh-md)] bg-hh-saffron px-8 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-hh-md)] border border-hh-saffron-dk/30 bg-white px-8 text-sm font-medium text-hh-saffron-dk transition-colors hover:bg-hh-sand sm:w-auto"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-hh-sand-dk px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <HopLogo />
          <p className="text-xs text-hh-muted">
            © {new Date().getFullYear()} Hophop. Chaleureux, fiable.
          </p>
        </div>
      </footer>
    </div>
  );
}
