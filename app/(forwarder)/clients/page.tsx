import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getForwarderClients,
  parseCountryParam,
} from "@/lib/forwarder-client-data";
import { countryLabelFr, COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { ForwarderClientsTable } from "@/components/forwarder/forwarder-clients-table";
import { cn } from "@/lib/utils";

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
      <div>
        <h1 className="text-[32px] font-medium text-hh-earth-dk">Clients</h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Expéditeurs rattachés à ton compte — colis et destinataires.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
          Pays
        </span>
        <Link
          href="/clients"
          className={cn(
            "rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors",
            !countryFilter
              ? "bg-hh-saffron/20 text-hh-earth-dk ring-hh-saffron/40"
              : "bg-white text-hh-muted ring-hh-sand-dk/30 hover:bg-hh-sand",
          )}
        >
          Tous
        </Link>
        {COUNTRY_OPTIONS.map((o) => (
          <Link
            key={o.value}
            href={`/clients?country=${o.value}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors",
              countryFilter === o.value
                ? "bg-hh-saffron/20 text-hh-earth-dk ring-hh-saffron/40"
                : "bg-white text-hh-muted ring-hh-sand-dk/30 hover:bg-hh-sand",
            )}
          >
            {o.label}
          </Link>
        ))}
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
