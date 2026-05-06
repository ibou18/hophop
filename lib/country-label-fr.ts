import type { Country } from "@/app/generated/prisma/enums";

const LABELS: Record<Country, string> = {
  CA: "Canada",
  FR: "France",
  GN: "Guinée",
  SN: "Sénégal",
  CI: "Côte d’Ivoire",
  CM: "Cameroun",
  TG: "Togo",
  BF: "Burkina Faso",
  NG: "Nigeria",
};

export function countryLabelFr(code: Country): string {
  return LABELS[code] ?? code;
}

export const COUNTRY_OPTIONS: { value: Country; label: string }[] = (
  Object.keys(LABELS) as Country[]
).map((value) => ({ value, label: LABELS[value] }));
