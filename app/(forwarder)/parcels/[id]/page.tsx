import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth } from "@/auth";
import type { ParcelStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getForwarderParcelById } from "@/lib/forwarder-dashboard-data";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { countryLabelFr } from "@/lib/country-label-fr";
import { itemCategoryLabelFr } from "@/lib/item-category-fr";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { ParcelStatusUpdater } from "@/components/forwarder/parcel-status-updater";
import { isForwarderPrivilegedRole } from "@/lib/parcel-status-workflow";
import { ForwarderParcelDecisionActions } from "@/components/forwarder/forwarder-parcel-decision-actions";
import { ParcelQrCode } from "@/components/client/parcel-qr-code";
import { ParcelStatusBadge } from "@/components/client/parcel-status-badge";
import { TrackingTimeline } from "@/components/client/tracking-timeline";
import { VehicleCard } from "@/components/vehicle-card";
import { ForwarderParcelDetailTabs } from "@/components/forwarder/forwarder-parcel-detail-tabs";
import type { Metadata } from "next";
import { ParcelPaymentToggle } from "@/components/forwarder/parcel-payment-toggle";
import { ArrowLeft, MapPin, Package, Printer } from "lucide-react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIMELINE_STEPS: { key: ParcelStatus; label: string }[] = [
  { key: "DECLARED", label: "Déclaré" },
  { key: "COLLECTED", label: "Collecté" },
  { key: "IN_TRANSIT", label: "Transit" },
  { key: "ARRIVED", label: "Arrivé" },
  { key: "READY", label: "Retrait" },
  { key: "DELIVERED", label: "Livré" },
];

const STATUS_STEP: Partial<Record<ParcelStatus, number>> = {
  DECLARED: 0,
  COLLECTED: 1,
  IN_TRANSIT: 2,
  ARRIVED: 3,
  READY: 4,
  DELIVERED: 5,
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromShipment?: string }>;
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--hh-radius-md)] bg-hh-sand/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-hh-muted">
        {label}
      </p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-hh-earth-dk">
        {value}
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Colis · ${id.slice(0, 8)}…` };
}

export default async function ForwarderParcelDetailPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  const { id } = await params;

  // `/parcels/[id]` est l’URL espace transitaire ; les clients ont `/client/parcels/[id]`.
  // Les liens partagés ou anciens mails peuvent pointer ici — on renvoie vers la bonne fiche.
  if (session?.user?.role === "CLIENT" && session.user.clientId) {
    redirect(`/client/parcels/${id}`);
  }

  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/parcels/${id}`)}`);
  }

  const sp = await searchParams;
  const fromShipmentParam =
    typeof sp.fromShipment === "string" ? sp.fromShipment.trim() : "";
  let backToShipment: { id: string; reference: string } | null = null;
  if (fromShipmentParam && UUID_RE.test(fromShipmentParam)) {
    const s = await prisma.shipment.findFirst({
      where: { id: fromShipmentParam, forwarderId },
      select: { id: true, reference: true },
    });
    if (s) backToShipment = s;
  }

  const parcel = await getForwarderParcelById(forwarderId, id);
  if (!parcel) notFound();
  const canCorrectAnyStatus = isForwarderPrivilegedRole(session.user.forwarderRole);
  const availableShipments = await prisma.shipment.findMany({
    where: {
      forwarderId,
      status: { in: ["DRAFT", "CONFIRMED"] },
    },
    orderBy: [{ departureDate: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      reference: true,
      destinationCountry: true,
    },
    take: 100,
  });
  const step = STATUS_STEP[parcel.status] ?? -1;
  const isIssue = parcel.status === "ISSUE";
  const backHref = backToShipment ? `/shipments/${backToShipment.id}` : "/parcels";
  const backLabel = backToShipment
    ? `Envoi ${backToShipment.reference}`
    : "Colis";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3">
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
          >
            <ArrowLeft size={13} strokeWidth={1.8} />
            {backLabel}
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[22px] font-medium tracking-tight text-hh-earth-dk sm:text-[24px]">
              {parcel.trackingCode}
            </span>
            <ParcelStatusBadge status={parcel.status} />
          </div>

          <p className="text-[13px] text-hh-muted">
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

          <p className="flex items-center gap-1.5 text-[13px] text-hh-muted">
            <MapPin size={13} strokeWidth={1.5} className="shrink-0" />
            <span className="text-hh-earth-dk">
              {parcel.recipient.firstName} {parcel.recipient.lastName}
            </span>
            <span className="text-hh-muted/70">·</span>
            <span className="text-hh-earth-dk">
              {parcel.recipient.city}, {countryLabelFr(parcel.recipient.country)}
            </span>
          </p>
        </div>

        {!isIssue ? (
          <div className="mt-5">
            <ol className="flex items-center gap-1">
              {TIMELINE_STEPS.map((s, i) => {
                const reached = i <= step;
                const current = i === step;
                return (
                  <li key={s.key} className="flex flex-1 items-center gap-1">
                    <div
                      className={[
                        "flex h-2 flex-1 rounded-full transition-colors",
                        reached ? "bg-hh-saffron" : "bg-hh-sand-dk/25",
                        current ? "ring-2 ring-hh-saffron/40 ring-offset-1" : "",
                      ].join(" ")}
                      aria-current={current ? "step" : undefined}
                      aria-label={s.label}
                    />
                  </li>
                );
              })}
            </ol>
            <ol className="mt-1.5 hidden grid-cols-6 text-center text-[10px] uppercase tracking-wide text-hh-muted sm:grid">
              {TIMELINE_STEPS.map((s, i) => (
                <li
                  key={s.key}
                  className={i === step ? "font-semibold text-hh-earth-dk" : ""}
                >
                  {s.label}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--hh-radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            Incident signalé sur colis. Mets à jour statut ou ajoute note de suivi.
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Kpi
            label="Contenu"
            value={
              parcel.items.length > 0
                ? `${parcel.items.length} article${parcel.items.length > 1 ? "s" : ""}`
                : "—"
            }
          />
          <Kpi label="Poids" value={parcel.weightKg != null ? `${parcel.weightKg} kg` : "—"} />
          <Kpi label="Envoi" value={parcel.shipment?.reference ?? "Non affecté"} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hh-sand-dk/15 pt-4">
          <Link
            href={`/api/parcels/${parcel.id}/label`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-saffron bg-hh-saffron-lt px-4 text-[13px] font-medium text-hh-saffron-dk hover:bg-hh-saffron/10"
          >
            <Printer size={14} strokeWidth={1.5} />
            Imprimer l&apos;étiquette
          </Link>
          <Link
            href={`/track/${parcel.trackingCode}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-sand-dk bg-white px-4 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand"
          >
            <Package size={14} strokeWidth={1.5} />
            Suivi public
          </Link>
        </div>
      </section>

      <ForwarderParcelDetailTabs
        trackingContent={
          <div className="flex flex-col gap-4">
            <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
              <h2 className="text-[15px] font-medium text-hh-earth-dk">Mettre à jour</h2>
              <p className="mt-1 text-[13px] text-hh-muted">
                Changement de statut journalisé et visible côté client.
              </p>
              <div className="mt-4">
                <ParcelStatusUpdater
                  key={`${parcel.id}-${parcel.status}-${parcel.updatedAt.toISOString()}`}
                  parcelId={parcel.id}
                  currentStatus={parcel.status}
                  canCorrectAnyStatus={canCorrectAnyStatus}
                />
              </div>
            </section>

            <ForwarderParcelDecisionActions
              parcelId={parcel.id}
              currentStatus={parcel.status}
              shipmentId={parcel.shipmentId}
              availableShipments={availableShipments}
            />

            <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
              <h2 className="text-[15px] font-medium text-hh-earth-dk">Historique</h2>
              <div className="mt-4">
                {parcel.trackingEvents.length === 0 ? (
                  <p className="text-[13px] text-hh-muted">
                    Aucun événement enregistré pour ce colis.
                  </p>
                ) : (
                  <TrackingTimeline events={parcel.trackingEvents} />
                )}
              </div>
            </section>
          </div>
        }
        detailsContent={
          <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            {parcel.vehicle && (
              <div className="mb-4 border-b border-hh-sand-dk/15 pb-4">
                <VehicleCard vehicle={parcel.vehicle} />
              </div>
            )}

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
              {parcel.price != null && (
                <>
                  <dt className="text-hh-muted">Prix</dt>
                  <dd className="text-hh-earth-dk">
                    {parcel.price} {CURRENCY_SYMBOL[parcel.currency]}
                  </dd>
                </>
              )}
            </dl>

            <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                Paiement
              </p>
              <ParcelPaymentToggle parcelId={parcel.id} isPaid={parcel.isPaid} />
            </div>

            {parcel.description ? (
              <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Description
                </p>
                <p className="text-[13px] text-hh-earth-dk">{parcel.description}</p>
              </div>
            ) : null}

            {parcel.items.length > 0 && (
              <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
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
                      <span className="text-hh-muted">
                        {" "}
                        · {itemCategoryLabelFr(item.category)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parcel.images.length > 0 && (
              <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
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

            {parcel.notes ? (
              <div className="mt-4 border-t border-hh-sand-dk/15 pt-4">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Notes internes
                </p>
                <p className="whitespace-pre-wrap text-[13px] text-hh-earth-dk">
                  {parcel.notes}
                </p>
              </div>
            ) : null}
          </div>
        }
        clientContent={
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
                {[parcel.client.city, countryLabelFr(parcel.client.country)]
                  .filter(Boolean)
                  .join(" · ")}
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
        }
        qrContent={
          <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[15px] font-medium text-hh-earth-dk">
              QR code — scan rapide
            </h2>
            <ParcelQrCode trackingCode={parcel.trackingCode} />
            <p className="mt-3 text-center text-[11px] text-hh-muted">
              Utilise QR code pour identifier colis au dépôt.
            </p>
          </section>
        }
      />
    </div>
  );
}
