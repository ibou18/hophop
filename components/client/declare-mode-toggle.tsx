"use client";

import { useState } from "react";
import { Box, Car, Cylinder, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeclareFlowMode = "parcel" | "vehicle" | "tiered";

type Props = {
  parcelContent: React.ReactNode;
  vehicleContent: React.ReactNode;
  /** Fût ou carton par palier S/M/L (même UX) */
  tieredParcelContent?: React.ReactNode;
  initialMode?: DeclareFlowMode;
  /** Affiche « Colis classique » (dimensions / contenu détaillé) */
  showClassicParcelTab?: boolean;
  showVehicleTab?: boolean;
  /** Fût maritime et/ou carton par taille */
  showTieredParcelTab?: boolean;
};

export function DeclareModeToggle({
  parcelContent,
  vehicleContent,
  tieredParcelContent,
  initialMode = "parcel",
  showClassicParcelTab = true,
  showVehicleTab = true,
  showTieredParcelTab = false,
}: Props) {
  const showClassic = showClassicParcelTab;
  const showTiered = showTieredParcelTab && tieredParcelContent != null;
  const showVehicle = showVehicleTab;

  const tabCount = [showClassic, showTiered, showVehicle].filter(Boolean).length;
  const anyChoice = tabCount > 1;

  const resolvedInitial = ((): DeclareFlowMode => {
    if (initialMode === "vehicle" && showVehicle) return "vehicle";
    if (initialMode === "tiered" && showTiered) return "tiered";
    if (initialMode === "parcel" && showClassic) return "parcel";
    if (showTiered) return "tiered";
    if (showVehicle) return "vehicle";
    return "parcel";
  })();

  const [mode, setMode] = useState<DeclareFlowMode>(resolvedInitial);

  const activeContent =
    mode === "vehicle"
      ? vehicleContent
      : mode === "tiered"
        ? tieredParcelContent
        : parcelContent;

  if (tabCount <= 1) {
    return <div className="space-y-5">{activeContent}</div>;
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "grid gap-2 rounded-2xl bg-hh-earth-lt/60 p-1.5",
          tabCount === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {showClassic ? (
          <button
            type="button"
            onClick={() => setMode("parcel")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all",
              mode === "parcel"
                ? "bg-white text-hh-earth-dk shadow-sm"
                : "text-hh-muted hover:text-hh-earth-dk",
            )}
          >
            <Package className="size-4 shrink-0" />
            <span className="text-center leading-tight">Colis classique</span>
          </button>
        ) : null}
        {showTiered ? (
          <button
            type="button"
            onClick={() => setMode("tiered")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all",
              mode === "tiered"
                ? "bg-white text-hh-saffron-dk shadow-sm ring-1 ring-hh-saffron/35"
                : "text-hh-muted hover:text-hh-earth-dk",
            )}
          >
            <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
              <Box className="size-3.5 text-violet-700" />
              <Cylinder className="size-3.5 text-amber-700" />
            </span>
            <span className="text-center leading-tight">Palier S / M / L</span>
          </button>
        ) : null}
        {showVehicle ? (
          <button
            type="button"
            onClick={() => setMode("vehicle")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all",
              mode === "vehicle"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-hh-muted hover:text-hh-earth-dk",
            )}
          >
            <Car className="size-4 shrink-0" />
            <span className="text-center leading-tight">Véhicule</span>
          </button>
        ) : null}
      </div>

      {anyChoice && mode === "tiered" && (
        <div className="rounded-xl border border-hh-saffron/25 bg-hh-saffron-lt/50 px-4 py-3 text-[13px] text-hh-earth-dk">
          <strong>Carton ou fût</strong> — même principe : tu indiques la taille de palier (petit /
          moyen / grand). Le tarif dépend du type choisi dans le formulaire.
        </div>
      )}

      {anyChoice && showVehicle && mode === "vehicle" && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-[13px] text-indigo-700">
          <strong>Envoi de véhicule</strong> — Conteneur fermé ou RoRo. Ton transitaire confirmera le
          détail et le tarif.
        </div>
      )}

      {activeContent}
    </div>
  );
}
