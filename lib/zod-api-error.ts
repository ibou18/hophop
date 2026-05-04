/** Corps renvoyé par `jsonError(..., { issues: parsed.error.flatten() })`. */
export type ZodFlattenPayload = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

export function messageFromZodFlatten(issues: ZodFlattenPayload): string {
  for (const msgs of Object.values(issues.fieldErrors ?? {})) {
    const m = msgs?.[0];
    if (m) return m;
  }
  const fe = issues.formErrors?.[0];
  if (fe) return fe;
  return "Données invalides.";
}
