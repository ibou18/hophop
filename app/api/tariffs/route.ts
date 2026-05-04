import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { z } from "zod";
import { PricingType, Currency, Country, TransportMode } from "@/app/generated/prisma/enums";

const countryValues = Object.values(Country) as [Country, ...Country[]];
const pricingTypeValues = Object.values(PricingType) as [PricingType, ...PricingType[]];
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
const transportModeValues = Object.values(TransportMode) as [TransportMode, ...TransportMode[]];

const createTariffSchema = z
  .object({
    destinationCountry: z.enum(countryValues).nullable().optional(),
    transportMode: z.enum(transportModeValues).nullable().optional(),
    pricingType: z.enum(pricingTypeValues),
    ratePerKg: z.number().positive().nullable().optional(),
    ratePerBox: z.number().positive().nullable().optional(),
    flatRate: z.number().positive().nullable().optional(),
    ratePerVolume: z.number().positive().nullable().optional(),
    volumeDivisor: z.number().positive().optional(),
    minimumCharge: z.number().min(0).optional(),
    currency: z.enum(currencyValues).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricingType === "WEIGHT_KG" && !data.ratePerKg) {
      ctx.addIssue({ code: "custom", message: "ratePerKg requis", path: ["ratePerKg"] });
    }
    if (data.pricingType === "PER_BOX" && !data.ratePerBox) {
      ctx.addIssue({ code: "custom", message: "ratePerBox requis", path: ["ratePerBox"] });
    }
    if (data.pricingType === "FLAT" && !data.flatRate) {
      ctx.addIssue({ code: "custom", message: "flatRate requis", path: ["flatRate"] });
    }
    if (data.pricingType === "VOLUMETRIC" && !data.ratePerVolume) {
      ctx.addIssue({ code: "custom", message: "ratePerVolume requis", path: ["ratePerVolume"] });
    }
  });

export async function GET() {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const tariffs = await prisma.forwarderTariff.findMany({
    where: { forwarderId: auth.forwarderId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return jsonOk(tariffs);
}

export async function POST(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = createTariffSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const d = parsed.data;
  const tariff = await prisma.forwarderTariff.create({
    data: {
      forwarderId: auth.forwarderId,
      destinationCountry: d.destinationCountry ?? null,
      transportMode: d.transportMode ?? null,
      pricingType: d.pricingType,
      ratePerKg: d.ratePerKg ?? null,
      ratePerBox: d.ratePerBox ?? null,
      flatRate: d.flatRate ?? null,
      ratePerVolume: d.ratePerVolume ?? null,
      volumeDivisor: d.volumeDivisor ?? 5000,
      minimumCharge: d.minimumCharge ?? 0,
      currency: d.currency ?? "EUR",
      sortOrder: d.sortOrder ?? 0,
    },
  });

  return jsonOk(tariff, 201);
}
