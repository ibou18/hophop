import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getClientRecipients } from "@/lib/client-data";
import { NewParcelRequestForm } from "@/components/client/new-parcel-request-form";

export const metadata: Metadata = { title: "Nouvelle demande de colis — Hophop" };

export default async function NewParcelRequestPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const recipients = await getClientRecipients(clientId);

  if (recipients.length === 0) {
    redirect("/client/recipients/new?next=/client/parcel-requests/new");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Nouvelle demande de colis
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          Décrivez votre colis. Les transitaires disponibles sur votre route vous feront une offre de prix.
        </p>
      </div>
      <NewParcelRequestForm recipients={recipients} />
    </div>
  );
}
