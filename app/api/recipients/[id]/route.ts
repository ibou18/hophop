import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const existing = await prisma.recipient.findFirst({
    where: { id, clientId: auth.clientId },
  });
  if (!existing) return jsonError("Introuvable", 404);
  await prisma.recipient.delete({ where: { id } });
  return jsonOk({ ok: true });
}
