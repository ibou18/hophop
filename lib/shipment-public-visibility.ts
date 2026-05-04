import type { Prisma } from "@/app/generated/prisma/client";
import { ShipmentStatus } from "@/app/generated/prisma/enums";

/** Début du jour courant en UTC (pour comparer aux dates d’envoi stockées). */
export function startOfUtcDay(d: Date = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

/**
 * Filtre les envois encore « à venir » pour la vitrine publique et le catalogue client :
 * publiés, statuts habituels, et date d’envoi définie **≥** début du jour UTC courant.
 * Passé minuit (UTC) après le jour J, l’envoi disparaît des listes publiques.
 */
export function publicVitrineShipmentWhere(): Prisma.ShipmentWhereInput {
  const dayStart = startOfUtcDay();
  return {
    isPublished: true,
    status: {
      in: [
        ShipmentStatus.DRAFT,
        ShipmentStatus.CONFIRMED,
        ShipmentStatus.IN_TRANSIT,
      ],
    },
    departureDate: { not: null, gte: dayStart },
  };
}

/**
 * Envois où un client peut encore demander à rejoindre (pas encore partis au sens date / statut).
 */
export function clientJoinableShipmentWhere(): Prisma.ShipmentWhereInput {
  const dayStart = startOfUtcDay();
  return {
    isPublished: true,
    status: {
      in: [ShipmentStatus.DRAFT, ShipmentStatus.CONFIRMED],
    },
    departureDate: { not: null, gte: dayStart },
  };
}
