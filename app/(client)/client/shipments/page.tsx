import Link from "next/link";
import type { Metadata } from "next";
import { Plane } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getPublishedShipmentsCatalog } from "@/lib/client-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { shipmentStatusLabelFr } from "@/lib/shipment-status-fr";

export const metadata: Metadata = {
  title: "Envois publics",
  description: "Départs publiés par les transitaires sur Hophop",
};

export default async function ClientShipmentsCatalogPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const rows = await getPublishedShipmentsCatalog();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Envois publics
        </h1>
        <p className="mt-1.5 text-[15px] text-hh-muted">
          Tous les départs ouverts publiés par les transitaires. Ouvre une fiche
          pour rejoindre un transitaire ou associer un colis à un envoi.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-12 text-center">
          <Plane
            className="mx-auto mb-3 size-8 text-hh-sand-dk"
            strokeWidth={1.25}
          />
          <p className="text-[14px] font-medium text-hh-earth-dk">
            Aucun envoi ouvert pour le moment
          </p>
          <p className="mt-1 text-[13px] text-hh-muted">
            Reviens plus tard ou contacte directement un transitaire.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/client/declare?forwarder=${row.forwarder.code5}&envoi=${row.id}&mode=${row.acceptsVehicles ? "vehicle" : "parcel"}`}
                className="block rounded-[var(--hh-radius-lg)] bg-white px-4 py-4 ring-1 ring-hh-sand-dk/20 transition hover:ring-hh-saffron/35"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-hh-earth-dk">
                      {row.forwarder.name}
                      <span className="text-hh-muted"> · </span>
                      <span className="font-mono text-[12px] text-hh-muted">
                        {row.forwarder.code5}
                      </span>
                    </p>
                    <p className="mt-1 font-mono text-[14px] text-hh-saffron-dk">
                      {row.reference}
                    </p>
                  </div>
                  <span className="rounded-[var(--hh-radius-md)] bg-hh-sand px-2 py-0.5 text-[11px] text-hh-earth-dk">
                    {shipmentStatusLabelFr(row.status)}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-hh-earth-dk">
                  {countryLabelFr(row.originCountry)}
                  <span className="text-hh-muted"> → </span>
                  {countryLabelFr(row.destinationCountry)}
                  {row.destinationCity ? ` · ${row.destinationCity}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-hh-muted">
                  <span>
                    Départ{" "}
                    {row.departureDate
                      ? format(row.departureDate, "d MMM yyyy", { locale: fr })
                      : "à confirmer"}
                  </span>
                  <span>{row._count.parcels} colis</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
