"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPreferencesSection } from "@/components/shared/user-preferences-section";

export function ClientPreferencesForm({
  initialLocale,
  initialTimezone,
}: {
  initialLocale: string;
  initialTimezone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locale, setLocale] = useState(initialLocale);
  const [timezone, setTimezone] = useState(initialTimezone);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/client/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ locale, timezone }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success("Préférences enregistrées ✓");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <UserPreferencesSection
        locale={locale}
        timezone={timezone}
        onLocaleChange={setLocale}
        onTimezoneChange={setTimezone}
        disabled={pending}
      />

      <Button
        type="submit"
        disabled={pending}
        className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
      >
        {pending ? "Enregistrement…" : "Enregistrer les préférences"}
      </Button>
    </form>
  );
}
