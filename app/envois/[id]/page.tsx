import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { countryLabelFr } from "@/lib/country-label-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import { ShipmentPublicCard } from "@/components/public/shipment-public-card";
import { ShipmentShareButtons } from "@/components/public/shipment-share-buttons";
import { HopLogo } from "@/components/auth/hop-logo";
import type { Currency, TransportMode } from "@/app/generated/prisma/enums";

const TRANSPORT_EMOJI: Record<TransportMode, string> = {
  AIR: "✈️", SEA: "⛵", ROAD: "🚛", CONTAINER: "📦", RORO: "🚗",
};
const TRANSPORT_LABEL: Record<TransportMode, string> = {
  AIR: "Aérien", SEA: "Maritime", ROAD: "Routier", CONTAINER: "Conteneur", RORO: "RoRo",
};

async function getShipment(id: string) {
  return prisma.shipment.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      status: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      originCity: true,
      destinationCity: true,
      departureDate: true,
      arrivalDate: true,
      pricingType: true,
      ratePerKg: true,
      ratePerBox: true,
      flatRate: true,
      ratePerVehicle: true,
      currency: true,
      acceptsVehicles: true,
      isPublished: true,
      _count: { select: { parcels: true } },
      forwarder: {
        select: {
          id: true,
          name: true,
          code5: true,
          city: true,
          country: true,
          logoUrl: true,
          phone: true,
          email: true,
        },
      },
    },
  });
}

export type PublicShipmentData = NonNullable<Awaited<ReturnType<typeof getShipment>>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getShipment(id);
  if (!s) return { title: "Envoi introuvable" };

  const origin = countryLabelFr(s.originCountry);
  const dest = countryLabelFr(s.destinationCountry);
  const emoji = TRANSPORT_EMOJI[s.transportMode];
  const mode = TRANSPORT_LABEL[s.transportMode];
  const base = getAppBaseUrl();

  const title = `${emoji} Envoi ${s.reference} — ${origin} → ${dest} | Hophop`;
  const description = [
    `Envoi ${mode.toLowerCase()} de ${origin} vers ${dest}`,
    s.destinationCity ? `(${s.destinationCity})` : "",
    s.departureDate
      ? `· départ prévu le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s.departureDate))}`
      : "",
    `· transitaire : ${s.forwarder.name}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const imageUrl = `${base}/envois/${id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}/envois/${id}`,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await getShipment(id);
  if (!s) notFound();

  const base = getAppBaseUrl();
  const publicUrl = `${base}/envois/${id}`;

  const origin = countryLabelFr(s.originCountry);
  const dest = countryLabelFr(s.destinationCountry);
  const sym = CURRENCY_SYMBOL[s.currency as Currency] ?? s.currency;

  const pricingLine = (() => {
    if (!s.pricingType) return null;
    if (s.ratePerKg   != null) return `À partir de ${s.ratePerKg} ${sym}/kg`;
    if (s.ratePerBox  != null) return `${s.ratePerBox} ${sym}/carton`;
    if (s.flatRate    != null) return `${s.flatRate} ${sym}/colis`;
    if (s.ratePerVehicle != null) return `${s.ratePerVehicle} ${sym}/véhicule`;
    return null;
  })();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f7f3ed 0%, #fdf0e0 60%, #f0ead8 100%)" }}>
      {/* Nav */}
      <header className="border-b border-hh-sand-dk/20 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/">
            <HopLogo className="h-7" />
          </Link>
          <Link
            href={`/p/${s.forwarder.code5}`}
            className="rounded-xl bg-hh-saffron px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            Contacter {s.forwarder.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-12">
        {/* Title */}
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-hh-saffron">
            Envoi disponible
          </p>
          <h1 className="mt-1 text-[28px] font-bold text-hh-earth-dk">
            {origin} → {dest}
          </h1>
          {s.destinationCity && (
            <p className="mt-0.5 text-[15px] text-hh-muted">
              Livraison à {s.destinationCity}
            </p>
          )}
        </div>

        {/* Shareable card — this is the screenshot target */}
        <ShipmentPublicCard shipment={s} />

        {/* Share buttons */}
        <ShipmentShareButtons publicUrl={publicUrl} shipment={s} />

        {/* Key details */}
        <div className="w-full rounded-2xl border border-hh-sand-dk/20 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-4 text-[14px] font-semibold text-hh-earth-dk">Détails de l&apos;envoi</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailItem label="Référence" value={s.reference} mono />
            <DetailItem label="Mode" value={`${TRANSPORT_EMOJI[s.transportMode]} ${TRANSPORT_LABEL[s.transportMode]}`} />
            <DetailItem label="Statut" value={s.status === "CONFIRMED" ? "Confirmé" : s.status === "IN_TRANSIT" ? "En transit" : s.status === "ARRIVED" ? "Arrivé" : "Ouvert"} />
            {s.departureDate && (
              <DetailItem
                label="Départ prévu"
                value={new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s.departureDate))}
              />
            )}
            {s.arrivalDate && (
              <DetailItem
                label="Arrivée estimée"
                value={new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s.arrivalDate))}
              />
            )}
            {pricingLine && <DetailItem label="Tarif" value={pricingLine} highlight />}
            {s.acceptsVehicles && <DetailItem label="Véhicules" value="Acceptés ✓" />}
          </dl>
        </div>

        {/* CTA */}
        <div className="w-full rounded-2xl border border-hh-saffron/25 bg-hh-saffron/8 p-6 text-center">
          <p className="text-[15px] font-semibold text-hh-earth-dk">
            Vous souhaitez envoyer un colis ?
          </p>
          <p className="mt-1 text-[13px] text-hh-muted">
            Contactez directement{" "}
            <span className="font-semibold text-hh-earth-dk">{s.forwarder.name}</span>{" "}
            ou déclarez votre colis en ligne.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={`/p/${s.forwarder.code5}`}
              className="rounded-xl bg-hh-saffron px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-hh-saffron/25 hover:opacity-90"
            >
              Voir le profil transitaire
            </Link>
            <Link
              href={`/client/declare?forwarder=${s.forwarder.code5}&envoi=${s.id}`}
              className="rounded-xl border border-hh-earth-dk/20 bg-white px-5 py-2.5 text-[13px] font-semibold text-hh-earth-dk hover:bg-hh-sand/40"
            >
              Déclarer un colis
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">{label}</dt>
      <dd className={`mt-0.5 text-[14px] ${mono ? "font-mono" : "font-medium"} ${highlight ? "text-hh-saffron-dk" : "text-hh-earth-dk"}`}>
        {value}
      </dd>
    </div>
  );
}
