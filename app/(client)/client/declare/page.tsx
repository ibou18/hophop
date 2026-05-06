import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ensureClientForwarderByCode5,
  getClientRecipients,
  getClientForwarders,
} from "@/lib/client-data";
import { clientJoinableShipmentWhere } from "@/lib/shipment-public-visibility";
import { DeclareParcelWizard } from "@/components/client/declare-parcel-wizard";
import type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";
import { DeclareVehicleForm } from "@/components/client/declare-vehicle-form";
import { DeclareModeToggle } from "@/components/client/declare-mode-toggle";

export const metadata: Metadata = { title: "Déclarer un colis" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const declarePath = q.toString() ? `/client/declare?${q.toString()}` : "/client/declare";
    redirect(`/login?callbackUrl=${encodeURIComponent(declarePath)}`);
  }
  const forwarderParam =
    typeof sp.forwarder === "string" ? sp.forwarder.trim() : "";
  const envoiParam = typeof sp.envoi === "string" ? sp.envoi.trim() : "";
  const modeParam = typeof sp.mode === "string" ? sp.mode.trim() : "";

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

  if (UUID_RE.test(envoiParam) && initialForwarderId) {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: envoiParam,
        forwarderId: initialForwarderId,
        isPublished: true,
      },
      select: {
        id: true,
        reference: true,
        originCountry: true,
        destinationCountry: true,
        destinationCity: true,
        departureDate: true,
        arrivalDate: true,
        transportMode: true,
        // Tarification propre au shipment
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
      },
    });
    if (shipment) {
      targetShipmentSummary = {
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
      };
      const stillJoinable = await prisma.shipment.findFirst({
        where: {
          id: envoiParam,
          forwarderId: initialForwarderId,
          ...clientJoinableShipmentWhere(),
        },
        select: { id: true },
      });
      if (stillJoinable) targetShipmentId = shipment.id;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-2 text-[28px] font-medium leading-tight text-hh-earth-dk">
        Déclarer un envoi
      </h1>
      <p className="mb-5 text-[15px] text-hh-muted">
        Colis classique ou véhicule — sélectionne le type ci-dessous.
      </p>
      <DeclareModeToggle
        initialMode={
          modeParam === "vehicle" && targetShipmentSummary?.acceptsVehicles
            ? "vehicle"
            : "parcel"
        }
        parcelContent={
          <DeclareParcelWizard
            recipients={recipients}
            forwarders={forwarders}
            initialForwarderId={initialForwarderId}
            targetShipmentId={targetShipmentId}
            targetShipmentSummary={targetShipmentSummary}
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
