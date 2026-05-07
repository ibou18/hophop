"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ParcelPaymentToggle({
  parcelId,
  isPaid,
  compact = false,
}: {
  parcelId: string;
  isPaid: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [paid, setPaid] = useState(isPaid);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function togglePaid(): void {
    if (pending) return;
    const nextPaid = !paid;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isPaid: nextPaid }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? `Mise à jour impossible (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }
      setPaid(nextPaid);
      toast.success(nextPaid ? "Colis marqué comme payé" : "Paiement retiré");
      router.refresh();
    });
  }

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      {!compact ? (
        <p className="text-[12px] text-hh-muted">{paid ? "Payé" : "Non payé"}</p>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={paid}
        aria-label={paid ? "Marquer comme non payé" : "Marquer comme payé"}
        onClick={togglePaid}
        disabled={pending}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60",
          paid ? "bg-hh-savane" : "bg-hh-muted/50",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            paid ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {error ? <p className="text-[12px] text-hh-kola">{error}</p> : null}
    </div>
  );
}
