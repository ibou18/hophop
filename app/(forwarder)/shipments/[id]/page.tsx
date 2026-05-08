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
import { ShipmentParcelsAssignment } from "@/components/forwarder/shipment-parcels-assignment";
import { ShipmentPublishToggle } from "@/components/forwarder/shipment-publish-toggle";
import { ShipmentRequestsPanel } from "@/components/forwarder/shipment-requests-panel";
import { ShipmentShareBlock } from "@/components/forwarder/shipment-share-block";
import { ShipmentPricingEditor } from "@/components/forwarder/shipment-pricing-editor";
import { ShipmentBasicInfoEditor } from "@/components/forwarder/shipment-basic-info-editor";
import { ForwarderAddParcelButton } from "@/components/forwarder/forwarder-add-parcel-button";
import { ShipmentHero, type ShipmentHeroKpis } from "@/components/forwarder/shipment-hero";
import { ShipmentDetailTabs } from "@/components/forwarder/shipment-detail-tabs";
import {
  ShipmentParcelsRichList,
  type RichParcelRow,
} from "@/components/forwarder/shipment-parcels-rich-list";
import { CollapsibleSection } from "@/components/forwarder/collapsible-section";
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

  const richParcelRows: RichParcelRow[] = shipment.parcels.map((p) => ({
    id: p.id,
    trackingCode: p.trackingCode,
    status: p.status,
    weightKg: p.weightKg != null ? Number(p.weightKg) : null,
    price: p.price != null ? Number(p.price) : null,
    calculatedPrice: p.calculatedPrice != null ? Number(p.calculatedPrice) : null,
    currency: p.currency,
    isPaid: p.isPaid,
    client: {
      firstName: p.client.firstName,
      lastName: p.client.lastName,
      city: p.client.city,
      country: p.client.country,
    },
    recipient: { city: p.recipient.city, country: p.recipient.country },
    vehicle: p.vehicle,
  }));

  const canCorrectAnyStatus =
    session.user.forwarderRole === "OWNER" || session.user.forwarderRole === "ADMIN";

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
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium text-hh-earth-dk">
                    Fiches colis
                  </h2>
                  <p className="mt-1 text-[13px] text-hh-muted">
                    Recherche, filtre, et action en masse. Clique sur le code
                    pour ouvrir la fiche.
                  </p>
                </div>
                <ForwarderAddParcelButton
                  shipmentId={shipment.id}
                  forwarderCode5={shipment.forwarder.code5}
                />
              </div>
              <ShipmentParcelsRichList
                shipmentId={shipment.id}
                parcels={richParcelRows}
                canCorrectAnyStatus={canCorrectAnyStatus}
              />
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
          <CollapsibleSection
            title="Tarification"
            description="Configure les règles de prix appliquées aux colis de cet envoi."
            defaultOpen
            badge={
              shipment.pricingType ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                  Configurée
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Non configurée
                </span>
              )
            }
          >
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
          </CollapsibleSection>
        }
        shareContent={
          <>
            <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
              <ShipmentPublishToggle
                shipmentId={shipment.id}
                isPublished={shipment.isPublished}
              />
            </section>
            <CollapsibleSection
              title="Partager cet envoi"
              description="Lien public, QR code, suppression du brouillon."
              defaultOpen
            >
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
            </CollapsibleSection>
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
