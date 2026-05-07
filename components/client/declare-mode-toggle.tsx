"use client";

import { useState } from "react";
import { Car, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  parcelContent: React.ReactNode;
  vehicleContent: React.ReactNode;
  initialMode?: "parcel" | "vehicle";
  /** Masque l'onglet véhicule si l'envoi n'accepte pas les véhicules */
  showVehicleTab?: boolean;
};

export function DeclareModeToggle({
  parcelContent,
  vehicleContent,
  initialMode = "parcel",
  showVehicleTab = true,
}: Props) {
  const [mode, setMode] = useState<"parcel" | "vehicle">(
    initialMode === "vehicle" && showVehicleTab ? "vehicle" : "parcel",
  );

  return (
    <div className="space-y-5">
      {/* Toggle — masqué si vehicule non disponible */}
      {showVehicleTab && (
        <div className="flex gap-2 rounded-2xl bg-hh-earth-lt/60 p-1.5">
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
            <Package className="size-4" />
            Colis classique
          </button>
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
            <Car className="size-4" />
            Véhicule
          </button>
        </div>
      )}

      {/* Info véhicule */}
      {showVehicleTab && mode === "vehicle" && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-[13px] text-indigo-700">
          <strong>Envoi de véhicule</strong> — Conteneur fermé ou RoRo (Roll-on/Roll-off).
          Ton transitaire confirmera le mode de transport et le tarif.
        </div>
      )}

      {/* Contenu */}
      {showVehicleTab && mode === "vehicle" ? vehicleContent : parcelContent}
    </div>
  );
}
