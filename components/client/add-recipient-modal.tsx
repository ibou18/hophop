"use client";

import { useState } from "react";
import type { Recipient } from "@/app/generated/prisma/client";
import type { Country } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { toE164 } from "@/lib/phone-e164";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddRecipientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (recipient: Recipient) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState<Country>("FR");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFirstName("");
    setLastName("");
    setCountry("FR");
    setCity("");
    setPhone("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const e164 = toE164(country, phone);
    if (!e164) {
      setError("Numéro de téléphone invalide pour ce pays.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ firstName, lastName, country, city, phone: e164 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Impossible de créer le destinataire.");
        return;
      }
      reset();
      onCreated(data as Recipient);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const modalInputClass =
    "h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 text-[13px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Nouveau destinataire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-hh-muted">Prénom *</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marie"
                className={modalInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-hh-muted">Nom *</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Diallo"
                className={modalInputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-hh-muted">Pays de livraison *</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value as Country);
                setPhone("");
              }}
              className={modalInputClass}
            >
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-hh-muted">Ville *</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Conakry"
              className={modalInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-hh-muted">Téléphone *</label>
            <PhoneCountryField
              id="modal-recipient-phone"
              country={country}
              nationalFormatted={phone}
              onNationalChange={setPhone}
              inputClassName={modalInputClass}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-hh-saffron text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Création…" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="h-10 rounded-xl border border-slate-200 px-4 text-[13px] text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
