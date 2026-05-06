import { getAdminForwarders } from "@/lib/admin-data";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

export const metadata = { title: "Transitaires — Admin Hophop" };

export default async function AdminForwardersPage() {
  const forwarders = await getAdminForwarders();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-800">Transitaires</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          {forwarders.length} agence{forwarders.length !== 1 ? "s" : ""} enregistrée{forwarders.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Agence</span>
          <span className="text-right">Clients</span>
          <span className="text-right">Colis</span>
          <span className="text-right">Envois</span>
          <span className="text-right">Statut</span>
        </div>

        <div className="divide-y divide-slate-100">
          {forwarders.length === 0 && (
            <p className="px-6 py-8 text-center text-[14px] text-slate-400">Aucun transitaire.</p>
          )}
          {forwarders.map((fw) => (
            <Link
              key={fw.id}
              href={`/admin/forwarders/${fw.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[12px] font-bold text-violet-700">
                  {fw.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-slate-800">{fw.name}</p>
                  <p className="truncate text-[12px] text-slate-400">
                    {fw.code5} · {fw.email}
                  </p>
                </div>
              </div>
              <span className="text-right text-[14px] font-medium text-slate-600">
                {fw._count.clients}
              </span>
              <span className="text-right text-[14px] font-medium text-slate-600">
                {fw._count.parcels}
              </span>
              <span className="text-right text-[14px] font-medium text-slate-600">
                {fw._count.shipments}
              </span>
              <div className="flex items-center justify-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  fw.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}>
                  {fw.isActive ? "Actif" : "Inactif"}
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
