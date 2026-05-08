"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  shipmentId: string;
  editable: boolean;
  originCity: string | null;
  destinationCity: string | null;
  departureDate: Date | null;
  arrivalDate: Date | null;
  notes: string | null;
  notifyClientsOnChange: boolean;
};

function toInputDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function ShipmentBasicInfoEditor({
  shipmentId,
  editable,
  originCity,
  destinationCity,
  departureDate,
  arrivalDate,
  notes,
  notifyClientsOnChange,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [originCityValue, setOriginCityValue] = useState(originCity ?? "");
  const [destinationCityValue, setDestinationCityValue] = useState(
    destinationCity ?? "",
  );
  const [departureDateValue, setDepartureDateValue] = useState(
    toInputDate(departureDate),
  );
  const [arrivalDateValue, setArrivalDateValue] = useState(toInputDate(arrivalDate));
  const [notesValue, setNotesValue] = useState(notes ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          originCity: originCityValue.trim() || null,
          destinationCity: destinationCityValue.trim() || null,
          departureDate: departureDateValue || null,
          arrivalDate: arrivalDateValue || null,
          notes: notesValue.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Modification impossible.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Informations envoi mises à jour.");
      setEditing(false);
      router.refresh();
    });
  }

  const inputClass =
    "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

  if (!editable) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-hh-sand-dk/40 text-[13px]"
        onClick={() => setEditing(true)}
      >
        Modifier
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="rounded-[var(--hh-radius-lg)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-hh-earth-dk">
              Modifier informations envoi
            </DialogTitle>
            <DialogDescription>Villes, dates, notes.</DialogDescription>
          </DialogHeader>

          {notifyClientsOnChange ? (
            <p className="rounded-[var(--hh-radius-md)] border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              Attention: modification de ce formulaire enverra email aux clients
              qui ont un colis dans cet envoi.
            </p>
          ) : null}

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[12px] text-hh-muted">Ville de départ</label>
                <input
                  value={originCityValue}
                  onChange={(e) => setOriginCityValue(e.target.value)}
                  disabled={pending}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-hh-muted">
                  Ville d&apos;arrivée
                </label>
                <input
                  value={destinationCityValue}
                  onChange={(e) => setDestinationCityValue(e.target.value)}
                  disabled={pending}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[12px] text-hh-muted">Date de départ</label>
                <input
                  type="date"
                  value={departureDateValue}
                  onChange={(e) => setDepartureDateValue(e.target.value)}
                  disabled={pending}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-hh-muted">
                  Date d&apos;arrivée prévue
                </label>
                <input
                  type="date"
                  value={arrivalDateValue}
                  onChange={(e) => setArrivalDateValue(e.target.value)}
                  disabled={pending}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-hh-muted">Notes</label>
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                disabled={pending}
                rows={3}
                className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 py-2 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
              />
            </div>
          </div>

          {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              disabled={pending}
              className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
              onClick={save}
            >
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
