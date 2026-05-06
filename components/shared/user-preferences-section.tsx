"use client";

import { Globe, Clock } from "lucide-react";
import {
  LOCALE_OPTIONS,
  groupTimezones,
} from "@/lib/user-preferences";

const inputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-60";

const labelClass =
  "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-hh-muted";

interface Props {
  locale: string;
  timezone: string;
  onLocaleChange: (v: string) => void;
  onTimezoneChange: (v: string) => void;
  disabled?: boolean;
}

export function UserPreferencesSection({
  locale,
  timezone,
  onLocaleChange,
  onTimezoneChange,
  disabled = false,
}: Props) {
  const timezoneGroups = groupTimezones();

  return (
    <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-medium text-hh-earth-dk">Préférences</h2>
      <p className="mt-1 text-[13px] text-hh-muted">
        Langue d'interface et fuseau horaire utilisés pour l'affichage des
        dates et des heures.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Langue */}
        <div className="space-y-1.5">
          <label htmlFor="pref-locale" className={labelClass}>
            <Globe size={13} />
            Langue
          </label>
          <select
            id="pref-locale"
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            {LOCALE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.nativeLabel} — {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fuseau horaire */}
        <div className="space-y-1.5">
          <label htmlFor="pref-timezone" className={labelClass}>
            <Clock size={13} />
            Fuseau horaire
          </label>
          <select
            id="pref-timezone"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            {timezoneGroups.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-[11px] text-hh-muted">
            Important pour l'affichage correct des horaires de départ et
            d'arrivée des envois.
          </p>
        </div>
      </div>
    </section>
  );
}
