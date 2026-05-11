import type { NotificationType } from "@/app/generated/prisma/enums";
import type { HophopEmailProps } from "@/emails/hophop-notification";
import { getAppBaseUrl } from "@/lib/mail/app-url";

type ParcelLike = {
  id: string;
  trackingCode: string;
  description: string | null;
  forwarder: {
    name: string;
    logoUrl: string | null;
  };
  client: {
    firstName: string;
    lastName: string;
  };
  recipient: {
    city: string;
    country: string;
  };
  shipment: { reference: string; destinationCountry: string } | null;
};

function destinationLabel(p: ParcelLike): string {
  if (p.shipment?.destinationCountry) {
    return String(p.shipment.destinationCountry);
  }
  return `${p.recipient.city} (${p.recipient.country})`;
}

export function emailSubject(
  type: NotificationType,
  trackingCode: string,
): string {
  const t = trackingCode;
  switch (type) {
    case "PARCEL_REGISTERED":
      return `Colis enregistré — ${t}`;
    case "FORWARDER_NEW_PARCEL_DECLARED":
      return `Nouveau colis à traiter — ${t}`;
    case "SHIPMENT_DEPARTURE":
      return `Votre envoi est parti — ${t}`;
    case "SHIPMENT_ARRIVED":
      return `Votre colis est arrivé — ${t}`;
    case "PARCEL_READY":
      return `Votre colis est prêt — ${t}`;
    case "PARCEL_DELIVERED":
      return `Colis remis — ${t}`;
    case "PAYMENT_CONFIRMED":
      return `Paiement confirmé — ${t}`;
    case "SHIPMENT_REQUEST_ACCEPTED":
      return `Demande d'envoi acceptée — ${t}`;
    case "SHIPMENT_REQUEST_REJECTED":
      return `Demande d'envoi refusée — ${t}`;
    default:
      return `Mise à jour colis — ${t}`;
  }
}

export function buildHophopEmail(
  type: NotificationType,
  parcel: ParcelLike,
  extra?: { shipmentReference?: string },
): HophopEmailProps {
  const base = getAppBaseUrl();
  const fwd = parcel.forwarder.name;
  const logo = parcel.forwarder.logoUrl;
  const tc = parcel.trackingCode;
  const clientName = `${parcel.client.firstName} ${parcel.client.lastName}`;
  const dest = destinationLabel(parcel);
  const trackUrl = `${base}/track/${encodeURIComponent(tc)}`;
  const clientParcelUrl = `${base}/client/parcels/${parcel.id}`;
  const forwarderParcelUrl = `${base}/parcels/${parcel.id}`;
  const parcelLabelUrl = `${base}/api/parcels/${parcel.id}/label`;

  switch (type) {
    case "PARCEL_REGISTERED":
      return {
        preview: `Votre colis ${tc} est bien enregistré.`,
        title: "Colis enregistré",
        lines: [
          `Bonjour, votre colis en direction de ${dest} a bien été pris en compte par ${fwd}.`,
          parcel.description
            ? `Description indiquée : ${parcel.description}`
            : "Vous pouvez suivre son avancement à tout moment.",
          "Vous pouvez télécharger et imprimer votre étiquette d'expédition ci-dessous.",
        ].filter(Boolean) as string[],
        ctaText: "Voir mon colis",
        ctaUrl: clientParcelUrl,
        secondaryCtaText: "Imprimer l'étiquette",
        secondaryCtaUrl: parcelLabelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "FORWARDER_NEW_PARCEL_DECLARED":
      return {
        preview: `${clientName} vient de déclarer le colis ${tc}.`,
        title: "Nouveau colis déclaré",
        lines: [
          `${clientName} a déclaré un colis pour ${parcel.recipient.city} (${parcel.recipient.country}).`,
          `Code de suivi : ${tc}.`,
        ],
        ctaText: "Ouvrir le colis",
        ctaUrl: forwarderParcelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "SHIPMENT_DEPARTURE": {
      const ref =
        extra?.shipmentReference ?? parcel.shipment?.reference ?? "votre envoi";
      return {
        preview: `Le colis ${tc} a quitté l'origine.`,
        title: "Votre envoi est en route",
        lines: [
          `Votre colis ${tc} fait partie de l'envoi ${ref} et est maintenant en transit vers ${dest}.`,
        ],
        ctaText: "Suivre le colis",
        ctaUrl: trackUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };
    }

    case "SHIPMENT_ARRIVED":
      return {
        preview: `Le colis ${tc} est arrivé à destination.`,
        title: "Arrivée à destination",
        lines: [
          `Bonne nouvelle : votre colis ${tc} est arrivé dans la zone de destination (${dest}).`,
          `${fwd} vous tiendra informé pour la remise ou le retrait.`,
        ],
        ctaText: "Voir le suivi",
        ctaUrl: trackUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "PARCEL_READY":
      return {
        preview: `Votre colis ${tc} est prêt à être récupéré.`,
        title: "Colis prêt",
        lines: [
          `Votre colis ${tc} est prêt. Contactez ${fwd} ou consultez les instructions de retrait.`,
        ],
        ctaText: "Suivre le colis",
        ctaUrl: trackUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "PARCEL_DELIVERED":
      return {
        preview: `Le colis ${tc} a été remis au destinataire.`,
        title: "Colis livré",
        lines: [
          `Le colis ${tc} a été marqué comme remis au destinataire. Merci d'avoir utilisé ${fwd}.`,
        ],
        ctaText: "Voir le détail",
        ctaUrl: clientParcelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "PAYMENT_CONFIRMED":
      return {
        preview: `Paiement reçu pour le colis ${tc}.`,
        title: "Paiement confirmé",
        lines: [
          `Votre paiement pour le colis ${tc} a bien été enregistré.`,
          `${fwd} poursuit le traitement de votre envoi.`,
        ],
        ctaText: "Voir mon colis",
        ctaUrl: clientParcelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    case "SHIPMENT_REQUEST_ACCEPTED": {
      const ref = parcel.shipment?.reference ?? "l'envoi";
      return {
        preview: `Votre demande pour le colis ${tc} est acceptée.`,
        title: "Demande acceptée",
        lines: [`Votre colis ${tc} a été intégré à l'envoi ${ref}.`],
        ctaText: "Voir mon colis",
        ctaUrl: clientParcelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };
    }

    case "SHIPMENT_REQUEST_REJECTED":
      return {
        preview: `Mise à jour pour le colis ${tc}.`,
        title: "Demande non retenue",
        lines: [
          `Votre demande d'intégration à un envoi pour le colis ${tc} n'a pas été retenue pour le moment.`,
          `Contactez ${fwd} pour plus d'informations.`,
        ],
        ctaText: "Voir mon colis",
        ctaUrl: clientParcelUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };

    default:
      return {
        preview: `Mise à jour pour ${tc}.`,
        title: "Mise à jour",
        lines: [`Une mise à jour concerne le colis ${tc}.`],
        ctaText: "Suivre",
        ctaUrl: trackUrl,
        forwarderName: fwd,
        logoUrl: logo,
        trackingCode: tc,
      };
  }
}

export function smsBody(type: NotificationType, parcel: ParcelLike): string {
  const tc = parcel.trackingCode;
  const fwd = parcel.forwarder.name;
  switch (type) {
    case "PARCEL_REGISTERED":
      return `${fwd} : colis ${tc} enregistré. Suivi : ${getAppBaseUrl()}/track/${tc}`;
    case "PAYMENT_CONFIRMED":
      return `${fwd} : paiement reçu pour le colis ${tc}.`;
    case "SHIPMENT_DEPARTURE":
      return `${fwd} : colis ${tc} en transit. Suivi : ${getAppBaseUrl()}/track/${tc}`;
    case "SHIPMENT_ARRIVED":
      return `${fwd} : colis ${tc} arrivé à destination.`;
    case "PARCEL_READY":
      return `${fwd} : colis ${tc} prêt à être récupéré.`;
    case "SHIPMENT_REQUEST_ACCEPTED":
      return `${fwd} : demande acceptée pour le colis ${tc}.`;
    case "SHIPMENT_REQUEST_REJECTED":
      return `${fwd} : demande refusée pour le colis ${tc}. Contactez le transitaire.`;
    default:
      return `${fwd} : mise à jour colis ${tc}.`;
  }
}
