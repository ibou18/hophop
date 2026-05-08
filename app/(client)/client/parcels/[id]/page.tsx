import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ExternalLink } from "lucide-react";
import {
  getClientParcelDetail,
  getParcelShipmentJoinData,
} from "@/lib/client-data";
import { ParcelHero } from "@/components/client/parcel-hero";
import { ParcelDetailTabs } from "@/components/client/parcel-detail-tabs";
import { TrackingTimeline } from "@/components/client/tracking-timeline";
import { ParcelQrCode } from "@/components/client/parcel-qr-code";
import { JoinShipmentPanel } from "@/components/client/join-shipment-panel";
import { VehicleCard } from "@/components/vehicle-card";
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

  const hasJoinPanel = !parcel.shipmentId;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <ParcelHero
        parcelId={parcel.id}
        trackingCode={parcel.trackingCode}
        status={parcel.status}
        recipientFirstName={parcel.recipient.firstName}
        recipientLastName={parcel.recipient.lastName}
        recipientCity={parcel.recipient.city}
        recipientCountry={parcel.recipient.country}
        itemCount={parcel.items.length}
        weightKg={parcel.weightKg != null ? Number(parcel.weightKg) : null}
        shipmentReference={parcel.shipment?.reference ?? null}
      />

      <ParcelDetailTabs
        hasJoinPanel={hasJoinPanel}
        trackingContent={
          <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            {parcel.trackingEvents.length === 0 ? (
              <p className="text-[13px] text-hh-muted">
                {"Aucun événement enregistré pour l'instant."}
              </p>
            ) : (
              <TrackingTimeline events={parcel.trackingEvents} />
            )}
          </div>
        }
        detailsContent={
          <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            {/* Vehicle */}
            {parcel.vehicle && (
              <div className="mb-4 pb-4 border-b border-hh-sand-dk/15">
                <VehicleCard vehicle={parcel.vehicle} />
              </div>
            )}

            {/* Items */}
            {parcel.items.length > 0 && (
              <div className="mb-4 pb-4 border-b border-hh-sand-dk/15">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Contenu
                </p>
                <div className="flex flex-wrap gap-1.5">
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
              </div>
            )}

            {/* Photos */}
            {parcel.images.length > 0 && (
              <div className="mb-4 pb-4 border-b border-hh-sand-dk/15">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Photos
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
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

            {/* Parcel metrics */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
              {parcel.weightKg != null && (
                <>
                  <dt className="text-hh-muted">Poids</dt>
                  <dd className="text-hh-earth-dk">{parcel.weightKg} kg</dd>
                </>
              )}
              {(parcel.lengthCm != null ||
                parcel.widthCm != null ||
                parcel.heightCm != null) && (
                <>
                  <dt className="text-hh-muted">Dimensions (L × l × H)</dt>
                  <dd className="text-hh-earth-dk">
                    {[
                      parcel.lengthCm ?? "—",
                      parcel.widthCm ?? "—",
                      parcel.heightCm ?? "—",
                    ].join(" × ")}{" "}
                    cm
                  </dd>
                </>
              )}
              {parcel.shipment && (
                <>
                  <dt className="text-hh-muted">Envoi</dt>
                  <dd className="font-mono text-[12px] text-hh-earth-dk">
                    {parcel.shipment.reference}
                  </dd>
                </>
              )}
              <dt className="text-hh-muted">Déclaré le</dt>
              <dd className="text-hh-earth-dk">
                {format(new Date(parcel.createdAt), "d MMM yyyy", { locale: fr })}
              </dd>
            </dl>
          </div>
        }
        forwarderContent={
          <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
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
        }
        qrContent={
          <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[15px] font-medium text-hh-earth-dk">
              QR code — remise au destinataire
            </h2>
            <ParcelQrCode trackingCode={parcel.trackingCode} />
            <p className="mt-3 text-center text-[11px] text-hh-muted">
              Le destinataire présente ce QR code lors du retrait.
            </p>
          </div>
        }
        joinContent={
          hasJoinPanel ? (
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
          ) : null
        }
      />
    </div>
  );
}
