"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Country } from "@/app/generated/prisma/enums";

const ISO_TO_COUNTRY: Record<string, Country> = {
  BE: "BE",
  BF: "BF",
  CA: "CA",
  CH: "CH",
  CI: "CI",
  CM: "CM",
  FR: "FR",
  GM: "GM",
  GN: "GN",
  ML: "ML",
  NG: "NG",
  SN: "SN",
  TG: "TG",
  US: "US",
};

export type PlaceResolved = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: Country;
};

type Prediction = { description: string; placeId: string };

type GMaps = {
  maps: {
    places: {
      AutocompleteService: new () => AutocompleteSvc;
      PlacesService: new (el: HTMLElement) => PlacesSvc;
      PlacesServiceStatus: { OK: string };
      AutocompleteSessionToken: new () => object;
    };
  };
};

type AutocompleteSvc = {
  getPlacePredictions: (
    req: {
      input: string;
      types?: string[];
      componentRestrictions?: { country: string };
      sessionToken?: object;
    },
    cb: (
      results: Array<{ description: string; place_id: string }> | null,
      status: string,
    ) => void,
  ) => void;
};

type PlacesSvc = {
  getDetails: (
    req: { placeId: string; fields: string[]; sessionToken?: object },
    cb: (
      place: {
        formatted_address?: string;
        name?: string;
        geometry?: {
          location?: { lat: () => number; lng: () => number };
          viewport?: { getCenter: () => { lat: () => number; lng: () => number } };
        };
        address_components?: Array<{
          short_name: string;
          long_name: string;
          types: string[];
        }>;
      } | null,
      status: string,
    ) => void,
  ) => void;
};

let mapsScriptPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as Window & { google?: GMaps };
  if (w.google?.maps?.places) return Promise.resolve();
  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise((resolve, reject) => {
      const id = "hh-google-maps-places";
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        const ww = window as Window & { google?: GMaps };
        if (ww.google?.maps?.places) { resolve(); return; }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Google Maps")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.id = id;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps"));
      document.head.appendChild(script);
    });
  }
  return mapsScriptPromise;
}

function extractPlace(
  place: {
    formatted_address?: string;
    name?: string;
    geometry?: {
      location?: { lat: () => number; lng: () => number };
      viewport?: { getCenter: () => { lat: () => number; lng: () => number } };
    };
    address_components?: Array<{ short_name: string; long_name: string; types: string[] }>;
  } | null,
  fallbackDescription: string,
): PlaceResolved | null {
  if (!place) return null;
  let point = place.geometry?.location;
  try {
    const c = place.geometry?.viewport?.getCenter?.();
    if (c) point = c;
  } catch { /* garde location */ }
  if (!point) return null;
  const lat = point.lat();
  const lng = point.lng();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let city: string | undefined;
  let countryIso: string | undefined;
  for (const c of place.address_components ?? []) {
    if (c.types.includes("locality")) city = c.long_name;
    if (!city && c.types.includes("postal_town")) city = c.long_name;
    if (!city && c.types.includes("administrative_area_level_1")) city = c.long_name;
    if (c.types.includes("country")) countryIso = c.short_name;
  }
  const country =
    countryIso && ISO_TO_COUNTRY[countryIso] ? ISO_TO_COUNTRY[countryIso] : undefined;
  const formattedAddress =
    place.formatted_address?.trim() || place.name?.trim() || city?.trim() || fallbackDescription;

  return {
    formattedAddress,
    latitude: lat,
    longitude: lng,
    ...(city ? { city } : {}),
    ...(country ? { country } : {}),
  };
}

/**
 * Autocomplete de ville — utilise AutocompleteService + PlacesService (pas le widget Google).
 * Pas de mutation DOM externe → pas de race condition avec React state.
 * Sans clé API : champ texte simple.
 */
export function GooglePlacesAddressField({
  apiKey,
  value,
  onChangeText,
  onResolved,
  disabled,
  placeholder,
  inputClassName,
  restrictCountry,
}: {
  apiKey: string | undefined;
  value: string;
  onChangeText: (v: string) => void;
  onResolved: (data: PlaceResolved) => void;
  disabled?: boolean;
  placeholder?: string;
  inputClassName: string;
  restrictCountry?: Country;
}) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const acSvcRef = useRef<AutocompleteSvc | null>(null);
  const plSvcRef = useRef<PlacesSvc | null>(null);
  const dummyRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<object | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResolvedRef = useRef(onResolved);
  useEffect(() => { onResolvedRef.current = onResolved; }, [onResolved]);


  // Charger script + init services
  useEffect(() => {
    if (!apiKey || !dummyRef.current) return;
    loadMapsScript(apiKey)
      .then(() => {
        const w = window as Window & { google?: GMaps };
        const P = w.google?.maps?.places;
        if (!P) { setLoadErr("API Places indisponible."); return; }
        acSvcRef.current = new P.AutocompleteService();
        plSvcRef.current = new P.PlacesService(dummyRef.current!);
        sessionRef.current = new P.AutocompleteSessionToken();
      })
      .catch(() => setLoadErr("Impossible de charger Google Maps."));
  }, [apiKey]);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!acSvcRef.current || !input.trim()) {
        setPredictions([]);
        setOpen(false);
        return;
      }
      const req: Parameters<AutocompleteSvc["getPlacePredictions"]>[0] = {
        input,
        types: ["(cities)"],
        sessionToken: sessionRef.current ?? undefined,
      };
      if (restrictCountry) req.componentRestrictions = { country: restrictCountry.toLowerCase() };
      acSvcRef.current.getPlacePredictions(req, (results, status) => {
        if (status === "OK" && results?.length) {
          setPredictions(results.map((r) => ({ description: r.description, placeId: r.place_id })));
          setOpen(true);
        } else {
          setPredictions([]);
          setOpen(false);
        }
      });
    },
    [restrictCountry],
  );

  const handleChange = useCallback(
    (v: string) => {
      setQuery(v);
      onChangeText(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPredictions(v), 250);
    },
    [onChangeText, fetchPredictions],
  );

  const handleSelect = useCallback(
    (pred: Prediction) => {
      setQuery(pred.description);
      onChangeText(pred.description);
      setPredictions([]);
      setOpen(false);

      if (!plSvcRef.current) return;
      plSvcRef.current.getDetails(
        {
          placeId: pred.placeId,
          fields: ["geometry", "address_components", "formatted_address", "name"],
          sessionToken: sessionRef.current ?? undefined,
        },
        (place, status) => {
          const w = window as Window & { google?: GMaps };
          const OK = w.google?.maps?.places?.PlacesServiceStatus?.OK ?? "OK";
          if (status !== OK) return;
          const resolved = extractPlace(place, pred.description);
          if (resolved) onResolvedRef.current(resolved);
          // Nouveau token pour prochaine session
          const P = w.google?.maps?.places;
          if (P) sessionRef.current = new P.AutocompleteSessionToken();
        },
      );
    },
    [onChangeText],
  );

  if (!apiKey) {
    return (
      <input
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
    <div className="relative">
      <div ref={dummyRef} style={{ display: "none" }} aria-hidden />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />
      {loadErr ? (
        <p className="mt-1 text-[12px] text-hh-kola">{loadErr}</p>
      ) : null}
      {open && predictions.length > 0 ? (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white shadow-md">
          {predictions.map((p) => (
            <li
              key={p.placeId}
              onMouseDown={() => handleSelect(p)}
              className="cursor-pointer px-3 py-2 text-[14px] text-hh-earth-dk hover:bg-hh-sand"
            >
              {p.description}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
