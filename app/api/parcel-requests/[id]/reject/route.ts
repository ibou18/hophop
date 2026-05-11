import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  // Token depuis body ou query
  let token: string | null = null;
  const url = new URL(req.url);
  token = url.searchParams.get("token");
  if (!token) {
    try {
      const body = await req.json();
      token = (body as { token?: string }).token ?? null;
    } catch { /* pas de body JSON */ }
  }

  const pr = await prisma.parcelRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      clientId: true,
      quoteToken: true,
    },
  });

  if (!pr) return jsonError("Demande introuvable", 404);
  if (pr.clientId !== auth.clientId) return jsonError("Non autorisé", 403);
  if (pr.status !== "QUOTED") {
    return jsonError("Cette demande n'est plus en attente de réponse.", 409);
  }
  if (token) {
    if (!pr.quoteToken || pr.quoteToken !== token) {
      return jsonError(
        "Ce lien n'est plus valide (offre renouvelée ou expirée). Ouvrez « Mes demandes » pour répondre.",
        403,
      );
    }
  }

  // Remettre en PENDING — un autre forwarder peut faire une offre
  await prisma.parcelRequest.update({
    where: { id },
    data: {
      status: "PENDING",
      quotedPrice: null,
      quotedCurrency: null,
      quotedForwarderId: null,
      quotedShipmentId: null,
      quotedAt: null,
      quoteExpiresAt: null,
      quoteToken: null,
      quoteNote: null,
    },
  });

  return jsonOk({ ok: true });
}
