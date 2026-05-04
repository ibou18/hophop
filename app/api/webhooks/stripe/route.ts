import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  PaymentStatus,
} from "@/app/generated/prisma/enums";
import { scheduleNotificationDispatch } from "@/lib/notifications/schedule";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return jsonError("Stripe non configuré", 500);
  }
  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return jsonError("Signature manquante", 400);
  const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return jsonError("Signature invalide", 400);
  }
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const intentId = pi.id;
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: intentId },
      select: {
        id: true,
        parcelId: true,
        clientId: true,
        status: true,
        client: { select: { email: true, phone: true } },
      },
    });
    if (payment && payment.status !== PaymentStatus.PAID) {
      const channel = payment.client.email
        ? NotificationChannel.EMAIL
        : NotificationChannel.SMS;
      const notifIds = await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });
        await tx.parcel.update({
          where: { id: payment.parcelId },
          data: { isPaid: true },
        });
        const n = await tx.notification.create({
          data: {
            parcelId: payment.parcelId,
            clientId: payment.clientId,
            channel,
            type: NotificationType.PAYMENT_CONFIRMED,
            status: NotificationStatus.PENDING,
          },
        });
        const nPush = await tx.notification.create({
          data: {
            parcelId: payment.parcelId,
            clientId: payment.clientId,
            channel: NotificationChannel.PUSH,
            type: NotificationType.PAYMENT_CONFIRMED,
            status: NotificationStatus.PENDING,
          },
        });
        return [n.id, nPush.id];
      });
      scheduleNotificationDispatch(notifIds);
    }
  }
  return jsonOk({ received: true });
}
