"use client";

import { motion } from "motion/react";
import { Package, MapPin } from "lucide-react";

const CARDS = [
  { code: "HOP-4821", from: "CA", to: "GN", label: "Conakry", status: "En transit", color: "#e8820c", delay: 0, x: "8%", y: "20%" },
  { code: "HOP-2934", from: "FR", to: "SN", label: "Dakar", status: "Arrivé", color: "#4a7c59", delay: 1.2, x: "72%", y: "15%" },
  { code: "HOP-7103", from: "CA", to: "CI", label: "Abidjan", status: "Collecté", color: "#e8820c", delay: 2.4, x: "55%", y: "62%" },
  { code: "HOP-5509", from: "FR", to: "CM", label: "Douala", status: "Déclaré", color: "#8b4513", delay: 0.8, x: "18%", y: "65%" },
  { code: "HOP-3317", from: "CA", to: "GN", label: "Kindia", status: "En transit", color: "#e8820c", delay: 3.1, x: "82%", y: "48%" },
] as const;

export function FloatingParcels() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CARDS.map((card) => (
        <motion.div
          key={card.code}
          className="absolute"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.55, 0.35, 0.55],
            y: [0, -18, 4, -18, 0],
            x: [0, 6, -4, 6, 0],
            scale: [0.8, 1, 1, 1, 0.8],
          }}
          transition={{
            duration: 8,
            delay: card.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="rounded-xl border bg-white/[0.04] backdrop-blur-sm px-3.5 py-3 shadow-lg"
            style={{ borderColor: `${card.color}30` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package size={11} style={{ color: card.color }} />
              <span className="font-mono text-[10px] font-medium text-white/70">
                {card.code}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="font-medium text-white/70">{card.from}</span>
              <span>→</span>
              <MapPin size={9} />
              <span>{card.label}</span>
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: card.color }}
              />
              {card.status}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
