import type { ParcelStatus } from "@/app/generated/prisma/enums";

const LABELS: Record<ParcelStatus, string> = {
  DECLARED: "Déclaré",
  COLLECTED: "Collecté",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  READY: "Prêt au retrait",
  DELIVERED: "Livré",
  ISSUE: "Incident",
};

export function parcelStatusLabelFr(status: ParcelStatus): string {
  return LABELS[status] ?? status;
}
