import { z } from "zod";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireForwarder } from "@/lib/require-auth";
import { getResendClient, getDefaultFromAddress } from "@/lib/mail/resend";
import { ParcelRequestQuoteEmail } from "@/emails/parcel-request-quote";
import { CURRENCY_SYMBOL } from "@/lib/pricing";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { Currency } from "@/app/generated/prisma/enums";

const quoteSchema = z.object({
  shipmentId: z.string().uuid("Envoi requis"),
  price: z.number().positive("Prix requis"),
  currency: z.enum(["EUR", "CAD", "XOF", "XAF", "GNF", "NGN"] as const),
  note: z.string().max(500).optional(),
});

const QUOTE_TTL_HOURS = 48;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireForwarder();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("JSON invalide", 400); }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation échouée", 422, { issues: parsed.error.flatten() });
  }

  const { shipmentId, price, currency, note } = parsed.data;

  // Charger la demande — doit être PENDING
  const pr = await prisma.parcelRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      maxDepartureDate: true,
      client: { select: { email: true, firstName: true } },
      recipient: { select: { country: true, city: true } },
    },
  });

  if (!pr) return jsonError("Demande introuvable", 404);
  if (pr.status !== "PENDING") {
    return jsonError(
      pr.status === "QUOTED"
        ? "Une offre est déjà en cours pour cette demande."
        : "Cette demande n'est plus disponible.",
      409,
    );
  }

  // Vérifier que l'envoi appartient au forwarder et est actif
  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      forwarderId: auth.forwarderId,
      status: { not: "CLOSED" },
    },
    select: {
      id: true,
      reference: true,
      departureDate: true,
      originCountry: true,
      destinationCountry: true,
      forwarder: { select: { name: true } },
    },
  });

  if (!shipment) return jsonError("Envoi introuvable ou non autorisé", 404);

  // La date de départ doit respecter la contrainte du client
  if (
    shipment.departureDate &&
    shipment.departureDate > pr.maxDepartureDate
  ) {
    return jsonError(
      "La date de départ de cet envoi dépasse la date maximale du client.",
      422,
    );
  }

  const quoteExpiresAt = new Date(
    Date.now() + QUOTE_TTL_HOURS * 60 * 60 * 1000,
  );

  const updated = await prisma.parcelRequest.update({
    where: { id },
    data: {
      status: "QUOTED",
      quotedPrice: price,
      quotedCurrency: currency,
      quotedForwarderId: auth.forwarderId,
      quotedShipmentId: shipmentId,
      quotedAt: new Date(),
      quoteExpiresAt,
      quoteNote: note,
      // Génère un token unique via la valeur par défaut du schéma (@default(uuid()))
    },
    select: { quoteToken: true },
  });

  // Envoi de l'email au client
  if (pr.client.email) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const token = updated.quoteToken;
    const acceptUrl = `${baseUrl}/client/parcel-requests/${id}/respond?token=${token}&action=accept`;
    const rejectUrl = `${baseUrl}/client/parcel-requests/${id}/respond?token=${token}&action=reject`;

    const symbol = CURRENCY_SYMBOL[currency as Currency] ?? currency;
    const priceStr = `${symbol} ${price.toLocaleString("fr-FR")}`;
    const route = `${countryLabelFr(shipment.originCountry)} → ${countryLabelFr(pr.recipient.country)}`;
    const departureDate = shipment.departureDate
      ? new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(shipment.departureDate)
      : "À confirmer";

    const resend = getResendClient();
    if (resend) {
      const html = await render(
        ParcelRequestQuoteEmail({
          clientFirstName: pr.client.firstName,
          forwarderName: shipment.forwarder.name,
          route,
          departureDate,
          price: priceStr,
          quoteNote: note,
          acceptUrl,
          rejectUrl,
        }),
      );
      await resend.emails.send({
        from: getDefaultFromAddress(),
        to: pr.client.email,
        subject: `Offre de prise en charge — ${priceStr} par ${shipment.forwarder.name}`,
        html,
      });
    }
  }

  return jsonOk({ ok: true });
}
