"use client";

import { usePathname, useRouter } from "next/navigation";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import type { Country } from "@/app/generated/prisma/enums";

type ClientsCountryFilterProps = {
  value: Country | null;
};

function countryFlagEmoji(code: string): string {
  const upper = code.trim().toUpperCase();
  if (upper.length !== 2) return "🌍";
  const [first, second] = upper;
  const base = 127397;
  return String.fromCodePoint(
    first.charCodeAt(0) + base,
    second.charCodeAt(0) + base,
  );
}

export function ClientsCountryFilter({ value }: ClientsCountryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
        Pays
      </span>
      <select
        name="country"
        defaultValue={value ?? ""}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          router.push(
            nextValue
              ? `${pathname}?country=${encodeURIComponent(nextValue)}`
              : pathname,
          );
        }}
        className="h-10 min-w-[240px] rounded-lg border border-hh-sand-dk/40 bg-white px-3 text-[14px] text-hh-earth-dk outline-none transition focus:border-hh-saffron/70 focus:ring-2 focus:ring-hh-saffron/20"
      >
        <option value="">🌍 Tous les pays</option>
        {COUNTRY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {countryFlagEmoji(o.value)} {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
