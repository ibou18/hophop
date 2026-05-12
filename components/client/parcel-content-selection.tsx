"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/app/generated/prisma/enums";

/** Ligne envoyée aux APIs (nom = libellé de la catégorie par défaut). */
export type ParcelContentLine = {
  category: ItemCategory;
  name: string;
  quantity: number;
};

export const PARCEL_CONTENT_CATEGORIES: {
  value: ItemCategory;
  icon: string;
  label: string;
}[] = [
  { value: "CLOTHING", icon: "👕", label: "Vêtements" },
  { value: "ELECTRONICS", icon: "📱", label: "Électronique" },
  { value: "COSMETICS", icon: "🧴", label: "Cosmétiques" },
  { value: "FOOD", icon: "🍱", label: "Alimentaire" },
  { value: "DOCUMENTS", icon: "📄", label: "Documents" },
  { value: "OTHER", icon: "📦", label: "Autre" },
];

type Props = {
  items: ParcelContentLine[];
  onItemsChange: (items: ParcelContentLine[]) => void;
  className?: string;
  /** défaut true — titre « Contenu du colis » et consigne */
  showIntro?: boolean;
};

/**
 * Sélection multi-catégories + quantités — même UX que l’étape « Contenu » du wizard déclaration colis.
 */
export function ParcelContentSelection({
  items,
  onItemsChange,
  className,
  showIntro = true,
}: Props) {
  function toggleCategory(cat: ItemCategory) {
    const existing = items.find((i) => i.category === cat);
    if (existing) {
      onItemsChange(items.filter((i) => i.category !== cat));
    } else {
      const label =
        PARCEL_CONTENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
      onItemsChange([
        ...items,
        { category: cat, name: label, quantity: 1 },
      ]);
    }
  }

  function updateQuantity(cat: ItemCategory, delta: number) {
    onItemsChange(
      items.map((item) =>
        item.category === cat
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showIntro ? (
        <div>
          <h2 className="text-[16px] font-medium text-hh-earth-dk">
            Contenu du colis
          </h2>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            Sélectionne les catégories (plusieurs possibles).
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {PARCEL_CONTENT_CATEGORIES.map((cat) => {
          const selected = items.find((i) => i.category === cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCategory(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors",
                selected
                  ? "border-hh-saffron bg-hh-saffron-lt"
                  : "border-transparent bg-hh-sand hover:border-hh-sand-dk",
              )}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <span
                className={cn(
                  "text-[11px]",
                  selected ? "font-medium text-hh-saffron-dk" : "text-hh-muted",
                )}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-hh-sand-dk/15 pt-3">
          <p className="text-[11px] font-medium text-hh-muted">Quantités</p>
          {items.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between rounded-[var(--hh-radius-md)] bg-hh-sand px-3 py-2"
            >
              <span className="text-[13px] text-hh-earth-dk">{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.category, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <span className="w-5 text-center text-[13px] font-medium">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.category, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-hh-earth-dk hover:bg-hh-sand-dk/30"
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
