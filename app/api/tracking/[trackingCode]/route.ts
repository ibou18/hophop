import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";

type Ctx = { params: Promise<{ trackingCode: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { trackingCode } = await ctx.params;
  const code = decodeURIComponent(trackingCode).trim();
  if (!code) return jsonError("Code requis", 400);
  const parcel = await prisma.parcel.findUnique({
    where: { trackingCode: code },
    include: {
      recipient: {
        select: {
          firstName: true,
          lastName: true,
          city: true,
          country: true,
        },
      },
      trackingEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          type: true,
          location: true,
          country: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });
  if (!parcel) return jsonError("Introuvable", 404);
  return jsonOk({
    trackingCode: parcel.trackingCode,
    status: parcel.status,
    description: parcel.description,
    recipient: parcel.recipient,
    events: parcel.trackingEvents,
  });
}
