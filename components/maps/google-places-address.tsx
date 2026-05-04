"use client";

import { useEffect, useRef, useState } from "react";
import type { Country } from "@/app/generated/prisma/enums";

const ISO_TO_COUNTRY: Record<string, Country> = {
  CA: "CA",
  FR: "FR",
  GN: "GN",
  SN: "SN",
  CI: "CI",
  CM: "CM",
};

type PlaceResolved = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: Country;
};

type MapsNs = {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: { fields?: string[] },
      ) => {
        addListener: (ev: string, fn: () => void) => void;
        getPlace: () => GPlace | undefined;
      };
    };
  };
};

type GPlace = {
  formatted_address?: string;
  geometry?: { location?: { lat: () => number; lng: () => number } };
  address_components?: Array<{
    short_name: string;
    long_name: string;
    types: string[];
  }>;
};

let mapsScriptPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as Window & { google?: MapsNs };
  if (w.google?.maps?.places) return Promise.resolve();
  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise((resolve, reject) => {
      const id = "hh-google-maps-places";
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        const ww = window as Window & { google?: MapsNs };
        if (ww.google?.maps?.places) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Google Maps script")),
          { once: true },
        );
        return;
      }
      const script = document.createElement("script");
      script.id = id;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps script"));
      document.head.appendChild(script);
    });
  }
  return mapsScriptPromise;
}

function parsePlace(place: GPlace | undefined): PlaceResolved | null {
  if (!place?.geometry?.location) return null;
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const formattedAddress = place.formatted_address?.trim();
  if (!formattedAddress || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  let city: string | undefined;
  let countryIso: string | undefined;
  for (const c of place.address_components ?? []) {
    if (c.types.includes("locality")) city = c.long_name;
    if (!city && c.types.includes("postal_town")) city = c.long_name;
    if (c.types.includes("country")) countryIso = c.short_name;
  }
  const country =
    countryIso && ISO_TO_COUNTRY[countryIso]
      ? ISO_TO_COUNTRY[countryIso]
      : undefined;

  return {
    formattedAddress,
    latitude: lat,
    longitude: lng,
    ...(city ? { city } : {}),
    ...(country ? { country } : {}),
  };
}

/**
 * Champ adresse avec autocomplete Google Places (nécessite NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
 * Sans clé : champ texte simple relié à `value` / `onChange`.
 */
export function GooglePlacesAddressField({
  apiKey,
  value,
  onChangeText,
  onResolved,
  disabled,
  placeholder,
  inputClassName,
}: {
  apiKey: string | undefined;
  value: string;
  onChangeText: (v: string) => void;
  onResolved: (data: PlaceResolved) => void;
  disabled?: boolean;
  placeholder?: string;
  inputClassName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let cancelled = false;
    loadMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return;
        const w = window as Window & { google?: MapsNs };
        const Places = w.google?.maps?.places;
        if (!Places) {
          setLoadErr("API Places indisponible.");
          return;
        }
        const ac = new Places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "address_components"],
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const parsed = parsePlace(place);
          if (parsed) onResolvedRef.current(parsed);
        });
        setReady(true);
      })
      .catch(() => setLoadErr("Impossible de charger Google Maps."));

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />
      {loadErr ? (
        <p className="text-[12px] text-hh-kola">{loadErr}</p>
      ) : ready ? (
        <p className="text-[11px] text-hh-muted">
          Choisis une suggestion pour enregistrer la position GPS sur la carte.
        </p>
      ) : (
        <p className="text-[11px] text-hh-muted">Chargement de la recherche d’adresse…</p>
      )}
    </div>
  );
}
