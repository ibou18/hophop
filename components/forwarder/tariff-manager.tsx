"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import type { Country, PricingType, Currency, TransportMode } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS, countryLabelFr } from "@/lib/country-label-fr";
import {
  PRICING_TYPE_LABEL,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
} from "@/lib/pricing";
import { TRANSPORT_MODE_LABEL } from "@/lib/transport-mode";
import { TransportModeSelector, TransportModeBadge } from "@/components/transport-mode-selector";
import { useRouter } from "next/navigation";

export interface TariffRow {
  id: string;
  destinationCountry: Country | null;
  transportMode: TransportMode | null;
  pricingType: PricingType;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
  isActive: boolean;
  sortOrder: number;
}

const PRICING_TYPES = Object.keys(PRICING_TYPE_LABEL) as PricingType[];
const CURRENCIES = Object.keys(CURRENCY_LABEL) as Currency[];

function rateDisplay(t: TariffRow): string {
  const sym = CURRENCY_SYMBOL[t.currency];
  switch (t.pricingType) {
    case "WEIGHT_KG":
      return t.ratePerKg != null ? `${t.ratePerKg} ${sym}/kg` : "—";
    case "PER_BOX":
      return t.ratePerBox != null ? `${t.ratePerBox} ${sym}/carton` : "—";
    case "FLAT":
      return t.flatRate != null ? `${t.flatRate} ${sym}` : "—";
    case "VOLUMETRIC":
      return t.ratePerVolume != null
        ? `${t.ratePerVolume} ${sym}/vol · div ${t.volumeDivisor}`
        : "—";
  }
}

interface FormState {
  destinationCountry: string; // "" = global
  transportMode: TransportMode | ""; // "" = tous modes
  pricingType: PricingType;
  ratePerKg: string;
  ratePerBox: string;
  flatRate: string;
  ratePerVolume: string;
  volumeDivisor: string;
  minimumCharge: string;
  currency: Currency;
  isActive: boolean;
}

function emptyForm(): FormState {
  return {
    destinationCountry: "",
    transportMode: "",
    pricingType: "WEIGHT_KG",
    ratePerKg: "",
    ratePerBox: "",
    flatRate: "",
    ratePerVolume: "",
    volumeDivisor: "5000",
    minimumCharge: "0",
    currency: "EUR",
    isActive: true,
  };
}

function tariffToForm(t: TariffRow): FormState {
  return {
    destinationCountry: t.destinationCountry ?? "",
    transportMode: t.transportMode ?? "",
    pricingType: t.pricingType,
    ratePerKg: t.ratePerKg?.toString() ?? "",
    ratePerBox: t.ratePerBox?.toString() ?? "",
    flatRate: t.flatRate?.toString() ?? "",
    ratePerVolume: t.ratePerVolume?.toString() ?? "",
    volumeDivisor: t.volumeDivisor.toString(),
    minimumCharge: t.minimumCharge.toString(),
    currency: t.currency,
    isActive: t.isActive,
  };
}

function buildPayload(form: FormState): Record<string, unknown> {
  const n = (v: string) => (v.trim() === "" ? null : parseFloat(v));
  return {
    destinationCountry: form.destinationCountry === "" ? null : form.destinationCountry,
    transportMode: form.transportMode === "" ? null : form.transportMode,
    pricingType: form.pricingType,
    ratePerKg: form.pricingType === "WEIGHT_KG" ? n(form.ratePerKg) : null,
    ratePerBox: form.pricingType === "PER_BOX" ? n(form.ratePerBox) : null,
    flatRate: form.pricingType === "FLAT" ? n(form.flatRate) : null,
    ratePerVolume: form.pricingType === "VOLUMETRIC" ? n(form.ratePerVolume) : null,
    volumeDivisor: form.pricingType === "VOLUMETRIC" ? parseFloat(form.volumeDivisor) || 5000 : undefined,
    minimumCharge: parseFloat(form.minimumCharge) || 0,
    currency: form.currency,
    isActive: form.isActive,
  };
}

const inputCls =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 bg-white disabled:opacity-60";
const labelCls =
  "block text-[11px] font-medium uppercase tracking-wide text-hh-muted mb-1";

function TariffForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="rounded-[var(--hh-radius-lg)] border border-hh-saffron/30 bg-hh-saffron/5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">

        <div className="sm:col-span-2">
          <label className={labelCls}>Mode de transport</label>
          <TransportModeSelector
            value={form.transportMode as TransportMode}
            onChange={(v) => setForm((p) => ({ ...p, transportMode: v }))}
            disabled={pending}
            allowAll
            allValue=""
            allLabel="Tous modes"
          />
          <p className="mt-1.5 text-[11px] text-hh-muted">
            "Tous modes" s'applique si aucun tarif plus spécifique n'existe pour ce mode.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Destination</label>
          <select
            value={form.destinationCountry}
            onChange={set("destinationCountry")}
            disabled={pending}
            className={inputCls}
          >
            <option value="">Toutes destinations (tarif global)</option>
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Type de tarification</label>
          <select
            value={form.pricingType}
            onChange={set("pricingType")}
            disabled={pending}
            className={inputCls}
          >
            {PRICING_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRICING_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Devise</label>
          <select
            value={form.currency}
            onChange={set("currency")}
            disabled={pending}
            className={inputCls}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        {form.pricingType === "WEIGHT_KG" && (
          <div>
            <label className={labelCls}>
              Tarif par kilo ({CURRENCY_SYMBOL[form.currency]}/kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ratePerKg}
              onChange={set("ratePerKg")}
              disabled={pending}
              placeholder="ex : 4.50"
              className={inputCls}
            />
          </div>
        )}

        {form.pricingType === "PER_BOX" && (
          <div>
            <label className={labelCls}>
              Tarif par carton ({CURRENCY_SYMBOL[form.currency]})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ratePerBox}
              onChange={set("ratePerBox")}
              disabled={pending}
              placeholder="ex : 45.00"
              className={inputCls}
            />
          </div>
        )}

        {form.pricingType === "FLAT" && (
          <div>
            <label className={labelCls}>
              Prix fixe par colis ({CURRENCY_SYMBOL[form.currency]})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.flatRate}
              onChange={set("flatRate")}
              disabled={pending}
              placeholder="ex : 60.00"
              className={inputCls}
            />
          </div>
        )}

        {form.pricingType === "VOLUMETRIC" && (
          <>
            <div>
              <label className={labelCls}>
                Tarif / unité volumétrique ({CURRENCY_SYMBOL[form.currency]})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.ratePerVolume}
                onChange={set("ratePerVolume")}
                disabled={pending}
                placeholder="ex : 0.005"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Diviseur volumétrique</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.volumeDivisor}
                onChange={set("volumeDivisor")}
                disabled={pending}
                placeholder="5000"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-hh-muted">
                Poids vol. = L×l×H ÷ diviseur. Standard aérien : 6000, DHL : 5000.
              </p>
            </div>
          </>
        )}

        <div>
          <label className={labelCls}>
            Minimum facturé ({CURRENCY_SYMBOL[form.currency]})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.minimumCharge}
            onChange={set("minimumCharge")}
            disabled={pending}
            placeholder="0"
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <label className="flex cursor-pointer items-center gap-2 text-[14px] text-hh-earth-dk select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              disabled={pending}
              className="size-4 rounded border-hh-sand-dk/50"
            />
            Tarif actif
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave(form)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white hover:bg-hh-saffron-dk disabled:opacity-60"
        >
          <Check size={14} />
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-4 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand/60 disabled:opacity-60"
        >
          <X size={14} />
          Annuler
        </button>
      </div>
    </div>
  );
}

export function TariffManager({ initialTariffs }: { initialTariffs: TariffRow[] }) {
  const router = useRouter();
  const [tariffs, setTariffs] = useState<TariffRow[]>(initialTariffs);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSave(form: FormState, id?: string) {
    setError(null);
    const payload = buildPayload(form);
    const url = id ? `/api/tariffs/${id}` : "/api/tariffs";
    const method = id ? "PATCH" : "POST";

    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as TariffRow & { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? `Erreur ${res.status}`);
        return;
      }
      if (json) {
        if (id) {
          setTariffs((prev) => prev.map((t) => (t.id === id ? json : t)));
        } else {
          setTariffs((prev) => [...prev, json]);
        }
      }
      setEditingId(null);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tariffs/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? `Erreur ${res.status}`);
        return;
      }
      setTariffs((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    });
  }

  async function handleToggleActive(t: TariffRow) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tariffs/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      const json = (await res.json().catch(() => null)) as TariffRow | null;
      if (!res.ok) return;
      if (json) setTariffs((prev) => prev.map((x) => (x.id === t.id ? json : x)));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        {editingId === null && (
          <button
            type="button"
            onClick={() => setEditingId("new")}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white hover:bg-hh-saffron-dk"
          >
            <Plus size={14} />
            Nouveau tarif
          </button>
        )}
      </div>

      {editingId === "new" && (
        <TariffForm
          initial={emptyForm()}
          onSave={(f) => handleSave(f)}
          onCancel={() => setEditingId(null)}
          pending={pending}
        />
      )}

      {error && (
        <p className="text-[13px] text-hh-kola">{error}</p>
      )}

      {tariffs.length === 0 && editingId === null ? (
        <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white p-10 text-center">
          <p className="text-[14px] text-hh-muted">Aucun tarif configuré.</p>
          <p className="mt-1 text-[13px] text-hh-muted/70">
            Crée un tarif global ou par destination pour calculer automatiquement le prix de chaque colis.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-hh-sand-dk/20 bg-hh-sand/40">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Mode
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Type · Tarif
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-hh-muted hidden sm:table-cell">
                  Minimum
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Actif
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-hh-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hh-sand-dk/10">
              {tariffs.map((t) => (
                <>
                  <tr key={t.id} className="hover:bg-hh-sand/20 transition-colors">
                    <td className="px-4 py-3">
                      {t.transportMode
                        ? <TransportModeBadge mode={t.transportMode} size="xs" />
                        : <span className="text-[11px] text-hh-muted italic">Tous</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-hh-earth-dk">
                      {t.destinationCountry
                        ? countryLabelFr(t.destinationCountry)
                        : <span className="text-hh-muted italic">Toutes</span>}
                    </td>
                    <td className="px-4 py-3 text-hh-earth-dk">
                      <span className="text-hh-muted text-[12px]">{PRICING_TYPE_LABEL[t.pricingType]}</span>
                      <span className="mx-1.5 text-hh-sand-dk">·</span>
                      <span className="font-mono text-[13px]">{rateDisplay(t)}</span>
                    </td>
                    <td className="px-4 py-3 text-hh-muted hidden sm:table-cell">
                      {t.minimumCharge > 0
                        ? `${t.minimumCharge} ${CURRENCY_SYMBOL[t.currency]}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(t)}
                        disabled={pending}
                        title={t.isActive ? "Désactiver" : "Activer"}
                        className="transition-colors disabled:opacity-50"
                      >
                        {t.isActive
                          ? <ToggleRight size={22} className="text-hh-savane-dk" />
                          : <ToggleLeft size={22} className="text-hh-muted" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(editingId === t.id ? null : t.id)}
                          disabled={pending || editingId === "new"}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hh-sand-dk/30 text-hh-muted hover:border-hh-saffron/40 hover:text-hh-saffron-dk disabled:opacity-40 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Supprimer ce tarif ?")) handleDelete(t.id);
                          }}
                          disabled={pending}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hh-sand-dk/30 text-hh-muted hover:border-red-200 hover:text-red-500 disabled:opacity-40 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === t.id && (
                    <tr key={`${t.id}-edit`}>
                      <td colSpan={6} className="px-4 py-3">
                        <TariffForm
                          initial={tariffToForm(t)}
                          onSave={(f) => handleSave(f, t.id)}
                          onCancel={() => setEditingId(null)}
                          pending={pending}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[12px] text-hh-muted">
        Le tarif par destination est prioritaire sur le tarif global. Si aucun tarif ne correspond, le prix devra être saisi manuellement sur le colis.
      </p>
    </div>
  );
}
