import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { createRecipientSchema } from "@/lib/validations/recipient";

export async function GET() {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const recipients = await prisma.recipient.findMany({
    where: { clientId: auth.clientId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return jsonOk(recipients);
}

export async function POST(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createRecipientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  if (data.isDefault) {
    await prisma.recipient.updateMany({
      where: { clientId: auth.clientId },
      data: { isDefault: false },
    });
  }
  const recipient = await prisma.recipient.create({
    data: {
      clientId: auth.clientId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address ?? null,
      city: data.city,
      country: data.country,
      isDefault: data.isDefault ?? false,
    },
  });
  return jsonOk(recipient, 201);
}
