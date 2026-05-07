import { countryLabelFr } from "@/lib/country-label-fr";
import { getAppBaseUrl } from "@/lib/mail/app-url";
import type { Country } from "@/app/generated/prisma/enums";

/** Synthèse des routes (texte humain) à partir des shipments d'un transitaire */
export function describeRoutes(
  shipments: Array<{
    originCountry: Country | string;
    destinationCountry: Country | string;
    destinationCity: string | null;
  }>,
  max = 3,
): string {
  if (shipments.length === 0) return "";
  const seen = new Set<string>();
  const list: string[] = [];
  for (const s of shipments) {
    const key = `${s.originCountry}-${s.destinationCountry}-${s.destinationCity ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const dest = s.destinationCity
      ? `${s.destinationCity}`
      : countryLabelFr(s.destinationCountry as Country);
    list.push(`${countryLabelFr(s.originCountry as Country)} → ${dest}`);
    if (list.length >= max) break;
  }
  return list.join(" · ");
}

/** Liste des pays uniques desservis */
export function uniqueCountries(
  shipments: Array<{
    originCountry: Country | string;
    destinationCountry: Country | string;
  }>,
): { origins: Country[]; destinations: Country[] } {
  const o = new Set<Country>();
  const d = new Set<Country>();
  for (const s of shipments) {
    o.add(s.originCountry as Country);
    d.add(s.destinationCountry as Country);
  }
  return {
    origins: Array.from(o),
    destinations: Array.from(d),
  };
}

/** Construit un JSON-LD LocalBusiness pour un transitaire */
export function buildForwarderJsonLd(input: {
  name: string;
  code5: string;
  email: string;
  phone: string | null;
  city: string;
  country: Country | string;
  address: string | null;
  addressFormatted: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  logoUrl: string | null;
  destinationCountries: Country[];
}) {
  const url = `${getAppBaseUrl()}/p/${input.code5}`;
  const areaServed = input.destinationCountries.map((c) => ({
    "@type": "Country",
    name: countryLabelFr(c as Country),
  }));

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MovingCompany",
    name: input.name,
    url,
    email: input.email,
    description:
      input.description ??
      `Transitaire ${input.city}, ${countryLabelFr(input.country as Country)} sur Hophop.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.addressFormatted ?? input.address ?? undefined,
      addressLocality: input.city,
      addressCountry: input.country,
    },
    identifier: input.code5,
    sameAs: [url],
  };

  if (input.phone) ld.telephone = input.phone;
  if (input.logoUrl) ld.image = input.logoUrl;
  if (input.latitude != null && input.longitude != null) {
    ld.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }
  if (areaServed.length > 0) ld.areaServed = areaServed;

  return ld;
}
