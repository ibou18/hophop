import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getForwarderProfile } from "@/lib/forwarder-settings-data";
import {
  ForwarderSettingsForm,
  type ForwarderProfileDTO,
} from "@/components/forwarder/forwarder-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const profile = await getForwarderProfile(forwarderId);
  if (!profile) {
    redirect("/login");
  }

  const dto: ForwarderProfileDTO = {
    id: profile.id,
    code5: profile.code5,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    city: profile.city,
    address: profile.address,
    logoUrl: profile.logoUrl,
    description: profile.description,
    paymentEnabled: profile.paymentEnabled,
    stripeAccountId: profile.stripeAccountId,
    updatedAt: profile.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-medium text-hh-earth-dk">Paramètres</h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Profil transitaire, logo et options de paiement en ligne.
        </p>
      </div>
      <ForwarderSettingsForm profile={dto} />
    </div>
  );
}
