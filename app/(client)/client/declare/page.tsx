import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ensureClientForwarderByCode5,
  getClientRecipients,
  getClientForwarders,
  getPublishedShipmentsCatalog,
} from "@/lib/client-data";
import { clientJoinableShipmentWhere } from "@/lib/shipment-public-visibility";
import { DeclareParcelWizard } from "@/components/client/declare-parcel-wizard";
import type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";
import { DeclareVehicleForm } from "@/components/client/declare-vehicle-form";
import { DeclareModeToggle, type DeclareFlowMode } from "@/components/client/declare-mode-toggle";
import { DeclareTieredParcelForm } from "@/components/client/declare-tiered-parcel-form";
import { ShipmentsCatalog } from "@/components/client/shipments-catalog";
import { Package } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Déclarer un colis" };

/** UUID v1–v5 (évite les faux négatifs d’un filtre trop strict). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SHIPMENT_DECLARE_SELECT = {
  id: true,
  forwarderId: true,
  reference: true,
  originCountry: true,
  destinationCountry: true,
  destinationCity: true,
  departureDate: true,
  arrivalDate: true,
  transportMode: true,
  pricingType: true,
  ratePerKg: true,
  ratePerBox: true,
  flatRate: true,
  ratePerVolume: true,
  volumeDivisor: true,
  minimumCharge: true,
  currency: true,
  ratePerVehicle: true,
  acceptsVehicles: true,
  acceptsDrums: true,
  rateDrumSmall: true,
  rateDrumMedium: true,
  rateDrumLarge: true,
  acceptsSizedCartons: true,
  rateCartonSmall: true,
  rateCartonMedium: true,
  rateCartonLarge: true,
} as const;

type ShipmentDeclareRow = {
  id: string;
  forwarderId: string;
  reference: string;
  originCountry: TargetShipmentSummary["originCountry"];
  destinationCountry: TargetShipmentSummary["destinationCountry"];
  destinationCity: string | null;
  departureDate: Date | null;
  arrivalDate: Date | null;
  transportMode: NonNullable<TargetShipmentSummary["transportMode"]>;
  pricingType: TargetShipmentSummary["pricingType"];
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: NonNullable<TargetShipmentSummary["currency"]>;
  ratePerVehicle: number | null;
  acceptsVehicles: boolean;
  acceptsDrums: boolean;
  rateDrumSmall: number | null;
  rateDrumMedium: number | null;
  rateDrumLarge: number | null;
  acceptsSizedCartons: boolean;
  rateCartonSmall: number | null;
  rateCartonMedium: number | null;
  rateCartonLarge: number | null;
};

function shipmentRowToSummary(shipment: ShipmentDeclareRow): TargetShipmentSummary {
  return {
    reference: shipment.reference,
    originCountry: shipment.originCountry,
    destinationCountry: shipment.destinationCountry,
    destinationCity: shipment.destinationCity,
    departureDate: shipment.departureDate?.toISOString() ?? null,
    arrivalDate: shipment.arrivalDate?.toISOString() ?? null,
    transportMode: shipment.transportMode,
    pricingType: shipment.pricingType,
    ratePerKg: shipment.ratePerKg,
    ratePerBox: shipment.ratePerBox,
    flatRate: shipment.flatRate,
    ratePerVolume: shipment.ratePerVolume,
    ratePerVehicle: shipment.ratePerVehicle,
    volumeDivisor: shipment.volumeDivisor,
    minimumCharge: shipment.minimumCharge,
    currency: shipment.currency,
    acceptsVehicles: shipment.acceptsVehicles,
    acceptsDrums: shipment.acceptsDrums,
    rateDrumSmall: shipment.rateDrumSmall,
    rateDrumMedium: shipment.rateDrumMedium,
    rateDrumLarge: shipment.rateDrumLarge,
    acceptsSizedCartons: shipment.acceptsSizedCartons,
    rateCartonSmall: shipment.rateCartonSmall,
    rateCartonMedium: shipment.rateCartonMedium,
    rateCartonLarge: shipment.rateCartonLarge,
  };
}

type PageProps = {
  searchParams: Promise<{ forwarder?: string; envoi?: string; mode?: string }>;
};

export default async function DeclarePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    const q = new URLSearchParams();
    if (typeof sp.forwarder === "string" && sp.forwarder.trim()) {
      q.set("forwarder", sp.forwarder.trim());
    }
    if (typeof sp.envoi === "string" && sp.envoi.trim()) {
      q.set("envoi", sp.envoi.trim());
    }
    if (typeof sp.mode === "string" && sp.mode.trim()) {
      q.set("mode", sp.mode.trim());
    }
    const declarePath = q.toString() ? `/client/declare?${q.toString()}` : "/client/declare";
    redirect(`/login?callbackUrl=${encodeURIComponent(declarePath)}`);
  }
  const forwarderParam =
    typeof sp.forwarder === "string" ? sp.forwarder.trim() : "";
  const envoiParam = typeof sp.envoi === "string" ? sp.envoi.trim() : "";
  const modeParam = typeof sp.mode === "string" ? sp.mode.trim().toLowerCase() : "";

  // Pas d'envoi ciblé → afficher le catalogue pour choisir d'abord
  if (!envoiParam) {
    const rows = await getPublishedShipmentsCatalog();
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-hh-saffron">
            Étape 1 sur 2
          </p>
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Choisir un envoi
          </h1>
          <p className="mt-1.5 text-[15px] text-hh-muted">
            Sélectionne l&apos;envoi : colis par palier (carton ou fût maritime), ou véhicule si
            proposé. Les détails se remplissent à l&apos;étape suivante.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-14 text-center">
            <Package
              className="mx-auto mb-3 size-8 text-hh-sand-dk"
              strokeWidth={1.25}
            />
            <p className="text-[14px] font-medium text-hh-earth-dk">
              Aucun envoi ouvert pour le moment
            </p>
            <p className="mt-1 text-[13px] text-hh-muted">
              Reviens plus tard ou fais une demande — un transitaire te contactera.
            </p>
            <Link
              href="/client/parcel-requests/new"
              className="mt-5 inline-block rounded-xl bg-hh-saffron px-5 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Faire une demande de colis
            </Link>
          </div>
        ) : (
          <>
            <ShipmentsCatalog rows={rows} filterCode5={forwarderParam || undefined} />
            <div className="mt-6 rounded-2xl border border-hh-sand-dk/20 bg-white px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <p className="text-[14px] font-semibold text-hh-earth-dk">
                  Aucun envoi ne vous convient ?
                </p>
                <p className="mt-0.5 text-[13px] text-hh-muted">
                  Faites une demande de colis — les transitaires sur votre route vous enverront une offre.
                </p>
              </div>
              <Link
                href="/client/parcel-requests/new"
                className="shrink-0 rounded-xl border border-hh-saffron px-5 py-2.5 text-[13px] font-semibold text-hh-saffron hover:bg-hh-saffron hover:text-white transition-colors"
              >
                Faire une demande
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  let initialForwarderId: string | undefined;
  if (forwarderParam) {
    const ensured = await ensureClientForwarderByCode5(clientId, forwarderParam);
    if (ensured) initialForwarderId = ensured.forwarderId;
  }

  const [recipients, forwarders] = await Promise.all([
    getClientRecipients(clientId),
    getClientForwarders(clientId),
  ]);

  let targetShipmentId: string | undefined;
  let targetShipmentSummary: TargetShipmentSummary | undefined;

  if (UUID_RE.test(envoiParam)) {
    let row: ShipmentDeclareRow | null = null;

    if (initialForwarderId) {
      row = await prisma.shipment.findFirst({
        where: {
          id: envoiParam,
          forwarderId: initialForwarderId,
          isPublished: true,
        },
        select: SHIPMENT_DECLARE_SELECT,
      });
    }

    if (!row) {
      const fallback = await prisma.shipment.findFirst({
        where: {
          id: envoiParam,
          isPublished: true,
          forwarder: {
            isActive: true,
            clients: { some: { clientId } },
          },
        },
        select: SHIPMENT_DECLARE_SELECT,
      });
      if (fallback) {
        row = fallback as ShipmentDeclareRow;
        initialForwarderId = fallback.forwarderId;
      }
    }

    if (row) {
      targetShipmentSummary = shipmentRowToSummary(row);
      const stillJoinable = await prisma.shipment.findFirst({
        where: {
          id: envoiParam,
          forwarderId: row.forwarderId,
          ...clientJoinableShipmentWhere(),
        },
        select: { id: true },
      });
      if (stillJoinable) targetShipmentId = row.id;
    }
  }

  const acceptsTiered =
    !!targetShipmentId &&
    ((targetShipmentSummary?.acceptsSizedCartons ?? false) ||
      ((targetShipmentSummary?.acceptsDrums ?? false) &&
        targetShipmentSummary?.transportMode === "SEA"));

  /** Colis « dimensions / contenu détaillé » uniquement si l’envoi ne propose pas le palier. */
  const showClassicParcelTab = !acceptsTiered;
  const showTieredParcelTab = acceptsTiered;
  const showVehicleTab = targetShipmentSummary?.acceptsVehicles ?? true;

  let initialDeclareMode: DeclareFlowMode = "parcel";
  if (modeParam === "vehicle" && showVehicleTab) {
    initialDeclareMode = "vehicle";
  } else if (
    (modeParam === "carton" ||
      modeParam === "drum" ||
      modeParam === "tiered" ||
      modeParam === "palier") &&
    showTieredParcelTab
  ) {
    initialDeclareMode = "tiered";
  } else if (showTieredParcelTab) {
    initialDeclareMode = "tiered";
  }

  const tieredInitialKind =
    modeParam === "drum" &&
    targetShipmentSummary?.acceptsDrums &&
    targetShipmentSummary.transportMode === "SEA"
      ? ("drum" as const)
      : ("carton" as const);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-hh-saffron">
        Étape 2 sur 2
      </p>
      <h1 className="mb-2 text-[28px] font-medium leading-tight text-hh-earth-dk">
        Déclarer un envoi
      </h1>
      <p className="mb-5 text-[15px] text-hh-muted">
        {(() => {
          if (showTieredParcelTab && showVehicleTab) {
            return "Colis par palier (carton ou fût selon l’envoi) ou véhicule — choisis le mode ci-dessous.";
          }
          if (showTieredParcelTab) {
            return "Indique la taille de palier (petit, moyen, grand) et le type carton ou fût si les deux sont proposés.";
          }
          if (showVehicleTab) {
            return "Colis classique ou véhicule — sélectionne le type ci-dessous.";
          }
          return "Remplis les informations de ton colis ci-dessous.";
        })()}
      </p>
      <DeclareModeToggle
        showClassicParcelTab={showClassicParcelTab}
        showVehicleTab={showVehicleTab}
        showTieredParcelTab={showTieredParcelTab}
        initialMode={initialDeclareMode}
        parcelContent={
          <DeclareParcelWizard
            recipients={recipients}
            forwarders={forwarders}
            initialForwarderId={initialForwarderId}
            targetShipmentId={targetShipmentId}
            targetShipmentSummary={targetShipmentSummary}
          />
        }
        tieredParcelContent={
          <DeclareTieredParcelForm
            recipients={recipients}
            forwarders={forwarders}
            initialForwarderId={initialForwarderId}
            targetShipmentId={targetShipmentId}
            targetShipmentSummary={targetShipmentSummary}
            initialKind={tieredInitialKind}
          />
        }
        vehicleContent={
          <DeclareVehicleForm
            recipients={recipients}
            forwarders={forwarders}
            initialForwarderId={initialForwarderId}
            targetShipmentId={targetShipmentId}
            targetShipmentSummary={targetShipmentSummary}
          />
        }
      />
    </div>
  );
}
