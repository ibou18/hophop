import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TrackingEventType } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { Country } from "@/app/generated/prisma/enums";

const EVENT_LABEL: Record<TrackingEventType, string> = {
  PARCEL_DECLARED:       "Colis déclaré",
  PARCEL_LABEL_PRINTED:  "Étiquette générée",
  PARCEL_COLLECTED:      "Collecté par le transitaire",
  PARCEL_CHECKED:        "Vérifié et pesé",
  PARCEL_ASSIGNED:       "Affecté à un envoi",
  PARCEL_UNASSIGNED:     "Retiré de l'envoi",
  SHIPMENT_DEPARTED:     "Envoi parti",
  CUSTOMS_ORIGIN:        "En dédouanement (départ)",
  CUSTOMS_DESTINATION:   "En dédouanement (destination)",
  IN_TRANSIT:            "En transit",
  SHIPMENT_ARRIVED:      "Envoi arrivé à destination",
  PARCEL_RECEIVED:       "Réceptionné à destination",
  PARCEL_READY:          "Prêt à être retiré",
  PARCEL_DELIVERED:      "Remis au destinataire",
  PARCEL_ISSUE:          "Problème signalé",
  PARCEL_ISSUE_RESOLVED: "Problème résolu",
  PARCEL_RETURNED:       "Retourné à l'expéditeur",
  PAYMENT_RECEIVED:      "Paiement enregistré",
};

type TrackingEventRow = {
  id: string;
  type: TrackingEventType;
  location: string | null;
  country: Country | null;
  note: string | null;
  createdAt: Date;
};

export function TrackingTimeline({ events }: { events: TrackingEventRow[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isCurrent = isLast;
        const isDone = !isLast;

        return (
          <li key={event.id} className="flex gap-3 pb-5 last:pb-0">
            {/* Dot + line */}
            <div className="flex w-5 shrink-0 flex-col items-center">
              <div
                className={
                  isCurrent
                    ? "mt-0.5 h-2.5 w-2.5 rounded-full bg-hh-saffron ring-4 ring-hh-saffron-lt"
                    : isDone
                    ? "mt-0.5 h-2.5 w-2.5 rounded-full bg-hh-savane"
                    : "mt-0.5 h-2.5 w-2.5 rounded-full bg-hh-sand-dk"
                }
              />
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-hh-sand-dk/50" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <p
                className={`text-[14px] font-medium ${
                  isCurrent
                    ? "text-hh-saffron-dk"
                    : "text-hh-earth-dk"
                }`}
              >
                {EVENT_LABEL[event.type] ?? event.type}
              </p>

              {(event.location || event.country) && (
                <p className="mt-0.5 text-[12px] text-hh-muted">
                  {event.location}
                  {event.location && event.country && " · "}
                  {event.country && countryLabelFr(event.country)}
                </p>
              )}

              {event.note && (
                <p className="mt-0.5 text-[12px] text-hh-earth-dk">
                  {event.note}
                </p>
              )}

              <p className="mt-0.5 text-[11px] text-hh-muted">
                {format(new Date(event.createdAt), "d MMM yyyy, HH:mm", {
                  locale: fr,
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
