import type { ShipmentStatus } from "@/app/generated/prisma/enums";

const LABELS: Record<ShipmentStatus, string> = {
  DRAFT: "Brouillon",
  CONFIRMED: "Confirmé",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivé",
  CLOSED: "Clôturé",
};

export function shipmentStatusLabelFr(status: ShipmentStatus): string {
  return LABELS[status] ?? status;
}
