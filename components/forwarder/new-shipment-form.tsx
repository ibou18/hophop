"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Country, TransportMode } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { Button } from "@/components/ui/button";
import { isoDateUtcToday } from "@/lib/iso-date-utc";
import { TransportModeSelector } from "@/components/transport-mode-selector";
import {
  GooglePlacesAddressField,
  type PlaceResolved,
} from "@/components/maps/google-places-address";
import {
  ShipmentPricingSection,
  DEFAULT_SHIPMENT_PRICING,
  pricingStateToPayload,
  type ShipmentPricingState,
} from "@/components/forwarder/shipment-pricing-section";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Props = {
  defaultDepartureDate: string;
};

function cityLabel(place: PlaceResolved | null, fallback: string): string | undefined {
  if (place) return place.city?.trim() || place.formattedAddress.split(",")[0]?.trim() || place.formattedAddress;
  return fallback.trim() || undefined;
}

export function NewShipmentForm({ defaultDepartureDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [originCountry, setOriginCountry] = useState<Country>("CA");
  const [destinationCountry, setDestinationCountry] = useState<Country>("GN");
  const [transportMode, setTransportMode] = useState<TransportMode>("AIR");
  const [originCityInput, setOriginCityInput] = useState("");
  const [originPlace, setOriginPlace] = useState<PlaceResolved | null>(null);
  const [destinationCityInput, setDestinationCityInput] = useState("");
  const [destinationPlace, setDestinationPlace] = useState<PlaceResolved | null>(null);
  const [notes, setNotes] = useState("");
  const minDate = defaultDepartureDate || isoDateUtcToday();
  const [departureDate, setDepartureDate] = useState(minDate);
  const [pricing, setPricing] = useState<ShipmentPricingState>(DEFAULT_SHIPMENT_PRICING);

  const inputClass =
    "h-10 w-full max-w-md rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    if (mapsApiKey) {
      if (!originPlace) {
        setError("Ville de départ : sélectionne une suggestion dans la liste pour enregistrer le GPS.");
        return;
      }
      if (!destinationPlace) {
        setError("Ville d&apos;arrivée : sélectionne une suggestion dans la liste pour enregistrer le GPS.");
        return;
      }
    }

    if (originPlace?.country && originPlace.country !== originCountry) {
      setError("Le lieu de départ ne correspond pas au pays d'origine sélectionné.");
      return;
    }
    if (destinationPlace?.country && destinationPlace.country !== destinationCountry) {
      setError("La ville d'arrivée ne correspond pas au pays de destination sélectionné.");
      return;
    }

    const payload = {
      originCountry,
      destinationCountry,
      transportMode,
      originCity: cityLabel(originPlace, originCityInput),
      destinationCity: cityLabel(destinationPlace, destinationCityInput),
      ...(originPlace ? { originLatitude: originPlace.latitude, originLongitude: originPlace.longitude } : {}),
      ...(destinationPlace ? { destinationLatitude: destinationPlace.latitude, destinationLongitude: destinationPlace.longitude } : {}),
      departureDate,
      notes: notes.trim() || undefined,
      ...pricingStateToPayload(pricing),
    };

    startTransition(async () => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? `Création impossible (${res.status})`);
        return;
      }
      if (json?.id) { router.push(`/shipments/${json.id}`); return; }
      setError("Réponse inattendue du serveur.");
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
          Mode de transport
        </p>
        <TransportModeSelector value={transportMode} onChange={setTransportMode} disabled={pending} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Pays d&apos;origine
          </label>
          <select
            value={originCountry}
            onChange={(e) => {
              setOriginCountry(e.target.value as Country);
              setOriginCityInput("");
              setOriginPlace(null);
            }}
            disabled={pending}
            className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Ville de départ
          </label>
          <GooglePlacesAddressField
            key={originCountry}
            apiKey={mapsApiKey}
            value={originCityInput}
            onChangeText={(v) => {
              setOriginCityInput(v);
              if (!v.trim()) setOriginPlace(null);
            }}
            onResolved={(p) => {
              setOriginPlace(p);
              setOriginCityInput(p.city ?? p.formattedAddress.split(",")[0]?.trim() ?? p.formattedAddress);
            }}
            disabled={pending}
            placeholder="ex. Montréal"
            inputClassName={inputClass}
            restrictCountry={originCountry}
          />
          {originPlace ? (
            <p className="text-[11px] text-green-600">
              GPS enregistré ({originPlace.latitude.toFixed(4)}, {originPlace.longitude.toFixed(4)})
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Pays de destination
          </label>
          <select
            value={destinationCountry}
            onChange={(e) => {
              setDestinationCountry(e.target.value as Country);
              setDestinationCityInput("");
              setDestinationPlace(null);
            }}
            disabled={pending}
            className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Ville d&apos;arrivée
          </label>
          <GooglePlacesAddressField
            key={destinationCountry}
            apiKey={mapsApiKey}
            value={destinationCityInput}
            onChangeText={(v) => {
              setDestinationCityInput(v);
              if (!v.trim()) setDestinationPlace(null);
            }}
            onResolved={(p) => {
              setDestinationPlace(p);
              setDestinationCityInput(p.city ?? p.formattedAddress.split(",")[0]?.trim() ?? p.formattedAddress);
            }}
            disabled={pending}
            placeholder="ex. Conakry"
            inputClassName={inputClass}
            restrictCountry={destinationCountry}
          />
          {destinationPlace ? (
            <p className="text-[11px] text-green-600">
              GPS enregistré ({destinationPlace.latitude.toFixed(4)}, {destinationPlace.longitude.toFixed(4)})
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="departure-date"
          className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
        >
          Date d&apos;envoi
        </label>
        <input
          id="departure-date"
          type="date"
          required
          min={minDate}
          suppressHydrationWarning
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          disabled={pending}
          className="h-10 w-full max-w-xs rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
        />
        <p className="text-[12px] text-hh-muted">
          Passée cette date (UTC), l&apos;envoi ne sera plus proposé sur la vitrine ni dans le catalogue client.
        </p>
      </div>

      <ShipmentPricingSection
        value={pricing}
        onChange={setPricing}
        disabled={pending}
      />

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
          {pending ? "Création…" : "Créer l'envoi"}
        </Button>
      </div>
    </form>
  );
}
