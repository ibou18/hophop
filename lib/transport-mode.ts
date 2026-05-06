import type { TransportMode } from "@/app/generated/prisma/enums";

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  AIR:       "Avion",
  SEA:       "Maritime",
  ROAD:      "Route",
  CONTAINER: "Conteneur",
  RORO:      "RoRo",
};

export const TRANSPORT_MODE_EMOJI: Record<TransportMode, string> = {
  AIR:       "✈️",
  SEA:       "🚢",
  ROAD:      "🚛",
  CONTAINER: "📦",
  RORO:      "🚗",
};

/** Tailwind classes for badge bg + text + ring */
export const TRANSPORT_MODE_BADGE: Record<
  TransportMode,
  { bg: string; text: string; ring: string; dot: string }
> = {
  AIR: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    dot: "bg-sky-400",
  },
  SEA: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
    dot: "bg-teal-400",
  },
  ROAD: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
  },
  CONTAINER: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    dot: "bg-indigo-400",
  },
  RORO: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
    dot: "bg-purple-400",
  },
};

export const TRANSPORT_MODES: TransportMode[] = ["AIR", "SEA", "ROAD", "CONTAINER", "RORO"];

/** Modes réservés aux véhicules */
export const VEHICLE_TRANSPORT_MODES: TransportMode[] = ["CONTAINER", "RORO"];

export function isVehicleMode(mode: TransportMode): boolean {
  return VEHICLE_TRANSPORT_MODES.includes(mode);
}
