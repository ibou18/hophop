import type { TrackingEventType } from "@/app/generated/prisma/enums";

export const TRACKING_EVENT_TYPE_LABEL: Record<TrackingEventType, string> = {
  // Côté client
  PARCEL_DECLARED:     "Colis déclaré",
  PARCEL_LABEL_PRINTED:"Étiquette imprimée",

  // Côté transitaire (origine)
  PARCEL_COLLECTED:    "Colis collecté",
  PARCEL_CHECKED:      "Colis vérifié",
  PARCEL_ASSIGNED:     "Affecté à un envoi",
  PARCEL_UNASSIGNED:   "Retiré de l'envoi",

  // Envoi / Transit
  SHIPMENT_DEPARTED:   "Envoi parti",
  CUSTOMS_ORIGIN:      "Dédouanement origine",
  CUSTOMS_DESTINATION: "Dédouanement destination",
  IN_TRANSIT:          "En transit",
  SHIPMENT_ARRIVED:    "Envoi arrivé",

  // Côté transitaire (destination)
  PARCEL_RECEIVED:     "Colis réceptionné",
  PARCEL_READY:        "Prêt au retrait",
  PARCEL_DELIVERED:    "Remis au destinataire",

  // Événements exceptionnels
  PARCEL_ISSUE:        "Incident signalé",
  PARCEL_ISSUE_RESOLVED: "Incident résolu",
  PARCEL_RETURNED:     "Colis retourné",

  // Paiement
  PAYMENT_RECEIVED:    "Paiement reçu",
};

export function trackingEventTypeLabelFr(type: TrackingEventType): string {
  return TRACKING_EVENT_TYPE_LABEL[type] ?? type;
}
