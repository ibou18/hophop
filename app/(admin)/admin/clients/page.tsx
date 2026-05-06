import { getAdminClients } from "@/lib/admin-data";
import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";

export const metadata = { title: "Clients — Admin Hophop" };

export default async function AdminClientsPage() {
  const clients = await getAdminClients();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-800">Clients</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Client</span>
          <span className="text-right">Contact</span>
          <span className="text-right">Colis</span>
          <span className="text-right">Statut</span>
        </div>

        <div className="divide-y divide-slate-100">
          {clients.length === 0 && (
            <p className="px-6 py-8 text-center text-[14px] text-slate-400">Aucun client.</p>
          )}
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-700">
                  {c.firstName.slice(0, 1)}{c.lastName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-slate-800">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="truncate text-[12px] text-slate-400">
                    {c.city ?? "—"}
                    {c.country ? ` · ${c.country}` : ""}
                    {c.forwarders.length > 0 && (
                      <> · {c.forwarders.map((f: { forwarder: { name: string } }) => f.forwarder.name).join(", ")}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {c.email && (
                  <span className="flex items-center gap-1 text-[12px] text-slate-500">
                    <Mail className="size-3 text-slate-400" />
                    <span className="max-w-[140px] truncate">{c.email}</span>
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1 text-[12px] text-slate-500">
                    <Phone className="size-3 text-slate-400" />
                    {c.phone}
                  </span>
                )}
              </div>

              <span className="text-right text-[14px] font-medium text-slate-600">
                {c._count.parcels}
              </span>

              <div className="flex items-center justify-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>
                  {c.isActive ? "Actif" : "Inactif"}
                </span>
                <ChevronRight className="size-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
