import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewShipmentForm } from "@/components/forwarder/new-shipment-form";
import { isoDateUtcToday } from "@/lib/iso-date-utc";

export default async function NewShipmentPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "FORWARDER") {
    redirect("/login");
  }

  const departureDateDefault = isoDateUtcToday();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/shipments"
          className="text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          ← Envois
        </Link>
        <h1 className="mt-3 text-[32px] font-medium text-hh-earth-dk">
          Nouvel envoi
        </h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Crée un lot vide (brouillon), puis affecte-y des colis au statut «
          Collecté » depuis la fiche envoi.
        </p>
      </div>
      <NewShipmentForm defaultDepartureDate={departureDateDefault} />
    </div>
  );
}
