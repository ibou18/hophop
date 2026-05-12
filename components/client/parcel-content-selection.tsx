"use client";

import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/app/generated/prisma/enums";

/** Ligne envoyée aux APIs (nom = libellé de la catégorie par défaut). */
export type ParcelContentLine = {
  category: ItemCategory;
  name: string;
  /** Toujours 1 côté UI — conservé pour les APIs / Prisma. */
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

/** Réponse IA : tableau de codes ou `{ category, quantity? }` (quantité ignorée). */
export function parcelContentLinesFromAiCategories(
  categories: unknown,
): ParcelContentLine[] {
  if (!Array.isArray(categories) || categories.length === 0) return [];
  const out: ParcelContentLine[] = [];
  const seen = new Set<ItemCategory>();
  for (const entry of categories) {
    const code =
      typeof entry === "string"
        ? entry
        : entry &&
            typeof entry === "object" &&
            "category" in entry &&
            typeof (entry as { category: unknown }).category === "string"
          ? (entry as { category: string }).category
          : null;
    if (!code) continue;
    const cat = PARCEL_CONTENT_CATEGORIES.find((pc) => pc.value === code);
    if (!cat || seen.has(cat.value)) continue;
    seen.add(cat.value);
    out.push({ category: cat.value, name: cat.label, quantity: 1 });
  }
  return out;
}

type Props = {
  items: ParcelContentLine[];
  onItemsChange: (items: ParcelContentLine[]) => void;
  className?: string;
  /** défaut true — titre « Contenu du colis » et consigne */
  showIntro?: boolean;
};

/**
 * Sélection multi-catégories (une ligne par catégorie, quantity = 1 pour l’API).
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

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showIntro ? (
        <div>
          <h2 className="text-[16px] font-medium text-hh-earth-dk">
            Contenu du colis
          </h2>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            Sélectionne une ou plusieurs catégories.
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
    </div>
  );
}
