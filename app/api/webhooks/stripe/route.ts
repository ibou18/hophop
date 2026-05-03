import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { PaymentStatus } from "@/app/generated/prisma/enums";

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
    });
    if (payment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        }),
        prisma.parcel.update({
          where: { id: payment.parcelId },
          data: { isPaid: true },
        }),
      ]);
    }
  }
  return jsonOk({ received: true });
}
