import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getClientRecipients, getClientForwarders } from "@/lib/client-data";
import { DeclareParcelWizard } from "@/components/client/declare-parcel-wizard";

export const metadata: Metadata = { title: "Déclarer un colis" };

export default async function DeclarePage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const [recipients, forwarders] = await Promise.all([
    getClientRecipients(clientId),
    getClientForwarders(clientId),
  ]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-6 text-[28px] font-medium leading-tight text-hh-earth-dk">
        Déclarer un colis
      </h1>
      <DeclareParcelWizard recipients={recipients} forwarders={forwarders} />
    </div>
  );
}
