import type { ParcelStatus } from "@/app/generated/prisma/enums";

const STATUS_CONFIG: Record<
  ParcelStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  DECLARED:   { bg: "#EAF3DE", text: "#27500A", dot: "#639922",  label: "Déclaré"       },
  COLLECTED:  { bg: "#FDF0E0", text: "#7A3F04", dot: "#E8820C",  label: "Collecté"      },
  IN_TRANSIT: { bg: "#E6F1FB", text: "#0C447C", dot: "#378ADD",  label: "En transit"    },
  ARRIVED:    { bg: "#E8F2EC", text: "#1E3D28", dot: "#4A7C59",  label: "Arrivé"        },
  READY:      { bg: "#FAEEDA", text: "#633806", dot: "#EF9F27",  label: "Prêt au retrait" },
  DELIVERED:  { bg: "#E8F2EC", text: "#1E3D28", dot: "#4A7C59",  label: "Livré"         },
  ISSUE:      { bg: "#FAEAE5", text: "#6B1A0A", dot: "#C13B1B",  label: "Incident"      },
};

export function ParcelStatusBadge({ status }: { status: ParcelStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      <span
        style={{ background: cfg.dot }}
        className="h-1.5 w-1.5 rounded-full"
      />
      {cfg.label}
    </span>
  );
}
