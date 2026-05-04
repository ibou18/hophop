import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TrackingTimeline } from "@/components/client/tracking-timeline";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { countryLabelFr } from "@/lib/country-label-fr";
import { TrackingSearch } from "@/components/landing/tracking-search";

type Props = { params: Promise<{ trackingCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackingCode } = await params;
  return { title: `Suivi ${decodeURIComponent(trackingCode)}` };
}

export default async function PublicTrackingPage({ params }: Props) {
  const { trackingCode } = await params;
  const code = decodeURIComponent(trackingCode).trim().toUpperCase();

  const parcel = await prisma.parcel.findUnique({
    where: { trackingCode: code },
    include: {
      recipient: {
        select: { firstName: true, lastName: true, city: true, country: true },
      },
      trackingEvents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          location: true,
          country: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!parcel) {
    return (
      <div className="min-h-screen bg-hh-sand">
        <header className="border-b border-hh-sand-dk/25 bg-hh-earth-lt px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <Link href="/" className="text-[22px] font-medium">
              <span style={{ color: "#4A1F08" }}>Hop</span>
              <span style={{ color: "#E8820C" }}>hop</span>
            </Link>
            <span className="text-[12px] text-hh-muted">Suivi de colis</span>
          </div>
        </header>

        <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-hh-kola-lt">
            <SearchX size={28} className="text-hh-kola" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-semibold text-hh-nuit">
              Code introuvable
            </h1>
            <p className="text-sm leading-relaxed text-hh-muted">
              Aucun colis ne correspond au code{" "}
              <span className="font-mono font-medium text-hh-saffron-dk">
                {code}
              </span>
              .<br />
              Vérifiez le code et réessayez.
            </p>
          </div>
          <TrackingSearch />
          <Link
            href="/"
            className="text-sm font-medium text-hh-saffron-dk transition-colors hover:text-hh-saffron"
          >
            ← Retour à l&rsquo;accueil
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hh-sand">
      {/* Header */}
      <header className="border-b border-hh-sand-dk/25 bg-hh-earth-lt px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="text-[22px] font-medium text-hh-earth-dk">
            <span style={{ color: "#4A1F08" }}>Hop</span>
            <span style={{ color: "#E8820C" }}>hop</span>
          </Link>
          <span className="text-[12px] text-hh-muted">Suivi de colis</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Tracking code + status */}
        <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-hh-muted">
                Code de suivi
              </p>
              <p className="mt-0.5 font-mono text-[18px] font-medium text-hh-saffron-dk">
                {parcel.trackingCode}
              </p>
            </div>
            <ParcelStatusBadge status={parcel.status} />
          </div>

          <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
            <p className="text-[12px] uppercase tracking-wide text-hh-muted">
              Destinataire
            </p>
            <p className="mt-1 text-[15px] font-medium text-hh-earth-dk">
              {parcel.recipient.firstName} {parcel.recipient.lastName}
            </p>
            <p className="text-[13px] text-hh-muted">
              {parcel.recipient.city && `${parcel.recipient.city}, `}
              {countryLabelFr(parcel.recipient.country)}
            </p>
          </div>

          {parcel.description && (
            <div className="mt-3 border-t border-hh-sand-dk/15 pt-3">
              <p className="text-[12px] text-hh-muted">{parcel.description}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
          <h2 className="mb-4 text-[15px] font-medium text-hh-earth-dk">
            Historique du colis
          </h2>
          {parcel.trackingEvents.length === 0 ? (
            <p className="text-[13px] text-hh-muted">
              Aucun événement enregistré pour l'instant.
            </p>
          ) : (
            <TrackingTimeline events={parcel.trackingEvents} />
          )}
        </div>

        <p className="text-center text-[11px] text-hh-muted">
          Page de suivi publique — aucune connexion requise
        </p>
      </main>
    </div>
  );
}
