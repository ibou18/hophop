import type { TransportMode } from "@/app/generated/prisma/enums";

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  AIR: "Avion",
  SEA: "Maritime",
  ROAD: "Route",
};

export const TRANSPORT_MODE_EMOJI: Record<TransportMode, string> = {
  AIR: "✈️",
  SEA: "🚢",
  ROAD: "🚛",
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
};

export const TRANSPORT_MODES: TransportMode[] = ["AIR", "SEA", "ROAD"];
