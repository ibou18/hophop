import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth } from "@/auth";
import { getForwarderParcelById } from "@/lib/forwarder-dashboard-data";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { countryLabelFr } from "@/lib/country-label-fr";
import { itemCategoryLabelFr } from "@/lib/item-category-fr";
import { trackingEventTypeLabelFr } from "@/lib/tracking-event-type-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { ParcelStatusUpdater } from "@/components/forwarder/parcel-status-updater";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Colis · ${id.slice(0, 8)}…` };
}

export default async function ForwarderParcelDetailPage({ params }: Props) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { id } = await params;
  const parcel = await getForwarderParcelById(forwarderId, id);
  if (!parcel) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/parcels"
          className="text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          ← Colis
        </Link>
        <h1 className="mt-3 font-mono text-[26px] font-medium tracking-tight text-hh-earth-dk">
          {parcel.trackingCode}
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          {parcelStatusLabelFr(parcel.status)}
          {parcel.shipment ? (
            <>
              {" · "}
              Envoi{" "}
              <span className="font-medium text-hh-earth-dk">
                {parcel.shipment.reference}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Mettre à jour
        </h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Le changement de statut est journalisé pour le client.
        </p>
        <div className="mt-4">
          <ParcelStatusUpdater
            key={`${parcel.id}-${parcel.status}-${parcel.updatedAt.toISOString()}`}
            parcelId={parcel.id}
            currentStatus={parcel.status}
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
            Expéditeur
          </h2>
          <p className="mt-2 text-[16px] font-medium text-hh-earth-dk">
            {parcel.client.firstName} {parcel.client.lastName}
          </p>
          {parcel.client.email ? (
            <p className="mt-1 text-[14px] text-hh-muted">{parcel.client.email}</p>
          ) : null}
          {parcel.client.phone ? (
            <p className="mt-0.5 text-[14px] text-hh-muted">{parcel.client.phone}</p>
          ) : null}
          <p className="mt-2 text-[13px] text-hh-muted">
            {[parcel.client.city, countryLabelFr(parcel.client.country)].filter(Boolean).join(" · ")}
          </p>
        </section>

        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
            Destinataire
          </h2>
          <p className="mt-2 text-[16px] font-medium text-hh-earth-dk">
            {parcel.recipient.firstName} {parcel.recipient.lastName}
          </p>
          <p className="mt-1 text-[14px] text-hh-muted">{parcel.recipient.phone}</p>
          <p className="mt-2 text-[13px] text-hh-earth-dk">
            {parcel.recipient.city}, {countryLabelFr(parcel.recipient.country)}
          </p>
          {parcel.recipient.address ? (
            <p className="mt-1 text-[13px] text-hh-muted">{parcel.recipient.address}</p>
          ) : null}
        </section>
      </div>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">Colis</h2>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          {parcel.weightKg != null ? (
            <>
              <dt className="text-hh-muted">Poids</dt>
              <dd className="text-hh-earth-dk">{parcel.weightKg} kg</dd>
            </>
          ) : null}
          {parcel.description ? (
            <>
              <dt className="text-hh-muted sm:col-span-1">Description</dt>
              <dd className="text-hh-earth-dk sm:col-span-1">{parcel.description}</dd>
            </>
          ) : null}
          {parcel.price != null ? (
            <>
              <dt className="text-hh-muted">Prix</dt>
              <dd className="text-hh-earth-dk">
                {parcel.price} {CURRENCY_SYMBOL[parcel.currency]}
              </dd>
            </>
          ) : null}
          <dt className="text-hh-muted">Payé</dt>
          <dd className="text-hh-earth-dk">{parcel.isPaid ? "Oui" : "Non"}</dd>
        </dl>

        {parcel.items.length > 0 ? (
          <>
            <h3 className="mt-5 text-[13px] font-medium uppercase tracking-wide text-hh-muted">
              Contenu
            </h3>
            <ul className="mt-2 space-y-1.5 text-[14px] text-hh-earth-dk">
              {parcel.items.map((it) => (
                <li key={it.id}>
                  {it.name}{" "}
                  <span className="text-hh-muted">
                    ×{it.quantity} · {itemCategoryLabelFr(it.category)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {parcel.trackingEvents.length > 0 ? (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Historique
          </h2>
          <ul className="mt-4 space-y-3 border-l border-hh-sand-dk/40 pl-4">
            {parcel.trackingEvents.map((ev) => (
              <li key={ev.id} className="relative text-[13px] text-hh-earth-dk">
                <span
                  className={cn(
                    "absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-2 ring-white",
                    ev.actor === "FORWARDER"
                      ? "bg-hh-saffron"
                      : ev.actor === "CLIENT"
                        ? "bg-hh-savane"
                        : "bg-hh-muted",
                  )}
                />
                <span className="font-medium">{trackingEventTypeLabelFr(ev.type)}</span>
                {ev.location ? (
                  <span className="text-hh-muted"> · {ev.location}</span>
                ) : null}
                {ev.note ? (
                  <p className="mt-0.5 text-[12px] text-hh-muted">{ev.note}</p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-hh-muted">
                  {format(ev.createdAt, "d MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
