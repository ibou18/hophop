import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCode5 } from "@/lib/codes";
import { jsonError, jsonOk } from "@/lib/http";
import { createForwarderSchema } from "@/lib/validations/forwarder";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code5 = searchParams.get("code5")?.trim();
  if (!code5 || !/^\d{5}$/.test(code5)) {
    return jsonError("Paramètre code5 requis (5 chiffres)", 400);
  }
  const forwarder = await prisma.forwarder.findFirst({
    where: { code5, isActive: true },
    select: {
      id: true,
      code5: true,
      name: true,
      logoUrl: true,
      country: true,
      city: true,
      paymentEnabled: true,
    },
  });
  if (!forwarder) {
    return jsonError("Transitaire introuvable", 404);
  }
  return jsonOk(forwarder);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }
  const parsed = createForwarderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, {
      issues: parsed.error.flatten(),
    });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();
  const existing = await prisma.forwarder.findUnique({ where: { email } });
  if (existing) {
    return jsonError("Email déjà utilisé", 409);
  }
  let code5 = generateCode5();
  for (let i = 0; i < 10; i++) {
    const clash = await prisma.forwarder.findUnique({ where: { code5 } });
    if (!clash) break;
    code5 = generateCode5();
  }
  const passwordHash = await hash(data.password, 12);
  const forwarder = await prisma.forwarder.create({
    data: {
      code5,
      name: data.name,
      email,
      phone: data.phone ?? null,
      country: data.country,
      city: data.city,
      address: data.address ?? null,
      description: data.description ?? null,
      passwordHash,
    },
    select: {
      id: true,
      code5: true,
      name: true,
      email: true,
      country: true,
      city: true,
      createdAt: true,
    },
  });
  return jsonOk(forwarder, 201);
}
