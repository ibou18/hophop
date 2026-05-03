"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Country } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { Button } from "@/components/ui/button";

export function NewShipmentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [originCountry, setOriginCountry] = useState<Country>("CA");
  const [destinationCountry, setDestinationCountry] = useState<Country>("GN");
  const [destinationCity, setDestinationCity] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          originCountry,
          destinationCountry,
          destinationCity: destinationCity.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(json?.error ?? `Création impossible (${res.status})`);
        return;
      }
      if (json?.id) {
        router.push(`/shipments/${json.id}`);
        router.refresh();
        return;
      }
      setError("Réponse inattendue du serveur.");
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Pays d’origine
          </label>
          <select
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value as Country)}
            disabled={pending}
            className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Pays de destination
          </label>
          <select
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value as Country)}
            disabled={pending}
            className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="dest-city"
          className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
        >
          Ville de destination (optionnel)
        </label>
        <input
          id="dest-city"
          value={destinationCity}
          onChange={(e) => setDestinationCity(e.target.value)}
          disabled={pending}
          placeholder="ex. Conakry"
          className="h-10 w-full max-w-md rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="notes"
          className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
        >
          Notes (optionnel)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
          rows={3}
          className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 py-2 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
        />
      </div>

      {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
        >
          {pending ? "Création…" : "Créer l’envoi"}
        </Button>
      </div>
    </form>
  );
}
