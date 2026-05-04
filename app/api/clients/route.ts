import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { createClientSchema } from "@/lib/validations/client";

export async function GET() {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;
  const clients = await prisma.client.findMany({
    where: {
      forwarders: { some: { forwarderId: auth.forwarderId } },
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      authMethod: true,
      createdAt: true,
    },
  });
  return jsonOk(clients);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  if (data.authMethod === "EMAIL" && !data.email) {
    return jsonError("Email requis pour auth EMAIL", 400);
  }
  if (data.authMethod === "PHONE" && !data.phone) {
    return jsonError("Téléphone requis pour auth PHONE", 400);
  }
  const forwarder = await prisma.forwarder.findUnique({
    where: { code5: data.code5 },
  });
  if (!forwarder?.isActive) {
    return jsonError("Code transitaire invalide", 404);
  }
  const passwordHash = await hash(data.password, 12);
  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email?.toLowerCase() ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          country: data.country,
          authMethod: data.authMethod,
          passwordHash,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
          authMethod: true,
          createdAt: true,
        },
      });
      await tx.clientForwarder.create({
        data: { clientId: c.id, forwarderId: forwarder.id },
      });
      return c;
    });
    return jsonOk(client, 201);
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return jsonError("Email ou téléphone déjà utilisé", 409);
    }
    throw e;
  }
}
