import type { NotificationType } from "@/app/generated/prisma/enums";
import { getAppBaseUrl } from "@/lib/mail/app-url";

type ParcelLike = {
  id: string;
  trackingCode: string;
  forwarder: { name: string };
  client: { firstName: string; lastName: string };
  recipient: { city: string; country: string };
  shipment: { reference: string; destinationCountry: string } | null;
};

function destLine(p: ParcelLike): string {
  if (p.shipment?.destinationCountry) {
    return String(p.shipment.destinationCountry);
  }
  return `${p.recipient.city} (${p.recipient.country})`;
}

export function pushDataPayload(
  type: NotificationType,
  parcel: ParcelLike
): Record<string, string> {
  return {
    type,
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    openUrl: `${getAppBaseUrl()}/client/parcels/${parcel.id}`,
  };
}

export function pushDataPayloadForwarder(
  type: NotificationType,
  parcel: ParcelLike
): Record<string, string> {
  return {
    type,
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    openUrl: `${getAppBaseUrl()}/parcels/${parcel.id}`,
  };
}

export function pushMessage(
  type: NotificationType,
  parcel: ParcelLike,
  role: "client" | "forwarder"
): { title: string; body: string; data: Record<string, string> } {
  const tc = parcel.trackingCode;
  const fwd = parcel.forwarder.name;
  const dest = destLine(parcel);

  const data =
    role === "forwarder"
      ? pushDataPayloadForwarder(type, parcel)
      : pushDataPayload(type, parcel);

  switch (type) {
    case "PARCEL_REGISTERED":
      return {
        title: "Colis enregistré",
        body: `${fwd} — ${tc} · Direction ${dest}`,
        data,
      };
    case "FORWARDER_NEW_PARCEL_DECLARED":
      return {
        title: "Nouveau colis",
        body: `${parcel.client.firstName} — ${tc} vers ${dest}`,
        data,
      };
    case "SHIPMENT_DEPARTURE":
      return {
        title: "Envoi en route",
        body: `${tc} est en transit vers ${dest}`,
        data,
      };
    case "SHIPMENT_ARRIVED":
      return {
        title: "Arrivée",
        body: `${tc} est arrivé à destination`,
        data,
      };
    case "PARCEL_READY":
      return {
        title: "Prêt à récupérer",
        body: `${tc} est prêt chez ${fwd}`,
        data,
      };
    case "PARCEL_DELIVERED":
      return {
        title: "Livré",
        body: `${tc} a été remis au destinataire`,
        data,
      };
    case "PAYMENT_CONFIRMED":
      return {
        title: "Paiement reçu",
        body: `Paiement confirmé pour ${tc}`,
        data,
      };
    case "SHIPMENT_REQUEST_ACCEPTED": {
      const ref = parcel.shipment?.reference ?? "l'envoi";
      return {
        title: "Demande acceptée",
        body: `${tc} intégré à ${ref}`,
        data,
      };
    }
    case "SHIPMENT_REQUEST_REJECTED":
      return {
        title: "Demande refusée",
        body: `Demande non retenue pour ${tc}`,
        data,
      };
    default:
      return {
        title: "Hophop",
        body: `Mise à jour · ${tc}`,
        data,
      };
  }
}
