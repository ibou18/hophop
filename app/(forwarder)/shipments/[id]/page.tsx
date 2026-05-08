import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth } from "@/auth";
import {
  getAssignableParcels,
  getForwarderShipmentById,
  getShipmentRequests,
  getOtherShipments,
  isShipmentEditable,
} from "@/lib/forwarder-shipment-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { ShipmentParcelsAssignment } from "@/components/forwarder/shipment-parcels-assignment";
import { ShipmentPublishToggle } from "@/components/forwarder/shipment-publish-toggle";
import { ShipmentRequestsPanel } from "@/components/forwarder/shipment-requests-panel";
import { ShipmentShareBlock } from "@/components/forwarder/shipment-share-block";
import { ShipmentPricingEditor } from "@/components/forwarder/shipment-pricing-editor";
import { ShipmentBasicInfoEditor } from "@/components/forwarder/shipment-basic-info-editor";
import { ForwarderAddParcelButton } from "@/components/forwarder/forwarder-add-parcel-button";
import { ShipmentHero, type ShipmentHeroKpis } from "@/components/forwarder/shipment-hero";
import { ShipmentDetailTabs } from "@/components/forwarder/shipment-detail-tabs";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Envoi · ${id.slice(0, 8)}…` };
}

export default async function ForwarderShipmentDetailPage({ params }: Props) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { id } = await params;
  const shipment = await getForwarderShipmentById(forwarderId, id);
  if (!shipment) notFound();

  const [assignableParcels, requests, otherShipments] = await Promise.all([
    getAssignableParcels(forwarderId, {
      originCountry: shipment.originCountry,
      destinationCountry: shipment.destinationCountry,
      acceptsVehicles: shipment.acceptsVehicles,
    }),
    getShipmentRequests(forwarderId, id),
    getOtherShipments(forwarderId, id),
  ]);

  const editable = isShipmentEditable(shipment.status);
  const inShipmentRows = shipment.parcels.map((p) => ({
    id: p.id,
    trackingCode: p.trackingCode,
    client: {
      firstName: p.client.firstName,
      lastName: p.client.lastName,
      city: p.client.city,
      country: p.client.country,
    },
    recipient: p.recipient,
    vehicle: p.vehicle,
  }));

  // ─── KPIs synthétiques ───────────────────────────────────────────────────
  const kpis: ShipmentHeroKpis = (() => {
    let totalWeight = 0;
    let weightSamples = 0;
    let totalValue = 0;
    let valueSamples = 0;
    let paidCount = 0;
    let vehicleCount = 0;
    for (const p of shipment.parcels) {
      if (p.weightKg != null) {
        totalWeight += Number(p.weightKg);
        weightSamples++;
      }
      const v = p.calculatedPrice ?? p.price;
      if (v != null) {
        totalValue += Number(v);
        valueSamples++;
      }
      if (p.isPaid) paidCount++;
      if (p.vehicle) vehicleCount++;
    }
    return {
      parcelCount: shipment.parcels.length,
      vehicleCount,
      totalWeightKg: weightSamples > 0 ? totalWeight : null,
      totalValue: valueSamples > 0 ? totalValue : null,
      paidCount,
      pendingRequestsCount:
        requests?.filter((r) => r.status === "PENDING").length ?? 0,
    };
  })();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <ShipmentHero
        shipmentId={shipment.id}
        reference={shipment.reference}
        status={shipment.status}
        transportMode={shipment.transportMode}
        originCountry={shipment.originCountry}
        destinationCountry={shipment.destinationCountry}
        destinationCity={shipment.destinationCity}
        departureDate={shipment.departureDate}
        arrivalDate={shipment.arrivalDate}
        currency={shipment.currency}
        kpis={kpis}
        updatedAtIso={shipment.updatedAt.toISOString()}
      />

      <ShipmentDetailTabs
        parcelCount={shipment.parcels.length}
        pendingRequestsCount={kpis.pendingRequestsCount}
        parcelsContent={
          <>
            <ShipmentParcelsAssignment
              shipmentId={shipment.id}
              editable={editable}
              assignableParcels={assignableParcels}
              inShipmentParcels={inShipmentRows}
              routeSummary={`${countryLabelFr(shipment.originCountry)} → ${countryLabelFr(shipment.destinationCountry)}`}
              shipmentAcceptsVehicles={shipment.acceptsVehicles}
              forwarderCode5={shipment.forwarder.code5}
              shipmentReference={shipment.reference}
            />

            <section
              id="colis-du-lot"
              className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium text-hh-earth-dk">
                    Fiches colis ({shipment.parcels.length})
                  </h2>
                  <p className="mt-1 text-[13px] text-hh-muted">
                    Clique sur une ligne pour la fiche complète (contenu, photos,
                    contacts, historique).
                  </p>
                </div>
                <ForwarderAddParcelButton
                  shipmentId={shipment.id}
                  forwarderCode5={shipment.forwarder.code5}
                />
              </div>
              {shipment.parcels.length === 0 ? (
                <p className="mt-3 text-[14px] text-hh-muted">
                  Aucun colis pour l’instant. Utilise la zone d’assignation
                  ci-dessus ou ajoute un colis client.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-hh-sand-dk/15">
                  {shipment.parcels.map((p) => (
                    <li key={p.id} className="py-2 first:pt-0">
                      <Link
                        href={`/parcels/${p.id}?fromShipment=${shipment.id}`}
                        className="group flex flex-col gap-1 rounded-[var(--hh-radius-md)] px-2 py-2 transition-colors hover:bg-hh-sand/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-mono text-[14px] font-medium text-hh-saffron-dk group-hover:underline">
                            {p.trackingCode}
                          </span>
                          <p className="text-[13px] text-hh-muted">
                            {p.client.firstName} {p.client.lastName}
                            {" · "}
                            {p.recipient.city}, {p.recipient.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[12px] font-medium text-hh-earth-dk">
                            {parcelStatusLabelFr(p.status)}
                          </span>
                          <span className="hidden text-[12px] font-medium text-hh-saffron-dk group-hover:underline sm:inline">
                            Fiche →
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        }
        requestsContent={
          requests != null ? (
            <ShipmentRequestsPanel
              shipmentId={shipment.id}
              requests={requests}
              otherShipments={otherShipments}
            />
          ) : (
            <p className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 text-[13px] text-hh-muted shadow-sm">
              Aucune demande pour cet envoi.
            </p>
          )
        }
        pricingContent={
          <ShipmentPricingEditor
            shipmentId={shipment.id}
            editable={editable}
            isMaritime={shipment.transportMode === "SEA"}
            acceptsVehicles={shipment.acceptsVehicles}
            pricingType={shipment.pricingType}
            ratePerKg={shipment.ratePerKg}
            ratePerBox={shipment.ratePerBox}
            flatRate={shipment.flatRate}
            ratePerVolume={shipment.ratePerVolume}
            ratePerVehicle={shipment.ratePerVehicle}
            volumeDivisor={shipment.volumeDivisor}
            minimumCharge={shipment.minimumCharge}
            currency={shipment.currency}
            notifyClientsOnChange={shipment.parcels.length > 0}
          />
        }
        shareContent={
          <>
            <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
              <ShipmentPublishToggle
                shipmentId={shipment.id}
                isPublished={shipment.isPublished}
              />
            </section>
            <ShipmentShareBlock
              code5={shipment.forwarder.code5}
              shipmentId={shipment.id}
              reference={shipment.reference}
              originCountry={shipment.originCountry}
              destinationCountry={shipment.destinationCountry}
              forwarderName={shipment.forwarder.name}
              isPublished={shipment.isPublished}
              parcelCount={shipment.parcels.length}
              shipmentStatus={shipment.status}
            />
          </>
        }
        infoContent={
          <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
                Calendrier & notes
              </h2>
              <ShipmentBasicInfoEditor
                shipmentId={shipment.id}
                editable={editable}
                originCity={shipment.originCity}
                destinationCity={shipment.destinationCity}
                departureDate={shipment.departureDate}
                arrivalDate={shipment.arrivalDate}
                notes={shipment.notes}
                notifyClientsOnChange={shipment.parcels.length > 0}
              />
            </div>
            <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
              <dt className="text-hh-muted">Départ</dt>
              <dd className="text-hh-earth-dk">
                {shipment.departureDate
                  ? format(shipment.departureDate, "d MMM yyyy HH:mm", {
                      locale: fr,
                    })
                  : "—"}
              </dd>
              <dt className="text-hh-muted">Arrivée</dt>
              <dd className="text-hh-earth-dk">
                {shipment.arrivalDate
                  ? format(shipment.arrivalDate, "d MMM yyyy HH:mm", {
                      locale: fr,
                    })
                  : "—"}
              </dd>
              <dt className="text-hh-muted">Origine</dt>
              <dd className="text-hh-earth-dk">
                {shipment.originCity ? `${shipment.originCity}, ` : ""}
                {countryLabelFr(shipment.originCountry)}
              </dd>
              <dt className="text-hh-muted">Destination</dt>
              <dd className="text-hh-earth-dk">
                {shipment.destinationCity ? `${shipment.destinationCity}, ` : ""}
                {countryLabelFr(shipment.destinationCountry)}
              </dd>
            </dl>
            {shipment.notes ? (
              <>
                <h3 className="mt-4 text-[13px] font-medium uppercase tracking-wide text-hh-muted">
                  Notes
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-[14px] text-hh-earth-dk">
                  {shipment.notes}
                </p>
              </>
            ) : null}
          </section>
        }
      />
    </div>
  );
}
