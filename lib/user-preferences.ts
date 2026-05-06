/**
 * Préférences utilisateur — locales et fuseaux horaires IANA.
 * Liste volontairement limitée aux marchés couverts par Hophop.
 */

export interface LocaleOption {
  value: string;
  label: string;
  nativeLabel: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: "fr", label: "Français",  nativeLabel: "Français" },
  { value: "en", label: "Anglais",   nativeLabel: "English" },
];

export interface TimezoneOption {
  value: string;   // IANA identifier
  label: string;   // Nom affiché
  offset: string;  // Ex. UTC−5
  group: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // ── Canada ────────────────────────────────────────────────────────────
  { value: "America/Toronto",   label: "Toronto / Montréal (Est)",    offset: "UTC−5/−4", group: "Canada" },
  { value: "America/Vancouver", label: "Vancouver (Pacifique)",        offset: "UTC−8/−7", group: "Canada" },
  { value: "America/Edmonton",  label: "Calgary / Edmonton (Rocheuses)", offset: "UTC−7/−6", group: "Canada" },
  { value: "America/Winnipeg",  label: "Winnipeg (Centre)",            offset: "UTC−6/−5", group: "Canada" },
  { value: "America/Halifax",   label: "Halifax (Atlantique)",         offset: "UTC−4/−3", group: "Canada" },
  { value: "America/St_Johns",  label: "Saint-Jean (Terre-Neuve)",     offset: "UTC−3:30/−2:30", group: "Canada" },

  // ── Europe ────────────────────────────────────────────────────────────
  { value: "Europe/Paris",      label: "Paris / Lyon (France)",        offset: "UTC+1/+2", group: "Europe" },
  { value: "Europe/London",     label: "Londres (Royaume-Uni)",        offset: "UTC+0/+1", group: "Europe" },
  { value: "Europe/Brussels",   label: "Bruxelles / Luxembourg",       offset: "UTC+1/+2", group: "Europe" },

  // ── Afrique de l'Ouest ────────────────────────────────────────────────
  { value: "Africa/Abidjan",    label: "Abidjan (Côte d'Ivoire, Sénégal, Guinée)", offset: "UTC+0", group: "Afrique de l'Ouest" },
  { value: "Africa/Conakry",    label: "Conakry (Guinée)",             offset: "UTC+0", group: "Afrique de l'Ouest" },
  { value: "Africa/Dakar",      label: "Dakar (Sénégal)",              offset: "UTC+0", group: "Afrique de l'Ouest" },
  { value: "Africa/Lome",       label: "Lomé (Togo)",                  offset: "UTC+0", group: "Afrique de l'Ouest" },
  { value: "Africa/Lagos",      label: "Lagos (Nigeria)",              offset: "UTC+1", group: "Afrique de l'Ouest" },

  // ── Afrique Centrale ─────────────────────────────────────────────────
  { value: "Africa/Douala",     label: "Douala (Cameroun)",            offset: "UTC+1", group: "Afrique Centrale" },
  { value: "Africa/Brazzaville",label: "Brazzaville / Kinshasa",      offset: "UTC+1", group: "Afrique Centrale" },

  // ── Référence ─────────────────────────────────────────────────────────
  { value: "UTC",               label: "UTC (référence universelle)",  offset: "UTC+0", group: "Référence" },
];

/** Regrouper par `group` pour afficher des `<optgroup>` dans un `<select>`. */
export function groupTimezones(): { group: string; options: TimezoneOption[] }[] {
  const map = new Map<string, TimezoneOption[]>();
  for (const tz of TIMEZONE_OPTIONS) {
    const list = map.get(tz.group) ?? [];
    list.push(tz);
    map.set(tz.group, list);
  }
  return Array.from(map.entries()).map(([group, options]) => ({ group, options }));
}

/** Retourne le label d'une timezone, avec fallback sur la valeur brute. */
export function timezoneLabelFr(value: string): string {
  return TIMEZONE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

export function localeLabelFr(value: string): string {
  return LOCALE_OPTIONS.find((l) => l.value === value)?.label ?? value;
}
