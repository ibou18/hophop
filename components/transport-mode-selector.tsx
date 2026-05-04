"use client";

import { Plane, Ship, Truck } from "lucide-react";
import type { TransportMode } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

const MODES: {
  value: TransportMode;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  activeClass: string;
}[] = [
  {
    value: "AIR",
    label: "Avion",
    sublabel: "Livraison rapide",
    Icon: Plane,
    activeClass:
      "border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-200",
  },
  {
    value: "SEA",
    label: "Maritime",
    sublabel: "Économique",
    Icon: Ship,
    activeClass:
      "border-teal-400 bg-teal-50 text-teal-700 ring-2 ring-teal-200",
  },
  {
    value: "ROAD",
    label: "Route",
    sublabel: "Terrestre",
    Icon: Truck,
    activeClass:
      "border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200",
  },
];

interface Props {
  value: TransportMode;
  onChange: (v: TransportMode) => void;
  disabled?: boolean;
  /** Include a "Tous modes" option (null) — for tariff forms */
  allowAll?: boolean;
  allValue?: string;
  allLabel?: string;
}

export function TransportModeSelector({
  value,
  onChange,
  disabled,
  allowAll,
  allValue = "",
  allLabel = "Tous modes",
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {allowAll && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(allValue as TransportMode)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-4 py-3 text-center transition-all disabled:opacity-50",
            value === allValue
              ? "border-hh-saffron/50 bg-hh-saffron/5 ring-2 ring-hh-saffron/20 text-hh-saffron-dk"
              : "text-hh-muted hover:border-hh-sand-dk/60 hover:bg-hh-sand/30",
          )}
        >
          <span className="text-lg">🌍</span>
          <span className="text-[12px] font-medium leading-none">{allLabel}</span>
          <span className="text-[10px] leading-none opacity-70">Tout mode</span>
        </button>
      )}
      {MODES.map(({ value: v, label, sublabel, Icon, activeClass }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-5 py-3.5 text-center transition-all disabled:opacity-50",
              active
                ? activeClass
                : "text-hh-muted hover:border-hh-sand-dk/60 hover:bg-hh-sand/30",
            )}
          >
            <Icon size={20} className={active ? "" : "opacity-60"} />
            <span className="text-[13px] font-semibold leading-none">{label}</span>
            <span className="text-[10px] leading-none opacity-70">{sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Small inline badge — for tables and cards */
export function TransportModeBadge({
  mode,
  size = "sm",
}: {
  mode: TransportMode;
  size?: "xs" | "sm";
}) {
  const m = MODES.find((x) => x.value === mode);
  if (!m) return null;
  const { Icon, label, activeClass } = m;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1",
        size === "xs"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-[11px]",
        activeClass,
      )}
    >
      <Icon size={size === "xs" ? 9 : 11} />
      {label}
    </span>
  );
}
