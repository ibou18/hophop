"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { PricingType, Currency } from "@/app/generated/prisma/enums";
import { PRICING_TYPE_LABEL, CURRENCY_SYMBOL } from "@/lib/pricing";
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
  pricingType: PricingType | null;
  ratePerKg: number | null;
  ratePerBox: number | null;
  flatRate: number | null;
  ratePerVolume: number | null;
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
    volumeDivisor: props.volumeDivisor.toString(),
    minimumCharge: props.minimumCharge.toString(),
    currency: props.currency,
  });

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${props.shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(pricingStateToPayload(pricingState)),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Impossible de sauvegarder.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Tarification de l'envoi mise à jour ✓");
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">Tarification de l&apos;envoi</h2>
        <ShipmentPricingSection
          value={pricingState}
          onChange={setPricingState}
          disabled={pending}
        />
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
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setEditing(false)}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-hh-earth-dk">Tarification de l&apos;envoi</h2>
          {props.pricingType ? (
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
    </div>
  );
}
