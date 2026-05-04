import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Package,
  Printer,
} from "lucide-react";
import {
  getClientParcelDetail,
  getParcelShipmentJoinData,
} from "@/lib/client-data";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { TrackingTimeline } from "@/components/client/tracking-timeline";
import { ParcelQrCode } from "@/components/client/parcel-qr-code";
import { JoinShipmentPanel } from "@/components/client/join-shipment-panel";
import { countryLabelFr } from "@/lib/country-label-fr";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const metadata: Metadata = { title: "Détail colis" };

type Props = { params: Promise<{ id: string }> };

export default async function ClientParcelDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const [parcel, joinData] = await Promise.all([
    getClientParcelDetail(clientId, id),
    getParcelShipmentJoinData(clientId, id),
  ]);
  if (!parcel) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Back */}
      <Link
        href="/client/parcels"
        className="flex w-fit items-center gap-1.5 text-[13px] text-hh-muted hover:text-hh-earth-dk"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Retour à mes colis
      </Link>

      {/* Suivi — en premier pour l’aperçu du statut */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Suivi du colis
          </h2>
          <ParcelStatusBadge status={parcel.status} />
        </div>
        {parcel.trackingEvents.length === 0 ? (
          <p className="text-[13px] text-hh-muted">
            {"Aucun événement enregistré pour l'instant."}
          </p>
        ) : (
          <TrackingTimeline events={parcel.trackingEvents} />
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
        <div>
          <span className="font-mono text-[13px] font-medium text-hh-saffron-dk">
            {parcel.trackingCode}
          </span>
          <h1 className="mt-1 text-[20px] font-medium text-hh-earth-dk">
            Colis pour {parcel.recipient.firstName} {parcel.recipient.lastName}
          </h1>
          <p className="mt-0.5 text-[13px] text-hh-muted">
            {parcel.recipient.city && `${parcel.recipient.city}, `}
            {countryLabelFr(parcel.recipient.country)}
            {parcel.recipient.phone && ` · ${parcel.recipient.phone}`}
          </p>
        </div>

        {/* Content summary */}
        {parcel.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-hh-sand-dk/15 pt-3">
            {parcel.items.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-hh-sand px-2.5 py-0.5 text-[12px] text-hh-earth-dk"
              >
                {item.quantity > 1 ? `${item.quantity}× ` : ""}
                {item.name}
              </span>
            ))}
          </div>
        )}

        {parcel.images.length > 0 && (
          <div className="border-t border-hh-sand-dk/15 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Photos
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {parcel.images.map((im) => (
                <a
                  key={im.id}
                  href={im.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-hh-sand-dk/20"
                >
                  <Image
                    src={im.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 25vw, 120px"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Parcel info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-hh-sand-dk/15 pt-3 text-[13px]">
          {parcel.weightKg != null && (
            <>
              <span className="text-hh-muted">Poids</span>
              <span className="text-hh-earth-dk">{parcel.weightKg} kg</span>
            </>
          )}
          {(parcel.lengthCm != null ||
            parcel.widthCm != null ||
            parcel.heightCm != null) && (
            <>
              <span className="text-hh-muted">Dimensions (L × l × H)</span>
              <span className="text-hh-earth-dk">
                {[
                  parcel.lengthCm ?? "—",
                  parcel.widthCm ?? "—",
                  parcel.heightCm ?? "—",
                ].join(" × ")}{" "}
                cm
              </span>
            </>
          )}
          {parcel.shipment && (
            <>
              <span className="text-hh-muted">Envoi</span>
              <span className="text-hh-earth-dk font-mono text-[12px]">
                {parcel.shipment.reference}
              </span>
            </>
          )}
          <span className="text-hh-muted">Déclaré le</span>
          <span className="text-hh-earth-dk">
            {format(new Date(parcel.createdAt), "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-hh-sand-dk/15 pt-3">
          <Link
            href={`/api/parcels/${parcel.id}/label`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-saffron bg-hh-saffron-lt px-4 text-[13px] font-medium text-hh-saffron-dk hover:bg-hh-saffron/10"
          >
            <Printer size={15} strokeWidth={1.5} />
            {"Imprimer l'étiquette"}
          </Link>
          <Link
            href={`/track/${parcel.trackingCode}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-sand-dk bg-white px-4 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand"
          >
            <Package size={15} strokeWidth={1.5} />
            Suivi public
          </Link>
        </div>
      </div>

      {/* Transitaire */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-medium text-hh-earth-dk">
          <Building2
            size={18}
            strokeWidth={1.5}
            className="text-hh-saffron-dk"
          />
          Transitaire
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {parcel.forwarder.logoUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-hh-sand-dk/20">
              <Image
                src={parcel.forwarder.logoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-medium text-hh-earth-dk">
              {parcel.forwarder.name}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-hh-muted">
              Code {parcel.forwarder.code5}
            </p>
            <p className="mt-1.5 text-[13px] text-hh-earth-dk">
              {parcel.forwarder.addressFormatted?.trim() ||
                [parcel.forwarder.address, parcel.forwarder.city]
                  .filter(Boolean)
                  .join(", ") ||
                `${parcel.forwarder.city}, ${countryLabelFr(parcel.forwarder.country)}`}
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-[13px] sm:flex-row sm:flex-wrap sm:gap-x-4">
              {parcel.forwarder.phone ? (
                <a
                  href={`tel:${parcel.forwarder.phone.replace(/\s/g, "")}`}
                  className="text-hh-saffron-dk hover:underline"
                >
                  {parcel.forwarder.phone}
                </a>
              ) : null}
              {parcel.forwarder.email ? (
                <a
                  href={`mailto:${parcel.forwarder.email}`}
                  className="text-hh-saffron-dk hover:underline"
                >
                  {parcel.forwarder.email}
                </a>
              ) : null}
            </div>
            {parcel.forwarder.description ? (
              <p className="mt-3 border-t border-hh-sand-dk/15 pt-3 text-[13px] leading-relaxed text-hh-muted">
                {parcel.forwarder.description}
              </p>
            ) : null}
            <Link
              href={`/p/${parcel.forwarder.code5}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-hh-saffron-dk hover:underline"
            >
              Voir la page du transitaire
              <ExternalLink size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-[var(--hh-radius-lg)] bg-white px-5 py-5 ring-1 ring-hh-sand-dk/20">
        <h2 className="mb-4 text-[15px] font-medium text-hh-earth-dk">
          QR code — remise au destinataire
        </h2>
        <ParcelQrCode trackingCode={parcel.trackingCode} />
        <p className="mt-3 text-center text-[11px] text-hh-muted">
          Le destinataire présente ce QR code lors du retrait.
        </p>
      </div>

      {/* Join shipment — only when parcel is not yet assigned */}
      {!parcel.shipmentId && (
        <JoinShipmentPanel
          parcelId={parcel.id}
          shipmentRequest={parcel.shipmentRequest ?? null}
          availableShipments={joinData.shipments}
          isLinkedToForwarder={joinData.isLinkedToForwarder}
          forwarderProfileHref={
            joinData.forwarderCode5 ? `/p/${joinData.forwarderCode5}` : null
          }
          forwarderName={joinData.forwarderName}
        />
      )}
    </div>
  );
}
