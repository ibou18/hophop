"use client";

import { useEffect, useRef } from "react";
import type { Country } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import {
  callingCodePlus,
  countryToCountryCode,
  digitsOnly,
  formatPhoneAsYouType,
  PHONE_INPUT_CHAR_MAX,
  PHONE_NATIONAL_DIGITS_MAX,
} from "@/lib/phone-e164";
import { parsePhoneNumberFromString } from "libphonenumber-js";

type Props = {
  id: string;
  country: Country;
  /** Valeur affichée (format national), stockée dans le formulaire jusqu’au transform Zod → E.164. */
  nationalFormatted: string;
  onNationalChange: (v: string) => void;
  disabled?: boolean;
  inputClassName: string;
  error?: string;
  /** Chiffres max pour la partie nationale (défaut 14). */
  maxNationalDigits?: number;
  /** Attribut HTML maxlength sur le champ (défaut 22). */
  maxInputLength?: number;
};

export function PhoneCountryField({
  id,
  country,
  nationalFormatted,
  onNationalChange,
  disabled,
  inputClassName,
  error,
  maxNationalDigits = PHONE_NATIONAL_DIGITS_MAX,
  maxInputLength = PHONE_INPUT_CHAR_MAX,
}: Props) {
  const prevCountry = useRef(country);

  useEffect(() => {
    if (prevCountry.current !== country) {
      prevCountry.current = country;
      onNationalChange("");
    }
  }, [country, onNationalChange]);

  function handleChange(raw: string) {
    const t = raw.trim();
    const parsedLocal = parsePhoneNumberFromString(
      t,
      countryToCountryCode(country),
    );
    const parsedIntl =
      !parsedLocal?.isValid() && t.startsWith("+")
        ? parsePhoneNumberFromString(t)
        : parsedLocal;
    if (parsedIntl?.isValid()) {
      const national = parsedIntl.formatNational();
      const d = digitsOnly(national).slice(0, maxNationalDigits);
      onNationalChange(
        d.length === digitsOnly(national).length
          ? national
          : formatPhoneAsYouType(country, d),
      );
      return;
    }
    const capped = digitsOnly(raw).slice(0, maxNationalDigits);
    onNationalChange(formatPhoneAsYouType(country, capped));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <span
          className={cn(
            "flex h-10 shrink-0 items-center rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-hh-sand/50 px-3 font-mono text-[13px] text-hh-earth-dk tabular-nums",
            disabled && "opacity-50",
          )}
          aria-hidden
        >
          {callingCodePlus(country)}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={nationalFormatted}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={maxInputLength}
          placeholder="Numéro"
          className={cn(inputClassName, "min-w-0 flex-1 px-5")}
        />
      </div>
      {error ? (
        <p className="text-[11px] text-hh-kola" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
