import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminClientById, PARCEL_STATUS_LABELS } from "@/lib/admin-data";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await getAdminClientById(id);
  return {
    title: client
      ? `${client.firstName} ${client.lastName} — Admin`
      : "Client — Admin",
  };
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, recentParcels } = await getAdminClientById(id);

  if (!client) notFound();

  const PARCEL_STATUS_DOT: Record<string, string> = {
    DECLARED:   "bg-slate-400",
    COLLECTED:  "bg-blue-400",
    IN_TRANSIT: "bg-amber-400",
    ARRIVED:    "bg-violet-400",
    READY:      "bg-cyan-400",
    DELIVERED:  "bg-emerald-400",
    ISSUE:      "bg-red-400",
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/clients"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4 text-slate-600" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold text-slate-800">
              {client.firstName} {client.lastName}
            </h1>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              client.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {client.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-slate-500">
            {[client.city, client.country].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Colis</p>
          <p className="mt-1 text-[26px] font-semibold text-slate-800">{client._count.parcels}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Transitaires</p>
          <p className="mt-1 text-[26px] font-semibold text-slate-800">{client.forwarders.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Inscrit le</p>
          <p className="mt-1 text-[14px] font-semibold text-slate-800">
            {new Date(client.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Infos contact */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-4 text-[15px] font-semibold text-slate-700">Contact</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {client.email && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-700">
                <Mail className="size-3.5 text-slate-400" />
                {client.email}
              </dd>
            </div>
          )}
          {client.phone && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Téléphone</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-700">
                <Phone className="size-3.5 text-slate-400" />
                {client.phone}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Transitaires associés */}
      {client.forwarders.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-4 text-[15px] font-semibold text-slate-700">Transitaires</h2>
          <div className="flex flex-wrap gap-2">
            {client.forwarders.map(({ forwarder: fw }: { forwarder: { id: string; name: string; code5: string } }) => (
              <Link
                key={fw.id}
                href={`/admin/forwarders/${fw.id}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              >
                <Building2 className="size-3.5 text-slate-400" />
                {fw.name}
                <span className="text-[11px] text-slate-400">({fw.code5})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Historique colis */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-[15px] font-semibold text-slate-700">
            Historique des colis ({recentParcels.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentParcels.length === 0 && (
            <p className="px-5 py-5 text-[13px] text-slate-400">Aucun colis.</p>
          )}
          {recentParcels.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className={`size-2 shrink-0 rounded-full ${PARCEL_STATUS_DOT[p.status] ?? "bg-slate-300"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] font-medium text-slate-700">
                  {p.trackingCode}
                </p>
                {p.forwarder && (
                  <p className="text-[11px] text-slate-400">{p.forwarder.name}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-500">{PARCEL_STATUS_LABELS[p.status]}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
