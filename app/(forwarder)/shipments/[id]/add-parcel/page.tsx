import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getForwarderShipmentById } from "@/lib/forwarder-shipment-data";
import { AddParcelWizard, type WizardShipmentPricing } from "@/components/forwarder/add-parcel-wizard";
import { countryLabelFr } from "@/lib/country-label-fr";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ajouter un colis · Envoi ${id.slice(0, 8)}…` };
}

export default async function AddParcelPage({ params }: Props) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { id } = await params;
  const shipment = await getForwarderShipmentById(forwarderId, id);
  if (!shipment) notFound();

  const backUrl = `/shipments/${id}`;

  const shipmentPricing: WizardShipmentPricing | null = shipment.pricingType
    ? {
        pricingType: shipment.pricingType,
        ratePerKg: shipment.ratePerKg,
        ratePerBox: shipment.ratePerBox,
        flatRate: shipment.flatRate,
        ratePerVolume: shipment.ratePerVolume,
        ratePerVehicle: shipment.ratePerVehicle,
        volumeDivisor: shipment.volumeDivisor,
        minimumCharge: shipment.minimumCharge,
        currency: shipment.currency,
        destinationCountry: shipment.destinationCountry,
        transportMode: shipment.transportMode,
      }
    : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Retour à l&apos;envoi
        </Link>
        <h1 className="mt-3 text-[26px] font-medium text-hh-earth-dk">
          Ajouter un colis client
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          Envoi{" "}
          <span className="font-mono font-medium text-hh-earth-dk/80">
            {shipment.reference}
          </span>{" "}
          · {countryLabelFr(shipment.originCountry)} →{" "}
          {countryLabelFr(shipment.destinationCountry)}
        </p>
      </div>

      <AddParcelWizard
        shipmentId={shipment.id}
        forwarderCode5={shipment.forwarder.code5}
        backUrl={backUrl}
        shipmentPricing={shipmentPricing}
      />
    </div>
  );
}
