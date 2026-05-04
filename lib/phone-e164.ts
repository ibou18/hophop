import type { Country } from "@/app/generated/prisma/enums";
import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

export function countryToCountryCode(c: Country): CountryCode {
  return c as CountryCode;
}

export function callingCodePlus(c: Country): string {
  return `+${getCountryCallingCode(countryToCountryCode(c))}`;
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Limite prudente pour la partie nationale (hors indicatif affiché). */
export const PHONE_NATIONAL_DIGITS_MAX = 14;

/** Longueur max du champ formaté (espaces inclus). */
export const PHONE_INPUT_CHAR_MAX = 22;

/** Saisie progressive (format national affiché). */
export function formatPhoneAsYouType(
  country: Country,
  digitChars: string,
): string {
  if (!digitChars) return "";
  const ayt = new AsYouType(countryToCountryCode(country));
  let out = "";
  for (const ch of digitChars) {
    if (/\d/.test(ch)) out = ayt.input(ch);
  }
  return out;
}

/** Chaîne affichée (national) ou E.164 → E.164 si valide. */
export function toE164(country: Country, input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  let pn = parsePhoneNumberFromString(t, countryToCountryCode(country));
  if (!pn?.isValid() && t.startsWith("+")) {
    pn = parsePhoneNumberFromString(t);
  }
  if (!pn?.isValid()) return null;
  return pn.format("E.164");
}
