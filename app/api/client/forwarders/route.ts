import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { z } from "zod";

// GET /api/client/forwarders — liste les transitaires liés au client connecté
export async function GET() {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  const links = await prisma.clientForwarder.findMany({
    where: { clientId: auth.clientId },
    include: {
      forwarder: {
        select: {
          id: true,
          name: true,
          code5: true,
          country: true,
          city: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk(links.map((l) => l.forwarder));
}

const linkSchema = z.object({ code5: z.string().length(5).regex(/^\d{5}$/) });

// POST /api/client/forwarders — lier un transitaire supplémentaire via son code5
export async function POST(req: Request) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON invalide", 400);
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return jsonError("Code invalide", 422);

  const forwarder = await prisma.forwarder.findUnique({
    where: { code5: parsed.data.code5 },
    select: { id: true, name: true, code5: true, isActive: true },
  });
  if (!forwarder?.isActive) return jsonError("Code transitaire invalide", 404);

  try {
    await prisma.clientForwarder.create({
      data: { clientId: auth.clientId, forwarderId: forwarder.id },
    });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "P2002") return jsonError("Déjà lié à ce transitaire", 409);
    throw e;
  }

  return jsonOk({ id: forwarder.id, name: forwarder.name, code5: forwarder.code5 }, 201);
}
