import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth } from "@/auth";
import { getForwarderClientById } from "@/lib/forwarder-client-data";
import { countryLabelFr } from "@/lib/country-label-fr";
import { authMethodLabelFr } from "@/lib/auth-method-fr";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Client · ${id.slice(0, 8)}…` };
}

export default async function ForwarderClientDetailPage({ params }: Props) {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { id } = await params;
  const client = await getForwarderClientById(forwarderId, id);
  if (!client) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/clients"
          className="text-[13px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
        >
          ← Clients
        </Link>
        <h1 className="mt-3 text-[28px] font-medium text-hh-earth-dk">
          {client.firstName} {client.lastName}
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          {authMethodLabelFr(client.authMethod)}
          {" · "}
          Inscrit le{" "}
          {format(client.createdAt, "d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
          Coordonnées
        </h2>
        <dl className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          {client.email ? (
            <>
              <dt className="text-hh-muted">E-mail</dt>
              <dd className="text-hh-earth-dk">{client.email}</dd>
            </>
          ) : null}
          {client.phone ? (
            <>
              <dt className="text-hh-muted">Téléphone</dt>
              <dd className="text-hh-earth-dk">{client.phone}</dd>
            </>
          ) : null}
          <dt className="text-hh-muted">Pays</dt>
          <dd className="text-hh-earth-dk">{countryLabelFr(client.country)}</dd>
          {client.city ? (
            <>
              <dt className="text-hh-muted">Ville</dt>
              <dd className="text-hh-earth-dk">{client.city}</dd>
            </>
          ) : null}
          {client.address ? (
            <>
              <dt className="text-hh-muted sm:col-span-1">Adresse</dt>
              <dd className="whitespace-pre-wrap sm:col-span-1 text-hh-earth-dk">
                {client.address}
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-hh-sand p-4 ring-1 ring-hh-sand-dk/15">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Colis
          </p>
          <p className="mt-1 text-[22px] font-medium text-hh-saffron-dk">
            {client._count.parcels}
          </p>
        </div>
        <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-hh-sand p-4 ring-1 ring-hh-sand-dk/15">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Destinataires
          </p>
          <p className="mt-1 text-[22px] font-medium text-hh-saffron-dk">
            {client._count.recipients}
          </p>
        </div>
      </div>

      {client.recipients.length > 0 ? (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-medium text-hh-earth-dk">
            Destinataires
          </h2>
          <ul className="mt-4 divide-y divide-hh-sand-dk/15">
            {client.recipients.map((r) => (
              <li key={r.id} className="py-3 first:pt-0">
                <p className="text-[14px] font-medium text-hh-earth-dk">
                  {r.firstName} {r.lastName}
                  {r.isDefault ? (
                    <span className="ml-2 text-[11px] font-normal text-hh-saffron-dk">
                      (par défaut)
                    </span>
                  ) : null}
                </p>
                <p className="text-[13px] text-hh-muted">{r.phone}</p>
                <p className="text-[13px] text-hh-earth-dk">
                  {r.city}, {countryLabelFr(r.country)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Colis récents
        </h2>
        {client.parcels.length === 0 ? (
          <p className="mt-3 text-[14px] text-hh-muted">
            Aucun colis déclaré pour l’instant.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hh-sand-dk/15">
            {client.parcels.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/parcels/${p.id}`}
                  className="font-mono text-[14px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline"
                >
                  {p.trackingCode}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-hh-muted">
                  <span>{parcelStatusLabelFr(p.status)}</span>
                  <span>
                    {format(p.createdAt, "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
