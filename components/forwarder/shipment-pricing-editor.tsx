"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Car } from "lucide-react";
import type { PricingType, Currency } from "@/app/generated/prisma/enums";
import { PRICING_TYPE_LABEL, CURRENCY_SYMBOL, CURRENCY_LABEL } from "@/lib/pricing";
import {
  ShipmentPricingSection,
  pricingStateToPayload,
  type ShipmentPricingState,
} from "@/components/forwarder/shipment-pricing-section";
import { Button } from "@/components/ui/button";

/** Props issues des champs pricing du Shipment (retournés par l'API GET). */
export interface ShipmentPricingProps {
  shipmentId: string;
  editable: boolean;
  isMaritime: boolean;
  acceptsVehicles: boolean;
  pricingType: PricingType | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
  ratePerVehicle: number | null;
  volumeDivisor: number;
  minimumCharge: number;
  currency: Currency;
}

function formatRate(type: PricingType, props: ShipmentPricingProps): string {
  const sym = CURRENCY_SYMBOL[props.currency];
  switch (type) {
    case "WEIGHT_KG":
      return props.ratePerKg != null ? `${props.ratePerKg} ${sym}/kg` : "—";
    case "PER_BOX":
      return props.ratePerBox != null ? `${props.ratePerBox} ${sym}/carton` : "—";
    case "FLAT":
      return props.flatRate != null ? `${props.flatRate} ${sym}/colis` : "—";
    case "VOLUMETRIC":
      return props.ratePerVolume != null
        ? `${props.ratePerVolume} ${sym}/u.vol  (÷${props.volumeDivisor})`
        : "—";
    case "PER_VEHICLE":
      return props.ratePerVehicle != null ? `${props.ratePerVehicle} ${sym}/véhicule` : "—";
  }
}

export function ShipmentPricingEditor(props: ShipmentPricingProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [pricingState, setPricingState] = useState<ShipmentPricingState>({
    pricingType: props.pricingType ?? "",
    ratePerKg: props.ratePerKg?.toString() ?? "",
    ratePerBox: props.ratePerBox?.toString() ?? "",
    flatRate: props.flatRate?.toString() ?? "",
    ratePerVolume: props.ratePerVolume?.toString() ?? "",
    ratePerVehicle: props.ratePerVehicle?.toString() ?? "",
    volumeDivisor: props.volumeDivisor.toString(),
    minimumCharge: props.minimumCharge.toString(),
    currency: props.currency,
  });

  // Vehicle acceptance state
  const [acceptsVehicles, setAcceptsVehicles] = useState(props.acceptsVehicles);
  const [vehiclePrice, setVehiclePrice] = useState(props.ratePerVehicle?.toString() ?? "");
  const [vehicleCurrency, setVehicleCurrency] = useState<Currency>(props.currency);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${props.shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...pricingStateToPayload(pricingState),
          acceptsVehicles,
          ...(acceptsVehicles && vehiclePrice
            ? { ratePerVehicle: parseFloat(vehiclePrice), currency: vehicleCurrency }
            : { ratePerVehicle: acceptsVehicles ? null : null }),
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Impossible de sauvegarder.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Tarification mise à jour ✓");
      setEditing(false);
      router.refresh();
    });
  }

  const numInputClass =
    "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";
  const selectClass =
    "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";

  if (editing) {
    return (
      <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">Tarification de l&apos;envoi</h2>

        <ShipmentPricingSection
          value={pricingState}
          onChange={setPricingState}
          disabled={pending}
        />

        {/* Vehicle section (maritime only) */}
        {props.isMaritime && (
          <div className="space-y-3 rounded-[var(--hh-radius-lg)] border border-teal-200 bg-teal-50/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car size={15} className="shrink-0 text-teal-700" />
                <p className="text-[13px] font-medium text-teal-900">Accepter les véhicules</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={acceptsVehicles}
                disabled={pending}
                onClick={() => {
                  const next = !acceptsVehicles;
                  setAcceptsVehicles(next);
                  if (!next) setVehiclePrice("");
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 ${
                  acceptsVehicles ? "bg-teal-600" : "bg-hh-sand-dk/40"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    acceptsVehicles ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {acceptsVehicles && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-teal-800">
                    Prix par véhicule
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(e.target.value)}
                    disabled={pending}
                    placeholder="ex. 1 500.00"
                    className={numInputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-teal-800">
                    Devise
                  </label>
                  <select
                    value={vehicleCurrency}
                    onChange={(e) => setVehicleCurrency(e.target.value as Currency)}
                    disabled={pending}
                    className={selectClass}
                  >
                    {(Object.keys(CURRENCY_LABEL) as Currency[]).map((k) => (
                      <option key={k} value={k}>{CURRENCY_LABEL[k]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-[13px] text-hh-kola">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={pending}
            className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
            onClick={save}
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-hh-earth-dk">Tarification de l&apos;envoi</h2>
          {props.pricingType && props.pricingType !== "PER_VEHICLE" ? (
            <div className="mt-2 space-y-0.5">
              <p className="text-[13px] text-hh-earth-dk font-medium">
                {PRICING_TYPE_LABEL[props.pricingType]}
              </p>
              <p className="text-[13px] text-hh-muted">
                {formatRate(props.pricingType, props)}
                {props.minimumCharge > 0 && (
                  <span className="ml-2 text-[11px]">
                    · Minimum {props.minimumCharge} {CURRENCY_SYMBOL[props.currency]}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[13px] text-hh-muted">
              Utilise la grille tarifaire globale.
            </p>
          )}
        </div>
        {props.editable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-hh-sand-dk/40 text-[13px]"
            onClick={() => setEditing(true)}
          >
            Modifier
          </Button>
        )}
      </div>

      {/* Vehicle badge */}
      {props.isMaritime && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${
          props.acceptsVehicles
            ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
            : "bg-hh-sand/60 text-hh-muted ring-1 ring-hh-sand-dk/20"
        }`}>
          <Car size={14} className="shrink-0" />
          {props.acceptsVehicles ? (
            <span>
              Véhicules acceptés
              {props.ratePerVehicle != null
                ? ` · ${props.ratePerVehicle} ${CURRENCY_SYMBOL[props.currency]}/véhicule`
                : " · Tarif à confirmer"}
            </span>
          ) : (
            <span>Véhicules non acceptés</span>
          )}
        </div>
      )}
    </div>
  );
}
