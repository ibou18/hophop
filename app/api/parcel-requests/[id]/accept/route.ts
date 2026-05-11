import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireClient } from "@/lib/require-auth";
import { generateTrackingCode } from "@/lib/codes";
import {
  TrackingEventType,
  TrackingActor,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
} from "@/app/generated/prisma/enums";
import { dispatchNotificationIds } from "@/lib/notifications/dispatch";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  // Lire le token depuis le body ou le query param (email = query, dashboard = body)
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
      recipientId: true,
      quoteToken: true,
      quoteExpiresAt: true,
      quotedForwarderId: true,
      quotedShipmentId: true,
      quotedPrice: true,
      quotedCurrency: true,
      weightKg: true,
      lengthCm: true,
      widthCm: true,
      heightCm: true,
      description: true,
      declaredValue: true,
      items: {
        select: { name: true, quantity: true, category: true, weightKg: true, notes: true },
      },
    },
  });

  if (!pr) return jsonError("Demande introuvable", 404);
  if (pr.clientId !== auth.clientId) return jsonError("Non autorisé", 403);
  if (pr.status !== "QUOTED") {
    return jsonError(
      pr.status === "MATCHED" ? "Cette demande a déjà été acceptée." : "Cette demande n'est plus en attente de réponse.",
      409,
    );
  }
  // Lien email : token obligatoire et doit matcher. Tableau de bord : pas de token,
  // la session (requireClient + clientId) suffit.
  if (token) {
    if (!pr.quoteToken || pr.quoteToken !== token) {
      return jsonError(
        "Ce lien n'est plus valide (offre renouvelée ou expirée). Ouvrez « Mes demandes » pour répondre.",
        403,
      );
    }
  }
  if (pr.quoteExpiresAt && pr.quoteExpiresAt < new Date()) {
    // L'offre a expiré — remettre en PENDING
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
    return jsonError("Cette offre a expiré. La demande est de nouveau disponible.", 410);
  }

  const forwarderId = pr.quotedForwarderId!;
  const shipmentId = pr.quotedShipmentId!;

  // Générer un trackingCode unique
  let trackingCode = generateTrackingCode();
  for (let i = 0; i < 15; i++) {
    const clash = await prisma.parcel.findUnique({ where: { trackingCode } });
    if (!clash) break;
    trackingCode = generateTrackingCode();
  }

  const notificationIds: string[] = [];

  const parcel = await prisma.$transaction(async (tx) => {
    // 1. Créer le vrai Parcel lié au forwarder et à l'envoi
    const p = await tx.parcel.create({
      data: {
        clientId: pr.clientId,
        forwarderId,
        recipientId: pr.recipientId,
        shipmentId,
        trackingCode,
        weightKg: pr.weightKg,
        lengthCm: pr.lengthCm,
        widthCm: pr.widthCm,
        heightCm: pr.heightCm,
        description: pr.description,
        declaredValue: pr.declaredValue,
        price: pr.quotedPrice,
        currency: pr.quotedCurrency ?? "EUR",
        items: {
          create: pr.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            category: it.category,
            weightKg: it.weightKg ?? null,
            notes: it.notes ?? null,
          })),
        },
      },
      select: { id: true, trackingCode: true },
    });

    // 2. Tracking event
    await tx.trackingEvent.create({
      data: {
        parcelId: p.id,
        type: TrackingEventType.PARCEL_DECLARED,
        actor: TrackingActor.CLIENT,
        actorId: pr.clientId,
      },
    });

    // 3. Lier client ↔ forwarder si pas déjà fait
    await tx.clientForwarder.upsert({
      where: { clientId_forwarderId: { clientId: pr.clientId, forwarderId } },
      create: { clientId: pr.clientId, forwarderId },
      update: {},
    });

    // 4. Notification client (confirmation colis créé)
    const nClient = await tx.notification.create({
      data: {
        parcelId: p.id,
        clientId: pr.clientId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.PARCEL_REGISTERED,
        status: NotificationStatus.PENDING,
      },
    });
    notificationIds.push(nClient.id);

    // 5. Notification forwarder (nouveau colis)
    const nForwarder = await tx.notification.create({
      data: {
        parcelId: p.id,
        forwarderId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.FORWARDER_NEW_PARCEL_DECLARED,
        status: NotificationStatus.PENDING,
      },
    });
    notificationIds.push(nForwarder.id);

    // 6. Marquer la ParcelRequest comme MATCHED
    await tx.parcelRequest.update({
      where: { id: pr.id },
      data: { status: "MATCHED", matchedParcelId: p.id },
    });

    return p;
  });

  // Envoyer les notifications hors transaction
  await dispatchNotificationIds(notificationIds);

  return jsonOk({ parcelId: parcel.id, trackingCode: parcel.trackingCode });
}
