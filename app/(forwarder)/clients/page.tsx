import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getForwarderClients,
  parseCountryParam,
} from "@/lib/forwarder-client-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { ForwarderClientsTable } from "@/components/forwarder/forwarder-clients-table";
import { ClientsCountryFilter } from "@/components/forwarder/clients-country-filter";
import { InviteClientButton } from "@/components/forwarder/invite-client-button";

type PageProps = {
  searchParams?: Promise<{ country?: string }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const sp = (await searchParams) ?? {};
  const countryFilter = parseCountryParam(sp.country);
  const rows = await getForwarderClients(forwarderId, countryFilter);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-medium text-hh-earth-dk">Clients</h1>
          <p className="mt-2 text-[15px] text-hh-muted">
            Expéditeurs rattachés à ton compte — colis et destinataires.
          </p>
        </div>
        <InviteClientButton />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ClientsCountryFilter value={countryFilter ?? null} />
        {countryFilter ? (
          <Link
            href="/clients"
            className="rounded-lg border border-hh-sand-dk/40 px-3 py-2 text-[13px] font-medium text-hh-muted transition hover:bg-hh-sand"
          >
            Réinitialiser
          </Link>
        ) : null}
      </div>

      {countryFilter ? (
        <p className="text-[13px] text-hh-muted">
          Filtre :{" "}
          <span className="font-medium text-hh-earth-dk">
            {countryLabelFr(countryFilter)}
          </span>
        </p>
      ) : null}

      <ForwarderClientsTable rows={rows} />
    </div>
  );
}
