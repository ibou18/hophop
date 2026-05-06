import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAdminForwarderById,
  PARCEL_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from "@/lib/admin-data";
import { ArrowLeft, ExternalLink, Mail, Package, Truck, Users } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { forwarder } = await getAdminForwarderById(id);
  return { title: forwarder ? `${forwarder.name} — Admin` : "Transitaire — Admin" };
}

export default async function AdminForwarderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { forwarder, recentShipments, recentParcels } = await getAdminForwarderById(id);

  if (!forwarder) notFound();

  const PARCEL_STATUS_DOT: Record<string, string> = {
    DECLARED:   "bg-slate-400",
    COLLECTED:  "bg-blue-400",
    IN_TRANSIT: "bg-amber-400",
    ARRIVED:    "bg-violet-400",
    READY:      "bg-cyan-400",
    DELIVERED:  "bg-emerald-400",
    ISSUE:      "bg-red-400",
  };

  const SHIPMENT_STATUS_DOT: Record<string, string> = {
    DRAFT:      "bg-slate-300",
    CONFIRMED:  "bg-blue-400",
    IN_TRANSIT: "bg-amber-400",
    ARRIVED:    "bg-violet-400",
    CLOSED:     "bg-emerald-400",
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/forwarders"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4 text-slate-600" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold text-slate-800">{forwarder.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              forwarder.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {forwarder.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-slate-500">
            Code : <strong className="text-slate-700">{forwarder.code5}</strong>
            {forwarder.city && forwarder.country && (
              <> · {forwarder.city}, {forwarder.country}</>
            )}
          </p>
        </div>
        <Link
          href={`/p/${forwarder.code5}`}
          target="_blank"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink className="size-3.5" />
          Page publique
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clients",          value: forwarder._count.clients,      icon: Users,    color: "bg-blue-50 text-blue-600" },
          { label: "Colis",            value: forwarder._count.parcels,      icon: Package,  color: "bg-amber-50 text-amber-600" },
          { label: "Envois",           value: forwarder._count.shipments,    icon: Truck,    color: "bg-violet-50 text-violet-600" },
          { label: "Membres équipe",   value: forwarder._count.members, icon: Users,  color: "bg-emerald-50 text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-[22px] font-semibold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contact info */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-4 text-[15px] font-semibold text-slate-700">Informations</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-700">
              <Mail className="size-3.5 text-slate-400" />
              {forwarder.email}
            </dd>
          </div>
          {forwarder.phone && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Téléphone</dt>
              <dd className="mt-0.5 text-[14px] text-slate-700">{forwarder.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Créé le</dt>
            <dd className="mt-0.5 text-[14px] text-slate-700">
              {new Date(forwarder.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Mis à jour</dt>
            <dd className="mt-0.5 text-[14px] text-slate-700">
              {new Date(forwarder.updatedAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Derniers envois + derniers colis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Envois */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-[15px] font-semibold text-slate-700">Derniers envois</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentShipments.length === 0 && (
              <p className="px-5 py-5 text-[13px] text-slate-400">Aucun envoi.</p>
            )}
            {recentShipments.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`size-2 shrink-0 rounded-full ${SHIPMENT_STATUS_DOT[s.status] ?? "bg-slate-300"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-700">{s.reference}</p>
                  <p className="text-[11px] text-slate-400">
                    {TRANSPORT_MODE_LABELS[s.transportMode] ?? s.transportMode}
                    {s.departureDate && (
                      <> · {new Date(s.departureDate).toLocaleDateString("fr-FR")}</>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{SHIPMENT_STATUS_LABELS[s.status]}</p>
                  <p className="text-[11px] text-slate-500">{s._count.parcels} colis</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colis récents */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-[15px] font-semibold text-slate-700">Derniers colis</h2>
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
                  {p.client && (
                    <p className="text-[11px] text-slate-400">
                      {p.client.firstName} {p.client.lastName}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{PARCEL_STATUS_LABELS[p.status]}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
