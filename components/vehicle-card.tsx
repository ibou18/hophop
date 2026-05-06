import type { Vehicle } from "@/app/generated/prisma/client";
import { Car, Fuel, Key, Wrench } from "lucide-react";

const FUEL_LABEL: Record<string, string> = {
  GASOLINE: "Essence",
  DIESEL:   "Diesel",
  ELECTRIC: "Électrique",
  HYBRID:   "Hybride",
  OTHER:    "Autre",
};

const CONDITION_LABEL: Record<string, string> = {
  RUNNING:     "Fonctionnel",
  NON_RUNNING: "En panne",
};

type Props = {
  vehicle: Vehicle;
};

export function VehicleCard({ vehicle }: Props) {
  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Car className="size-4 text-indigo-600" />
        <h2 className="text-[15px] font-medium text-indigo-900">Véhicule</h2>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-2 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
            Marque / Modèle
          </dt>
          <dd className="mt-0.5 font-semibold text-indigo-900">
            {vehicle.make} {vehicle.model}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
            Année
          </dt>
          <dd className="mt-0.5 text-indigo-800">{vehicle.year}</dd>
        </div>

        {vehicle.color && (
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
              Couleur
            </dt>
            <dd className="mt-0.5 text-indigo-800">{vehicle.color}</dd>
          </div>
        )}

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400 flex items-center gap-1">
            <Fuel className="size-3" /> Carburant
          </dt>
          <dd className="mt-0.5 text-indigo-800">{FUEL_LABEL[vehicle.fuelType] ?? vehicle.fuelType}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400 flex items-center gap-1">
            <Wrench className="size-3" /> État
          </dt>
          <dd className={`mt-0.5 font-medium ${vehicle.condition === "RUNNING" ? "text-emerald-700" : "text-red-600"}`}>
            {CONDITION_LABEL[vehicle.condition] ?? vehicle.condition}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400 flex items-center gap-1">
            <Key className="size-3" /> Clés
          </dt>
          <dd className="mt-0.5 text-indigo-800">{vehicle.hasKeys ? "Présentes" : "Absentes"}</dd>
        </div>

        {vehicle.vin && (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
              VIN
            </dt>
            <dd className="mt-0.5 font-mono text-[13px] text-indigo-800">{vehicle.vin}</dd>
          </div>
        )}

        {vehicle.plate && (
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
              Immatriculation
            </dt>
            <dd className="mt-0.5 font-mono text-[13px] text-indigo-800">{vehicle.plate}</dd>
          </div>
        )}
      </dl>

      {vehicle.inspectionNote && (
        <div className="mt-4 rounded-lg border border-indigo-200 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-400">
            Note d'inspection
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-indigo-800">
            {vehicle.inspectionNote}
          </p>
        </div>
      )}
    </section>
  );
}
