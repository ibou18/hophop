import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";

export async function GET(req: Request) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return jsonError("Requête trop courte (min. 3 caractères)", 400);

  const clients = await prisma.client.findMany({
    where: {
      forwarders: { some: { forwarderId: auth.forwarderId } },
      isActive: true,
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      recipients: {
        orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          country: true,
          isDefault: true,
        },
      },
    },
    take: 5,
  });

  return jsonOk(clients);
}
