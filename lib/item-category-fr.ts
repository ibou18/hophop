import type { ItemCategory } from "@/app/generated/prisma/enums";

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  CLOTHING:    "Vêtements",
  ELECTRONICS: "Électronique",
  FOOD:        "Alimentation",
  COSMETICS:   "Cosmétiques",
  DOCUMENTS:   "Documents",
  OTHER:       "Divers",
};

export function itemCategoryLabelFr(cat: ItemCategory): string {
  return ITEM_CATEGORY_LABEL[cat] ?? cat;
}
