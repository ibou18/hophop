import { getAdminPlatformKpis, PARCEL_STATUS_LABELS, SHIPMENT_STATUS_LABELS } from "@/lib/admin-data";
import { ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";
import Link from "next/link";
import { Building2, Package, Truck, Users } from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "violet",
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent?: "violet" | "blue" | "emerald" | "amber";
}) {
  const colors = {
    violet: "text-violet-600 bg-violet-50",
    blue:   "text-blue-600 bg-blue-50",
    emerald:"text-emerald-600 bg-emerald-50",
    amber:  "text-amber-600 bg-amber-50",
  };
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors[accent]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-[28px] font-semibold leading-none text-slate-800">{value}</p>
        {sub && <p className="mt-1.5 text-[12px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

const PARCEL_STATUS_COLORS: Record<ParcelStatus, string> = {
  DECLARED:   "bg-slate-400",
  COLLECTED:  "bg-blue-400",
  IN_TRANSIT: "bg-amber-400",
  ARRIVED:    "bg-violet-400",
  READY:      "bg-cyan-400",
  DELIVERED:  "bg-emerald-400",
  ISSUE:      "bg-red-400",
};

const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  DRAFT:      "bg-slate-300",
  CONFIRMED:  "bg-blue-400",
  IN_TRANSIT: "bg-amber-400",
  ARRIVED:    "bg-violet-400",
  CLOSED:     "bg-emerald-400",
};

function BarChart({
  data,
  colors,
  labels,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
  labels: Record<string, string>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2.5">
      {Object.entries(data).map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-[12px] text-slate-500">{labels[key] ?? key}</span>
          <div className="flex flex-1 items-center gap-2">
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${colors[key] ?? "bg-slate-300"} transition-all`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold text-slate-700">{count}</span>
          </div>
        </div>
      ))}
      {total > 0 && (
        <p className="pt-1 text-right text-[11px] text-slate-400">Total : {total}</p>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const kpis = await getAdminPlatformKpis();

  const forwarderRate = kpis.totalForwarders > 0
    ? Math.round((kpis.activeForwarders / kpis.totalForwarders) * 100)
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* En-tête */}
      <div>
        <h1 className="text-[30px] font-semibold leading-tight text-slate-800">
          Vue d'ensemble
        </h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Statistiques globales de la plateforme Hophop
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Transitaires"
          value={kpis.totalForwarders}
          sub={`${kpis.activeForwarders} actifs (${forwarderRate}%)`}
          icon={Building2}
          accent="violet"
        />
        <StatCard
          label="Clients"
          value={kpis.totalClients}
          sub="Expéditeurs enregistrés"
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Colis total"
          value={kpis.totalParcels}
          sub="Toutes agences confondues"
          icon={Package}
          accent="amber"
        />
        <StatCard
          label="Envois total"
          value={kpis.totalShipments}
          sub="Tous statuts"
          icon={Truck}
          accent="emerald"
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-5 text-[16px] font-semibold text-slate-700">Colis par statut</h2>
          <BarChart
            data={kpis.parcelsByStatus as Record<string, number>}
            colors={PARCEL_STATUS_COLORS as Record<string, string>}
            labels={PARCEL_STATUS_LABELS as Record<string, string>}
          />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-5 text-[16px] font-semibold text-slate-700">Envois par statut</h2>
          <BarChart
            data={kpis.shipmentsByStatus as Record<string, number>}
            colors={SHIPMENT_STATUS_COLORS as Record<string, string>}
            labels={SHIPMENT_STATUS_LABELS as Record<string, string>}
          />
        </div>
      </div>

      {/* Derniers transitaires */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[16px] font-semibold text-slate-700">Derniers transitaires inscrits</h2>
          <Link
            href="/admin/forwarders"
            className="text-[13px] font-medium text-violet-600 underline-offset-2 hover:underline"
          >
            Voir tous →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {kpis.recentForwarders.length === 0 && (
            <p className="px-6 py-6 text-[14px] text-slate-400">Aucun transitaire.</p>
          )}
          {kpis.recentForwarders.map((fw) => (
            <Link
              key={fw.id}
              href={`/admin/forwarders/${fw.id}`}
              className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-600">
                {fw.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-slate-800">{fw.name}</p>
                <p className="truncate text-[12px] text-slate-400">{fw.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <div className="text-[12px] text-slate-400">
                  <span className="font-medium text-slate-600">{fw._count.clients}</span> clients
                  &nbsp;·&nbsp;
                  <span className="font-medium text-slate-600">{fw._count.parcels}</span> colis
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  fw.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}>
                  {fw.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Liens rapides */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/forwarders", label: "Gérer les transitaires", icon: Building2, color: "text-violet-600 bg-violet-50 hover:bg-violet-100" },
          { href: "/admin/clients",    label: "Gérer les clients",      icon: Users,     color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { href: "/admin/shipments",  label: "Tous les envois",        icon: Truck,     color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl p-4 font-medium transition ${color}`}
          >
            <Icon className="size-5 shrink-0" />
            <span className="text-[14px]">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
