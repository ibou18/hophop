import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { z } from "zod";
import { PricingType, Currency, Country, TransportMode } from "@/app/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

const countryValues = Object.values(Country) as [Country, ...Country[]];
const pricingTypeValues = Object.values(PricingType) as [PricingType, ...PricingType[]];
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
const transportModeValues = Object.values(TransportMode) as [TransportMode, ...TransportMode[]];

const patchSchema = z.object({
  destinationCountry: z.enum(countryValues).nullable().optional(),
  transportMode: z.enum(transportModeValues).nullable().optional(),
  pricingType: z.enum(pricingTypeValues).optional(),
  ratePerKg: z.number().positive().nullable().optional(),
  ratePerBox: z.number().positive().nullable().optional(),
  flatRate: z.number().positive().nullable().optional(),
  ratePerVolume: z.number().positive().nullable().optional(),
  volumeDivisor: z.number().positive().optional(),
  minimumCharge: z.number().min(0).optional(),
  currency: z.enum(currencyValues).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.forwarderTariff.findFirst({
    where: { id, forwarderId: auth.forwarderId },
  });
  if (!existing) return jsonError("Tarif introuvable", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const tariff = await prisma.forwarderTariff.update({
    where: { id },
    data: parsed.data,
  });

  return jsonOk(tariff);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.forwarderTariff.findFirst({
    where: { id, forwarderId: auth.forwarderId },
  });
  if (!existing) return jsonError("Tarif introuvable", 404);

  await prisma.forwarderTariff.delete({ where: { id } });

  return jsonOk({ deleted: true });
}
