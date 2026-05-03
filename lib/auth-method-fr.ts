import type { AuthMethod } from "@/app/generated/prisma/enums";

const LABELS: Record<AuthMethod, string> = {
  EMAIL: "E-mail",
  PHONE: "Téléphone",
};

export function authMethodLabelFr(method: AuthMethod): string {
  return LABELS[method] ?? method;
}
