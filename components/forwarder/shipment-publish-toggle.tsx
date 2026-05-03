"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";

export function ShipmentPublishToggle({
  shipmentId,
  isPublished,
}: {
  shipmentId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Erreur");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-hh-muted">
          Visible par les clients :{" "}
          <span
            className={
              isPublished
                ? "font-medium text-hh-savane-dk"
                : "font-medium text-hh-muted"
            }
          >
            {isPublished ? "Oui" : "Non"}
          </span>
        </span>
        <Button
          type="button"
          disabled={pending}
          variant="outline"
          className={
            isPublished
              ? "border-hh-kola/40 text-hh-kola hover:bg-hh-kola/5"
              : "border-hh-savane/40 text-hh-savane-dk hover:bg-hh-savane/5"
          }
          onClick={toggle}
        >
          {pending
            ? "…"
            : isPublished
              ? "Dépublier"
              : "Publier pour les clients"}
        </Button>
      </div>
      {error && <p className="text-[13px] text-hh-kola">{error}</p>}
    </div>
  );
}
