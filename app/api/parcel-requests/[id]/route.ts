import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { deleteParcelRequestImageFromS3 } from "@/lib/s3-presign";
import { apiLogError } from "@/lib/server-api-log";

const itemCategory = z.enum([
  "CLOTHING",
  "ELECTRONICS",
  "FOOD",
  "COSMETICS",
  "DOCUMENTS",
  "OTHER",
] as const);

const countryEnum = z.enum([
  "CA",
  "FR",
  "GN",
  "SN",
  "CI",
  "CM",
  "TG",
  "BF",
  "NG",
  "BE",
  "CH",
  "US",
  "GM",
  "ML",
] as const);

const patchSchema = z
  .object({
    recipientId: z.string().uuid().optional(),
    maxDepartureDate: z.string().datetime({ message: "Date invalide" }).optional(),
    originCountry: countryEnum.optional().nullable(),
    originCity: z.string().optional().nullable(),
    originLatitude: z.number().optional().nullable(),
    originLongitude: z.number().optional().nullable(),
    weightKg: z.number().positive().optional().nullable(),
    lengthCm: z.number().positive().optional().nullable(),
    widthCm: z.number().positive().optional().nullable(),
    heightCm: z.number().positive().optional().nullable(),
    description: z.string().optional().nullable(),
    declaredValue: z.number().nonnegative().optional().nullable(),
    items: z
      .array(
        z.object({
          name: z.string().min(1),
          quantity: z.number().int().positive().default(1),
          category: itemCategory.default("OTHER"),
          weightKg: z.number().positive().optional(),
          notes: z.string().optional(),
        }),
      )
      .min(1)
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — modifier une demande (statut PENDING uniquement). */
export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }

  const existing = await prisma.parcelRequest.findFirst({
    where: { id, clientId: auth.clientId },
    select: { id: true, status: true },
  });
  if (!existing) return jsonError("Demande introuvable", 404);
  if (existing.status !== "PENDING") {
    return jsonError(
      "Cette demande ne peut plus être modifiée (une offre a été faite ou le statut ne le permet pas).",
      409,
    );
  }

  const data = parsed.data;

  if (data.recipientId) {
    const recipient = await prisma.recipient.findFirst({
      where: { id: data.recipientId, clientId: auth.clientId },
      select: { id: true },
    });
    if (!recipient) return jsonError("Destinataire introuvable", 404);
  }

  const {
    items,
    recipientId,
    maxDepartureDate: maxRaw,
    ...restPatch
  } = data;

  await prisma.$transaction(async (tx) => {
    await tx.parcelRequest.update({
      where: { id },
      data: {
        ...restPatch,
        ...(recipientId !== undefined ? { recipientId } : {}),
        ...(maxRaw !== undefined ? { maxDepartureDate: new Date(maxRaw) } : {}),
        ...(items
          ? {
              items: {
                deleteMany: {},
                create: items.map((it) => ({
                  name: it.name,
                  quantity: it.quantity,
                  category: it.category,
                  weightKg: it.weightKg ?? undefined,
                  notes: it.notes ?? undefined,
                })),
              },
            }
          : {}),
      },
    });
  });

  const updated = await prisma.parcelRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      maxDepartureDate: true,
      updatedAt: true,
    },
  });

  return jsonOk(updated);
}

/** DELETE — supprimer la demande et les fichiers S3 associés. Interdit si MATCHED. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;

  const parcelRequest = await prisma.parcelRequest.findFirst({
    where: { id, clientId: auth.clientId },
    select: { id: true, status: true },
  });

  if (!parcelRequest) return jsonError("Demande introuvable", 404);
  if (parcelRequest.status === "MATCHED") {
    return jsonError(
      "Impossible de supprimer : un colis a déjà été créé à partir de cette demande.",
      409,
    );
  }

  const imageRows = await prisma.parcelRequestImage.findMany({
    where: { parcelRequestId: id },
    select: { id: true, url: true },
  });

  for (const img of imageRows) {
    try {
      await deleteParcelRequestImageFromS3(img.url);
    } catch (e) {
      apiLogError(
        "DELETE /api/parcel-requests/[id]",
        "s3_delete_failed",
        e,
        { imageId: img.id, parcelRequestId: id },
      );
    }
  }

  await prisma.parcelRequest.delete({ where: { id } });

  return jsonOk({ ok: true });
}
