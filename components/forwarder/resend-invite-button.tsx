"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

type Props = { clientId: string };

export function ResendInviteButton({ clientId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/forwarder/clients/${clientId}/resend-invite`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "Erreur lors de l'envoi.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-emerald-600">
        <CheckCircle2 className="size-4" />
        Invitation renvoyée avec succès.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
        className="gap-2 rounded-xl border-hh-sand-dk/40 text-[13px] text-hh-earth-dk hover:bg-hh-sand"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Mail className="size-4 text-hh-saffron-dk" />
        )}
        Renvoyer l&apos;invitation
      </Button>
      {error ? (
        <p className="text-[12px] text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
