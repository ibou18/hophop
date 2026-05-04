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
import { shipmentStatusLabelFr } from "@/lib/shipment-status-fr";
import { countryLabelFr } from "@/lib/country-label-fr";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { ShipmentDetailActions } from "@/components/forwarder/shipment-detail-actions";
import { ShipmentParcelsAssignment } from "@/components/forwarder/shipment-parcels-assignment";
import { ShipmentPublishToggle } from "@/components/forwarder/shipment-publish-toggle";
import { ShipmentRequestsPanel } from "@/components/forwarder/shipment-requests-panel";
import { ShipmentShareBlock } from "@/components/forwarder/shipment-share-block";
import { TransportModeBadge } from "@/components/transport-mode-selector";
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
  const [shipment, assignableParcels, requests, otherShipments] =
    await Promise.all([
      getForwarderShipmentById(forwarderId, id),
      getAssignableParcels(forwarderId),
      getShipmentRequests(forwarderId, id),
      getOtherShipments(forwarderId, id),
    ]);

  if (!shipment) notFound();

  const editable = isShipmentEditable(shipment.status);
  const inShipmentRows = shipment.parcels.map((p) => ({
    id: p.id,
    trackingCode: p.trackingCode,
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/shipments"
          className="text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          ← Envois
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[26px] font-medium tracking-tight text-hh-earth-dk">
            {shipment.reference}
          </h1>
          <TransportModeBadge mode={shipment.transportMode} />
        </div>
        <p className="mt-1 text-[14px] text-hh-muted">
          {shipmentStatusLabelFr(shipment.status)}
          {" · "}
          {countryLabelFr(shipment.originCountry)}
          {" → "}
          {countryLabelFr(shipment.destinationCountry)}
          {shipment.destinationCity
            ? ` · ${shipment.destinationCity}`
            : null}
        </p>
      </div>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
          Calendrier
        </h2>
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
        <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
          <ShipmentPublishToggle
            shipmentId={shipment.id}
            isPublished={shipment.isPublished}
          />
        </div>
      </section>

      <ShipmentShareBlock
        code5={shipment.forwarder.code5}
        shipmentId={shipment.id}
        reference={shipment.reference}
        originCountry={shipment.originCountry}
        destinationCountry={shipment.destinationCountry}
        forwarderName={shipment.forwarder.name}
        isPublished={shipment.isPublished}
      />

      <ShipmentDetailActions
        shipmentId={shipment.id}
        status={shipment.status}
        parcelCount={shipment.parcels.length}
        updatedAtIso={shipment.updatedAt.toISOString()}
      />

      <ShipmentParcelsAssignment
        shipmentId={shipment.id}
        editable={editable}
        assignableParcels={assignableParcels}
        inShipmentParcels={inShipmentRows}
      />

      {requests != null && (
        <ShipmentRequestsPanel
          shipmentId={shipment.id}
          requests={requests}
          otherShipments={otherShipments}
        />
      )}

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Colis du lot ({shipment.parcels.length})
        </h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Clique sur une ligne pour ouvrir la fiche complète (contenu, photos,
          contacts, historique).
        </p>
        {shipment.parcels.length === 0 ? (
          <p className="mt-3 text-[14px] text-hh-muted">
            Aucun colis pour l’instant. Utilise la section ci-dessus pour en
            ajouter.
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
                    <p className="mt-0.5 text-[11px] text-hh-saffron-dk/80 opacity-0 transition-opacity group-hover:opacity-100 sm:hidden">
                      Ouvrir la fiche colis →
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
    </div>
  );
}
