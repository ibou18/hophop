"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ParcelStatus } from "@/app/generated/prisma/enums";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import {
  ALL_PARCEL_STATUSES_ORDERED,
  staffSelectableStatuses,
} from "@/lib/parcel-status-workflow";
import { Button } from "@/components/ui/button";

export function ParcelStatusUpdater({
  parcelId,
  currentStatus,
  canCorrectAnyStatus = false,
}: {
  parcelId: string;
  currentStatus: ParcelStatus;
  /** OWNER / ADMIN : toutes les transitions : corriger une erreur de statut. */
  canCorrectAnyStatus?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ParcelStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(): void {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!res.ok) {
        const msg =
          json?.message ??
          json?.error ??
          `Mise à jour impossible (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Statut mis à jour : ${parcelStatusLabelFr(status)}`);
      router.refresh();
    });
  }

  const statusOptions = canCorrectAnyStatus
    ? ALL_PARCEL_STATUSES_ORDERED
    : staffSelectableStatuses(currentStatus);

  return (
    <div className="space-y-2">
      {!canCorrectAnyStatus ? (
        <p className="text-[12px] text-hh-muted">
          Seules les étapes du flux normal sont proposées. Pour corriger une erreur,
          connecte-toi avec un compte administrateur (propriétaire ou admin).
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="parcel-status"
            className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
          >
            Statut du colis
          </label>
          <select
            id="parcel-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ParcelStatus)}
            disabled={pending}
            className="h-10 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-60"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {parcelStatusLabelFr(s)}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={pending || status === currentStatus}
          className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
      {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}
    </div>
  );
}
