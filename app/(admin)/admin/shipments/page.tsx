import { getAdminShipments, SHIPMENT_STATUS_LABELS, TRANSPORT_MODE_LABELS } from "@/lib/admin-data";
import { ShipmentStatus } from "@/app/generated/prisma/enums";
import Link from "next/link";

export const metadata = { title: "Envois — Admin Hophop" };

const STATUS_TABS: { value: ShipmentStatus | "ALL"; label: string }[] = [
  { value: "ALL",                        label: "Tous" },
  { value: ShipmentStatus.CONFIRMED,     label: "Confirmés" },
  { value: ShipmentStatus.IN_TRANSIT,    label: "En transit" },
  { value: ShipmentStatus.ARRIVED,       label: "Arrivés" },
  { value: ShipmentStatus.DRAFT,         label: "Brouillons" },
  { value: ShipmentStatus.CLOSED,        label: "Clôturés" },
];

const STATUS_DOT: Record<ShipmentStatus, string> = {
  DRAFT:      "bg-slate-300",
  CONFIRMED:  "bg-blue-400",
  IN_TRANSIT: "bg-amber-400",
  ARRIVED:    "bg-violet-400",
  CLOSED:     "bg-emerald-400",
};

const UPCOMING_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.CONFIRMED,
  ShipmentStatus.IN_TRANSIT,
];

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const rawStatus = sp?.status as ShipmentStatus | undefined;
  const statusFilter = rawStatus && Object.values(ShipmentStatus).includes(rawStatus)
    ? rawStatus
    : undefined;

  const shipments = await getAdminShipments(statusFilter);

  const upcoming = shipments.filter(
    (s) =>
      UPCOMING_STATUSES.includes(s.status) &&
      s.departureDate &&
      new Date(s.departureDate) >= new Date(),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-800">Envois</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          {shipments.length} envoi{shipments.length !== 1 ? "s" : ""}
          {upcoming.length > 0 && (
            <> · <span className="font-medium text-amber-600">{upcoming.length} à venir</span></>
          )}
        </p>
      </div>

      {/* Prochains envois */}
      {!statusFilter && upcoming.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200/60">
          <h2 className="mb-3 text-[14px] font-semibold text-amber-800">Prochains départs</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-amber-100">
                <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[s.status]}`} />
                <div className="min-w-0 flex-1">
                  <span className="truncate text-[13px] font-semibold text-slate-800">{s.reference}</span>
                  <span className="ml-2 text-[12px] text-slate-400">
                    {TRANSPORT_MODE_LABELS[s.transportMode] ?? s.transportMode}
                    {" · "}
                    {s.originCountry} → {s.destinationCountry}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-medium text-slate-700">
                    {s.departureDate
                      ? new Date(s.departureDate).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short",
                        })
                      : "—"}
                  </p>
                  <p className="text-[11px] text-slate-400">{s._count.parcels} colis · {s.forwarder.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(({ value, label }) => {
          const active = value === "ALL" ? !statusFilter : statusFilter === value;
          const href = value === "ALL" ? "/admin/shipments" : `/admin/shipments?status=${value}`;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Référence</span>
          <span className="text-right">Transitaire</span>
          <span className="text-right">Mode</span>
          <span className="text-right">Départ</span>
          <span className="text-right">Statut / Colis</span>
        </div>

        <div className="divide-y divide-slate-100">
          {shipments.length === 0 && (
            <p className="px-6 py-8 text-center text-[14px] text-slate-400">Aucun envoi.</p>
          )}
          {shipments.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[s.status]}`} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-slate-800">{s.reference}</p>
                  <p className="text-[12px] text-slate-400">
                    {s.originCountry} → {s.destinationCountry}
                  </p>
                </div>
              </div>
              <span className="text-right text-[13px] text-slate-600">{s.forwarder.name}</span>
              <span className="text-right text-[12px] text-slate-500">
                {TRANSPORT_MODE_LABELS[s.transportMode] ?? s.transportMode}
              </span>
              <span className="text-right text-[13px] text-slate-600">
                {s.departureDate
                  ? new Date(s.departureDate).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "2-digit",
                    })
                  : "—"}
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-medium text-slate-600">
                  {SHIPMENT_STATUS_LABELS[s.status]}
                </span>
                <span className="text-[11px] text-slate-400">{s._count.parcels} colis</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
