"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ShipmentStatus } from "@/app/generated/prisma/enums";
import { ShipmentStatus as ShipmentSt } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";

export function ShipmentDetailActions({
  shipmentId,
  status,
  parcelCount,
  updatedAtIso,
}: {
  shipmentId: string;
  status: ShipmentStatus;
  parcelCount: number;
  updatedAtIso: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  type RunToastOpts = {
    /** Toast Sonner « chargement » pendant l’appel API (ex. départ). */
    loading?: string;
    successDescription?: string;
    /** Durée d’affichage du succès (ms). */
    duration?: number;
  };

  function run(
    label: string,
    successMsg: string,
    fn: () => Promise<{ ok: boolean; message?: string }>,
    toastOpts?: RunToastOpts,
  ): void {
    setError(null);
    startTransition(async () => {
      let loadingId: string | number | undefined;
      if (toastOpts?.loading) {
        loadingId = toast.loading(toastOpts.loading);
      }
      try {
        const r = await fn();
        if (loadingId !== undefined) toast.dismiss(loadingId);
        if (!r.ok) {
          const msg = r.message ?? `Impossible : ${label}`;
          setError(msg);
          toast.error(msg);
          return;
        }
        toast.success(successMsg, {
          ...(toastOpts?.successDescription
            ? { description: toastOpts.successDescription }
            : {}),
          ...(toastOpts?.duration != null ? { duration: toastOpts.duration } : {}),
        });
        router.refresh();
      } catch {
        if (loadingId !== undefined) toast.dismiss(loadingId);
        const msg = "Erreur réseau";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  async function patchStatus(next: ShipmentStatus): Promise<{
    ok: boolean;
    message?: string;
  }> {
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: next }),
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return { ok: false, message: j?.error };
    return { ok: true };
  }

  async function postDispatch(): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch(`/api/shipments/${shipmentId}/dispatch`, {
      method: "POST",
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return { ok: false, message: j?.error };
    return { ok: true };
  }

  async function postArrive(): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch(`/api/shipments/${shipmentId}/arrive`, {
      method: "POST",
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) return { ok: false, message: j?.error };
    return { ok: true };
  }

  const canConfirm = status === ShipmentSt.DRAFT;
  const canDispatch =
    (status === ShipmentSt.DRAFT || status === ShipmentSt.CONFIRMED) &&
    parcelCount > 0;
  const canArrive = status === ShipmentSt.IN_TRANSIT;

  return (
    <div
      key={`${status}-${updatedAtIso}`}
      className="flex flex-col gap-3 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm"
    >
      <h2 className="text-[15px] font-medium text-hh-earth-dk">Actions</h2>
      <p className="text-[13px] text-hh-muted">
        Confirme l’envoi, ajoute des colis collectés au lot, puis enregistre le
        départ. À l’arrivée, marque l’envoi comme arrivé.
      </p>
      <div className="flex flex-wrap gap-2">
        {canConfirm ? (
          <Button
            type="button"
            disabled={pending}
            variant="outline"
            className="border-hh-sand-dk/40"
            onClick={() =>
              run("Confirmation", "Envoi confirmé ✓", () => patchStatus(ShipmentSt.CONFIRMED))
            }
          >
            Confirmer l’envoi
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={pending || !canDispatch}
          className="bg-hh-saffron text-white hover:bg-hh-saffron-dk disabled:opacity-50"
          onClick={() =>
            run(
              "Départ",
              "Départ enregistré — envoi en transit",
              postDispatch,
              {
                loading: "Enregistrement du départ…",
                successDescription:
                  "Le lot est passé en transit. Les expéditeurs voient la mise à jour sur le suivi.",
                duration: 6500,
              },
            )
          }
        >
          Enregistrer le départ
        </Button>
        <Button
          type="button"
          disabled={pending || !canArrive}
          variant="secondary"
          className="bg-hh-earth-lt text-hh-earth-dk hover:bg-hh-sand-dk/40 disabled:opacity-50"
          onClick={() => run("Arrivée", "Envoi marqué arrivé à destination ✓", postArrive)}
        >
          Marquer arrivé à destination
        </Button>
      </div>
      {!canDispatch &&
      (status === ShipmentSt.DRAFT || status === ShipmentSt.CONFIRMED) ? (
        <p className="text-[12px] text-hh-muted">
          Ajoute au moins un colis au statut « Collecté » pour pouvoir enregistrer
          le départ.
        </p>
      ) : null}
      {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}
    </div>
  );
}
