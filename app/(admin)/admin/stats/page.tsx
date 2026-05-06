import { getAdminPlatformKpis, PARCEL_STATUS_LABELS, SHIPMENT_STATUS_LABELS } from "@/lib/admin-data";
import { ParcelStatus, ShipmentStatus } from "@/app/generated/prisma/enums";

export const metadata = { title: "Statistiques — Admin Hophop" };

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

function StatRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
      <div className={`size-3 shrink-0 rounded-full ${color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-slate-700">{label}</span>
          <span className="text-[14px] font-semibold text-slate-800">{value}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[11px] text-slate-400">{pct}% du total</p>
      </div>
    </div>
  );
}

export default async function AdminStatsPage() {
  const kpis = await getAdminPlatformKpis();

  const totalParcels = Object.values(kpis.parcelsByStatus).reduce((a, b) => a + b, 0);
  const totalShipments = Object.values(kpis.shipmentsByStatus).reduce((a, b) => a + b, 0);

  const parcelDeliveryRate = totalParcels > 0
    ? Math.round((kpis.parcelsByStatus.DELIVERED / totalParcels) * 100)
    : 0;
  const activeShipmentCount =
    (kpis.shipmentsByStatus.CONFIRMED ?? 0) + (kpis.shipmentsByStatus.IN_TRANSIT ?? 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-800">Statistiques</h1>
        <p className="mt-1 text-[15px] text-slate-500">Métriques globales de la plateforme</p>
      </div>

      {/* Métriques clés */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Taux de livraison",
            value: `${parcelDeliveryRate}%`,
            sub: `${kpis.parcelsByStatus.DELIVERED ?? 0} colis livrés`,
            bg: "bg-emerald-50",
            text: "text-emerald-700",
          },
          {
            label: "Envois actifs",
            value: activeShipmentCount,
            sub: "Confirmés + En transit",
            bg: "bg-amber-50",
            text: "text-amber-700",
          },
          {
            label: "Transitaires actifs",
            value: kpis.activeForwarders,
            sub: `sur ${kpis.totalForwarders} au total`,
            bg: "bg-violet-50",
            text: "text-violet-700",
          },
          {
            label: "Colis en cours",
            value: (kpis.parcelsByStatus.IN_TRANSIT ?? 0) + (kpis.parcelsByStatus.COLLECTED ?? 0),
            sub: "Collectés + En transit",
            bg: "bg-blue-50",
            text: "text-blue-700",
          },
        ].map(({ label, value, sub, bg, text }) => (
          <div key={label} className={`rounded-2xl ${bg} p-5 ring-1 ring-black/5`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-[30px] font-bold leading-none ${text}`}>{value}</p>
            <p className="mt-2 text-[12px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Distribution colis */}
      <section>
        <h2 className="mb-4 text-[18px] font-semibold text-slate-700">
          Distribution des colis
          <span className="ml-2 text-[14px] font-normal text-slate-400">({totalParcels} total)</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.values(ParcelStatus) as ParcelStatus[]).map((status) => (
            <StatRow
              key={status}
              label={PARCEL_STATUS_LABELS[status]}
              value={kpis.parcelsByStatus[status] ?? 0}
              total={totalParcels}
              color={PARCEL_STATUS_COLORS[status]}
            />
          ))}
        </div>
      </section>

      {/* Distribution envois */}
      <section>
        <h2 className="mb-4 text-[18px] font-semibold text-slate-700">
          Distribution des envois
          <span className="ml-2 text-[14px] font-normal text-slate-400">({totalShipments} total)</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.values(ShipmentStatus) as ShipmentStatus[]).map((status) => (
            <StatRow
              key={status}
              label={SHIPMENT_STATUS_LABELS[status]}
              value={kpis.shipmentsByStatus[status] ?? 0}
              total={totalShipments}
              color={SHIPMENT_STATUS_COLORS[status]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
