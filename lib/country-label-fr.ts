import type { Country } from "@/app/generated/prisma/enums";

const LABELS: Record<Country, string> = {
  BE: "Belgique",
  BF: "Burkina Faso",
  CA: "Canada",
  CH: "Suisse",
  CI: "Côte d’Ivoire",
  CM: "Cameroun",
  FR: "France",
  GM: "Gambie",
  GN: "Guinée",
  ML: "Mali",
  NG: "Nigeria",
  SN: "Sénégal",
  TG: "Togo",
  US: "États-Unis",
};

export function countryLabelFr(code: Country): string {
  return LABELS[code] ?? code;
}

export const COUNTRY_OPTIONS: { value: Country; label: string }[] = (
  Object.keys(LABELS) as Country[]
).map((value) => ({ value, label: LABELS[value] }));
