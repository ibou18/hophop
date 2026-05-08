"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Car,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react";
import type { Country, ParcelStatus } from "@/app/generated/prisma/enums";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { ALL_PARCEL_STATUSES_ORDERED, staffMayTransition } from "@/lib/parcel-status-workflow";
import { cn } from "@/lib/utils";

export type RichParcelRow = {
  id: string;
  trackingCode: string;
  status: ParcelStatus;
  weightKg: number | null;
  price: number | null;
  calculatedPrice: number | null;
  currency: string;
  isPaid: boolean;
  client: {
    firstName: string;
    lastName: string;
    city: string | null;
    country: Country;
  };
  recipient: { city: string; country: Country };
  vehicle: { id: string; make: string; model: string; year: number } | null;
};

type PaymentFilter = "all" | "paid" | "unpaid";

const STATUS_PILL: Record<ParcelStatus, string> = {
  DECLARED: "bg-hh-sand-dk/30 text-hh-earth-dk",
  COLLECTED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-hh-saffron-lt text-hh-saffron-dk",
  ARRIVED: "bg-hh-earth-lt text-hh-earth-dk",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-hh-savane-lt text-hh-savane-dk",
  ISSUE: "bg-hh-kola-lt text-hh-kola-dk",
};

export function ShipmentParcelsRichList({
  shipmentId,
  parcels,
  canCorrectAnyStatus = false,
}: {
  shipmentId: string;
  parcels: RichParcelRow[];
  canCorrectAnyStatus?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ParcelStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parcels.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (paymentFilter === "paid" && !p.isPaid) return false;
      if (paymentFilter === "unpaid" && p.isPaid) return false;
      if (q) {
        const haystack = [
          p.trackingCode,
          p.client.firstName,
          p.client.lastName,
          p.client.city ?? "",
          p.recipient.city,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [parcels, query, statusFilter, paymentFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelected((s) => {
        const n = new Set(s);
        for (const p of filtered) n.delete(p.id);
        return n;
      });
    } else {
      setSelected((s) => {
        const n = new Set(s);
        for (const p of filtered) n.add(p.id);
        return n;
      });
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  /** Statuts applicables en bulk : intersection des transitions valides pour TOUS les colis sélectionnés. */
  const bulkSelectableStatuses = useMemo(() => {
    if (selected.size === 0) return [] as ParcelStatus[];
    const selectedRows = parcels.filter((p) => selected.has(p.id));
    return ALL_PARCEL_STATUSES_ORDERED.filter((target) =>
      selectedRows.every((p) =>
        canCorrectAnyStatus ? true : staffMayTransition(p.status, target),
      ),
    );
  }, [selected, parcels, canCorrectAnyStatus]);

  async function applyBulkStatus(next: ParcelStatus): Promise<void> {
    const ids = [...selected];
    if (ids.length === 0) return;
    const loadingId = toast.loading(
      `Mise à jour de ${ids.length} colis en « ${parcelStatusLabelFr(next)} »…`,
    );
    startTransition(async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`/api/parcels/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ status: next }),
            }).then(async (r) => ({
              ok: r.ok,
              error: r.ok ? null : ((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? null,
            })),
          ),
        );
        toast.dismiss(loadingId);
        const okCount = results.filter((r) => r.ok).length;
        const koCount = results.length - okCount;
        if (okCount > 0) {
          toast.success(`${okCount} colis mis à jour ✓`, {
            ...(koCount > 0
              ? { description: `${koCount} échec${koCount > 1 ? "s" : ""}.` }
              : {}),
          });
        }
        if (okCount === 0 && koCount > 0) {
          toast.error("Aucun colis n'a pu être mis à jour.");
        }
        clearSelection();
        router.refresh();
      } catch {
        toast.dismiss(loadingId);
        toast.error("Erreur réseau.");
      }
    });
  }

  if (parcels.length === 0) {
    return (
      <p className="rounded-[var(--hh-radius-md)] bg-hh-sand/40 px-4 py-6 text-center text-[13px] text-hh-muted">
        Aucun colis dans cet envoi pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={13}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hh-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tracking, client, ville…"
            className="h-9 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white pl-9 pr-3 text-[13px] placeholder:text-hh-muted focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
          />
          {query ? (
            <button
              type="button"
              aria-label="Effacer"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-hh-muted hover:bg-hh-sand-dk/20"
            >
              <X size={12} strokeWidth={2} />
            </button>
          ) : null}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | ParcelStatus)}
          className="h-9 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-2 text-[13px] focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
        >
          <option value="all">Tous statuts</option>
          {ALL_PARCEL_STATUSES_ORDERED.map((s) => (
            <option key={s} value={s}>
              {parcelStatusLabelFr(s)}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
          className="h-9 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-2 text-[13px] focus:border-hh-saffron focus:outline-none focus:ring-2 focus:ring-hh-saffron/20"
        >
          <option value="all">Tous paiements</option>
          <option value="paid">Payés</option>
          <option value="unpaid">Impayés</option>
        </select>
      </div>

      {/* Result counter / bulk action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-hh-muted">
        <span>
          {filtered.length} / {parcels.length} colis
          {selected.size > 0 ? ` · ${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : ""}
        </span>
        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <BulkStatusMenu
              disabled={pending}
              selectableStatuses={bulkSelectableStatuses}
              onPick={(s) => void applyBulkStatus(s)}
            />
            <button
              type="button"
              onClick={clearSelection}
              className="text-[12px] text-hh-muted underline-offset-2 hover:underline"
            >
              Désélectionner
            </button>
          </div>
        ) : null}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="rounded-[var(--hh-radius-md)] bg-hh-sand/40 px-4 py-6 text-center text-[13px] text-hh-muted">
          Aucun colis ne correspond aux filtres.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--hh-radius-md)] ring-1 ring-hh-sand-dk/20">
          {/* Header row (desktop) */}
          <div className="hidden items-center gap-2 border-b border-hh-sand-dk/15 bg-hh-sand/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-hh-muted sm:flex">
            <button
              type="button"
              onClick={toggleAllFiltered}
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                allFilteredSelected
                  ? "border-hh-saffron bg-hh-saffron text-white"
                  : "border-hh-sand-dk/50 bg-white hover:border-hh-saffron",
              )}
              aria-label={allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
            >
              {allFilteredSelected ? <Check size={11} strokeWidth={3} /> : null}
            </button>
            <span className="w-24">Tracking</span>
            <span className="flex-1">Client → Destinataire</span>
            <span className="w-20 text-right">Poids / Prix</span>
            <span className="w-28 text-center">Statut</span>
            <span className="w-16 text-center">Paiement</span>
            <span className="w-12" />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-hh-sand-dk/15 bg-white">
            {filtered.map((p) => (
              <ParcelRow
                key={p.id}
                shipmentId={shipmentId}
                parcel={p}
                checked={selected.has(p.id)}
                onToggle={() => toggleOne(p.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ParcelRow({
  shipmentId,
  parcel: p,
  checked,
  onToggle,
}: {
  shipmentId: string;
  parcel: RichParcelRow;
  checked: boolean;
  onToggle: () => void;
}) {
  const value = p.calculatedPrice ?? p.price;

  return (
    <li>
      <div
        className={cn(
          "flex flex-col gap-2 px-3 py-2.5 transition-colors sm:flex-row sm:items-center",
          checked ? "bg-hh-saffron-lt/40" : "hover:bg-hh-sand/30",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors self-start",
            checked
              ? "border-hh-saffron bg-hh-saffron text-white"
              : "border-hh-sand-dk/50 bg-white hover:border-hh-saffron",
          )}
          aria-label={checked ? "Désélectionner" : "Sélectionner"}
        >
          {checked ? <Check size={11} strokeWidth={3} /> : null}
        </button>

        {/* Tracking + type icon */}
        <div className="flex shrink-0 items-center gap-1.5 sm:w-24">
          {p.vehicle ? (
            <Car size={13} className="shrink-0 text-indigo-600" strokeWidth={2} />
          ) : (
            <Package size={13} className="shrink-0 text-hh-muted" strokeWidth={2} />
          )}
          <Link
            href={`/parcels/${p.id}?fromShipment=${shipmentId}`}
            className="font-mono text-[13px] font-medium text-hh-saffron-dk hover:underline"
          >
            {p.trackingCode}
          </Link>
        </div>

        {/* People */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-hh-earth-dk">
            <span className="font-medium">
              {p.client.firstName} {p.client.lastName}
            </span>
            <span className="mx-1 text-hh-muted">→</span>
            <span className="text-hh-muted">
              {p.recipient.city}
            </span>
          </p>
          {p.vehicle ? (
            <p className="truncate text-[11px] text-indigo-700/80">
              {p.vehicle.year} {p.vehicle.make} {p.vehicle.model}
            </p>
          ) : null}
        </div>

        {/* Weight / Price */}
        <div className="shrink-0 text-[12px] tabular-nums text-hh-muted sm:w-20 sm:text-right">
          {p.weightKg != null ? <span>{formatKg(Number(p.weightKg))}</span> : null}
          {p.weightKg != null && value != null ? <span className="px-1">·</span> : null}
          {value != null ? (
            <span className="text-hh-earth-dk">
              {formatMoney(Number(value))} {p.currency}
            </span>
          ) : null}
          {p.weightKg == null && value == null ? <span>—</span> : null}
        </div>

        {/* Status pill */}
        <div className="shrink-0 sm:w-28 sm:text-center">
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              STATUS_PILL[p.status],
            )}
          >
            {parcelStatusLabelFr(p.status)}
          </span>
        </div>

        {/* Payment */}
        <div className="shrink-0 sm:w-16 sm:text-center">
          {p.isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <CheckCircle2 size={10} strokeWidth={2.5} />
              Payé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              <Banknote size={10} strokeWidth={2.5} />
              Impayé
            </span>
          )}
        </div>

        {/* Open link */}
        <Link
          href={`/parcels/${p.id}?fromShipment=${shipmentId}`}
          className="shrink-0 text-hh-muted hover:text-hh-saffron-dk sm:w-12 sm:text-center"
          aria-label={`Ouvrir la fiche ${p.trackingCode}`}
        >
          <ExternalLink size={14} strokeWidth={1.5} className="inline" />
        </Link>
      </div>
    </li>
  );
}

function BulkStatusMenu({
  disabled,
  selectableStatuses,
  onPick,
}: {
  disabled: boolean;
  selectableStatuses: ParcelStatus[];
  onPick: (s: ParcelStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-[var(--hh-radius-md)] bg-hh-saffron px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {disabled ? <Loader2 size={12} className="animate-spin" /> : null}
        Marquer comme…
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-[var(--hh-radius-md)] border border-hh-sand-dk/30 bg-white shadow-lg">
            {selectableStatuses.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-hh-muted">
                Aucune transition commune possible pour cette sélection.
              </p>
            ) : (
              selectableStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onPick(s);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-hh-earth-dk hover:bg-hh-sand"
                >
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      STATUS_PILL[s],
                    )}
                  />
                  {parcelStatusLabelFr(s)}
                </button>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatKg(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n)} kg`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
