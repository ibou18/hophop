import type { ParcelStatus } from "@/app/generated/prisma/enums";
import { ParcelStatus as ParcelStatusEnum } from "@/app/generated/prisma/enums";

/** Ordre d’affichage des statuts (sélecteurs admin / fiche). */
export const ALL_PARCEL_STATUSES_ORDERED: ParcelStatus[] = [
  ParcelStatusEnum.DECLARED,
  ParcelStatusEnum.COLLECTED,
  ParcelStatusEnum.IN_TRANSIT,
  ParcelStatusEnum.ARRIVED,
  ParcelStatusEnum.READY,
  ParcelStatusEnum.DELIVERED,
  ParcelStatusEnum.ISSUE,
];

/** Transitions autorisées pour les collaborateurs (STAFF) — flux opérationnel. */
const STAFF_ALLOWED: Record<ParcelStatus, ParcelStatus[]> = {
  DECLARED: ["COLLECTED", "ISSUE"],
  COLLECTED: ["ISSUE"],
  IN_TRANSIT: ["ARRIVED", "ISSUE"],
  ARRIVED: ["READY", "ISSUE"],
  READY: ["DELIVERED", "ISSUE"],
  DELIVERED: [],
  ISSUE: ["COLLECTED"],
};

export function staffMayTransition(from: ParcelStatus, to: ParcelStatus): boolean {
  if (from === to) return true;
  return STAFF_ALLOWED[from]?.includes(to) ?? false;
}

/** OWNER et ADMIN peuvent corriger le statut hors flux (erreur utilisateur). */
export function isForwarderPrivilegedRole(
  role: string | undefined | null,
): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Options du sélecteur pour un collaborateur : statut actuel + transitions permises. */
export function staffSelectableStatuses(current: ParcelStatus): ParcelStatus[] {
  const next = STAFF_ALLOWED[current] ?? [];
  return Array.from(new Set<ParcelStatus>([current, ...next]));
}
