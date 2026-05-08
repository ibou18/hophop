"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Country, TransportMode } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isoDateUtcToday } from "@/lib/iso-date-utc";
import { TransportModeSelector } from "@/components/transport-mode-selector";
import {
  GooglePlacesAddressField,
  type PlaceResolved,
} from "@/components/maps/google-places-address";
import {
  ShipmentPricingSection,
  DEFAULT_SHIPMENT_PRICING,
  pricingStateToPayload,
  type ShipmentPricingState,
} from "@/components/forwarder/shipment-pricing-section";
import { Car, Link2, MessageCircle } from "lucide-react";
import { CURRENCY_LABEL } from "@/lib/pricing";
import type { Currency } from "@/app/generated/prisma/enums";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Props = {
  defaultDepartureDate: string;
  forwarderCode5: string;
};

function cityLabel(
  place: PlaceResolved | null,
  fallback: string,
): string | undefined {
  if (place)
    return (
      place.city?.trim() ||
      place.formattedAddress.split(",")[0]?.trim() ||
      place.formattedAddress
    );
  return fallback.trim() || undefined;
}

const inputClass =
  "h-10 w-full max-w-md rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

const numInputClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";

const selectClass =
  "h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[14px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50";

type VisibilityChoice = "PUBLIC" | "PRIVATE";

type CreatedShipment = {
  id: string;
  reference: string;
};

function buildShareMessage({
  reference,
  visibility,
  url,
}: {
  reference: string;
  visibility: VisibilityChoice;
  url: string;
}): string {
  const scope =
    visibility === "PUBLIC"
      ? "✅ Envoi confirme et public sur Hophop"
      : "🔒 Envoi prive (accessible avec ce lien)";
  return [
    "Bonjour 👋",
    "",
    `📦 Nouvel envoi ${reference}`,
    scope,
    "",
    "👉 Consulter l'envoi :",
    url,
  ].join("\n");
}

export function NewShipmentForm({
  defaultDepartureDate,
  forwarderCode5,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [originCountry, setOriginCountry] = useState<Country>("CA");
  const [destinationCountry, setDestinationCountry] = useState<Country>("GN");
  const [transportMode, setTransportMode] = useState<TransportMode>("AIR");
  const [originCityInput, setOriginCityInput] = useState("");
  const [originPlace, setOriginPlace] = useState<PlaceResolved | null>(null);
  const [destinationCityInput, setDestinationCityInput] = useState("");
  const [destinationPlace, setDestinationPlace] =
    useState<PlaceResolved | null>(null);
  const [notes, setNotes] = useState("");
  const minDate = defaultDepartureDate || isoDateUtcToday();
  const [departureDate, setDepartureDate] = useState(minDate);
  const [arrivalDate, setArrivalDate] = useState("");
  const [pricing, setPricing] = useState<ShipmentPricingState>(
    DEFAULT_SHIPMENT_PRICING,
  );
  const [createdShipment, setCreatedShipment] =
    useState<CreatedShipment | null>(null);
  const [visibilityChoice, setVisibilityChoice] =
    useState<VisibilityChoice>("PUBLIC");
  const [savingVisibility, setSavingVisibility] = useState(false);

  // Vehicle acceptance (maritime only)
  const [acceptsVehicles, setAcceptsVehicles] = useState(false);
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [vehicleCurrency, setVehicleCurrency] = useState<Currency>("CAD");

  const isMaritime = transportMode === "SEA";

  function handleModeChange(m: TransportMode) {
    setTransportMode(m);
    setPricing(DEFAULT_SHIPMENT_PRICING);
    if (m !== "SEA") {
      setAcceptsVehicles(false);
      setVehiclePrice("");
    }
  }

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    if (mapsApiKey) {
      if (!originPlace) {
        setError(
          "Ville de départ : sélectionne une suggestion dans la liste pour enregistrer le GPS.",
        );
        return;
      }
      if (!destinationPlace) {
        setError(
          "Ville d'arrivée : sélectionne une suggestion dans la liste pour enregistrer le GPS.",
        );
        return;
      }
    }

    if (originPlace?.country && originPlace.country !== originCountry) {
      setError(
        "Le lieu de départ ne correspond pas au pays d'origine sélectionné.",
      );
      return;
    }
    if (
      destinationPlace?.country &&
      destinationPlace.country !== destinationCountry
    ) {
      setError(
        "La ville d'arrivée ne correspond pas au pays de destination sélectionné.",
      );
      return;
    }

    const pricingPayload = pricingStateToPayload(pricing);

    const payload = {
      originCountry,
      destinationCountry,
      transportMode,
      originCity: cityLabel(originPlace, originCityInput),
      destinationCity: cityLabel(destinationPlace, destinationCityInput),
      ...(originPlace
        ? {
            originLatitude: originPlace.latitude,
            originLongitude: originPlace.longitude,
          }
        : {}),
      ...(destinationPlace
        ? {
            destinationLatitude: destinationPlace.latitude,
            destinationLongitude: destinationPlace.longitude,
          }
        : {}),
      departureDate,
      arrivalDate: arrivalDate || undefined,
      notes: notes.trim() || undefined,
      acceptsVehicles: isMaritime ? acceptsVehicles : false,
      ...pricingPayload,
      // Vehicle price overrides ratePerVehicle when maritime + acceptsVehicles
      ...(isMaritime && acceptsVehicles && vehiclePrice
        ? {
            ratePerVehicle: parseFloat(vehiclePrice),
            currency: vehicleCurrency,
          }
        : {}),
    };

    startTransition(async () => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as {
        id?: string;
        reference?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(json?.error ?? `Création impossible (${res.status})`);
        return;
      }
      if (json?.id) {
        const ref =
          typeof (json as Record<string, unknown>).reference === "string"
            ? ((json as Record<string, unknown>).reference as string)
            : "ENV";
        setCreatedShipment({ id: json.id, reference: ref });
        return;
      }
      setError("Réponse inattendue du serveur.");
    });
  }

  const publicPath = createdShipment
    ? `/p/${forwarderCode5}?envoi=${encodeURIComponent(createdShipment.id)}`
    : "";
  const privatePath = createdShipment ? `/shipments/${createdShipment.id}` : "";
  const selectedPath = visibilityChoice === "PUBLIC" ? publicPath : privatePath;
  const selectedUrl =
    typeof window !== "undefined" && selectedPath
      ? `${window.location.origin}${selectedPath}`
      : selectedPath;

  function openWhatsAppShare() {
    if (!createdShipment || !selectedUrl) return;
    const text = encodeURIComponent(
      buildShareMessage({
        reference: createdShipment.reference,
        visibility: visibilityChoice,
        url: selectedUrl,
      }),
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function copyShareLink() {
    if (!selectedUrl) return;
    try {
      await navigator.clipboard.writeText(selectedUrl);
    } catch {
      // noop
    }
  }

  async function openDetail() {
    if (!createdShipment) return;
    setSavingVisibility(true);
    setError(null);
    try {
      const patchRes = await fetch(`/api/shipments/${createdShipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          isPublished: visibilityChoice === "PUBLIC",
          status: "CONFIRMED",
        }),
      });
      const patchJson = (await patchRes.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!patchRes.ok) {
        setError(
          patchJson?.error ?? "Impossible d'appliquer la visibilite de l'envoi.",
        );
        return;
      }
      router.push(`/shipments/${createdShipment.id}`);
    } finally {
      setSavingVisibility(false);
    }
  }

  return (
    <>
      <Dialog open={createdShipment != null}>
        <DialogContent className="rounded-[var(--hh-radius-lg)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-hh-earth-dk">
              Envoi cree {createdShipment?.reference}
            </DialogTitle>
            <DialogDescription className="text-[14px] text-hh-earth-dk">
              Choisis Public ou Prive, puis valide.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVisibilityChoice("PUBLIC")}
              className={`rounded-[var(--hh-radius-md)] border p-3 text-left transition ${
                visibilityChoice === "PUBLIC"
                  ? "border-hh-saffron bg-hh-saffron/10"
                  : "border-hh-sand-dk/30 bg-white hover:bg-hh-sand/40"
              }`}
            >
              <p className="text-[13px] font-medium text-hh-earth-dk">Public</p>
              <p className="mt-1 text-[12px] text-hh-muted">
                Visible sur ta page Hophop. Idéal pour attirer plus de demandes
                clients.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setVisibilityChoice("PRIVATE")}
              className={`rounded-[var(--hh-radius-md)] border p-3 text-left transition ${
                visibilityChoice === "PRIVATE"
                  ? "border-hh-kola bg-hh-kola/10 ring-2 ring-hh-kola/25"
                  : "border-hh-sand-dk/30 bg-white hover:bg-hh-sand/40"
              }`}
            >
              <p className="text-[13px] font-medium text-hh-earth-dk">Prive</p>
              <p className="mt-1 text-[12px] text-hh-muted">
                Non affiché publiquement. Accessible uniquement aux personnes avec
                le lien.
              </p>
            </button>
          </div>

          <div className="rounded-[var(--hh-radius-md)] border border-hh-sand-dk/30 bg-hh-sand/30 p-3">
            <p className="text-[12px] font-medium text-hh-earth-dk">
              Lien de partage
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-hh-muted">
              {selectedUrl}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-hh-sand-dk/40"
                onClick={() => void copyShareLink()}
              >
                <Link2 className="size-4" />
                Copier le lien
              </Button>
              <Button
                type="button"
                className="bg-[#25D366] text-white hover:bg-[#1fbb59]"
                onClick={openWhatsAppShare}
              >
                <MessageCircle className="size-4" />
                Envoyer sur WhatsApp
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              disabled={savingVisibility}
              className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
              onClick={() => void openDetail()}
            >
              {savingVisibility ? "Enregistrement..." : "Valider et ouvrir le detail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
            Mode de transport
          </p>
          <TransportModeSelector
            value={transportMode}
            onChange={handleModeChange}
            disabled={pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Pays d&apos;origine
            </label>
            <select
              value={originCountry}
              onChange={(e) => {
                setOriginCountry(e.target.value as Country);
                setOriginCityInput("");
                setOriginPlace(null);
              }}
              disabled={pending}
              className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            >
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Ville de départ
            </label>
            <GooglePlacesAddressField
              key={originCountry}
              apiKey={mapsApiKey}
              value={originCityInput}
              predictionTypes={["(cities)"]}
              onChangeText={(v) => {
                setOriginCityInput(v);
                if (!v.trim()) setOriginPlace(null);
              }}
              onResolved={(p) => {
                setOriginPlace(p);
                setOriginCityInput(
                  p.city ??
                    p.formattedAddress.split(",")[0]?.trim() ??
                    p.formattedAddress,
                );
              }}
              disabled={pending}
              placeholder="ex. Montréal"
              inputClassName={inputClass}
              restrictCountry={originCountry}
            />
            {originPlace ? (
              <p className="text-[11px] text-green-600">
                GPS enregistré ({originPlace.latitude.toFixed(4)},{" "}
                {originPlace.longitude.toFixed(4)})
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Pays de destination
            </label>
            <select
              value={destinationCountry}
              onChange={(e) => {
                setDestinationCountry(e.target.value as Country);
                setDestinationCityInput("");
                setDestinationPlace(null);
              }}
              disabled={pending}
              className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            >
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Ville d&apos;arrivée
            </label>
            <GooglePlacesAddressField
              key={destinationCountry}
              apiKey={mapsApiKey}
              value={destinationCityInput}
              predictionTypes={["(cities)"]}
              onChangeText={(v) => {
                setDestinationCityInput(v);
                if (!v.trim()) setDestinationPlace(null);
              }}
              onResolved={(p) => {
                setDestinationPlace(p);
                setDestinationCityInput(
                  p.city ??
                    p.formattedAddress.split(",")[0]?.trim() ??
                    p.formattedAddress,
                );
              }}
              disabled={pending}
              placeholder="ex. Conakry"
              inputClassName={inputClass}
              restrictCountry={destinationCountry}
            />
            {destinationPlace ? (
              <p className="text-[11px] text-green-600">
                GPS enregistré ({destinationPlace.latitude.toFixed(4)},{" "}
                {destinationPlace.longitude.toFixed(4)})
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="departure-date"
            className="text-[11px] font-medium uppercase tracking-wide text-hh-muted mr-4"
          >
            Date d&apos;envoi
          </label>
          <input
            id="departure-date"
            type="date"
            required
            min={minDate}
            suppressHydrationWarning
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            disabled={pending}
            className="h-10 w-full max-w-xs rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          />
          <p className="text-[12px] text-hh-muted">
            Passée cette date (UTC), l&apos;envoi ne sera plus proposé sur la
            vitrine ni dans le catalogue client.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="arrival-date"
            className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
          >
            Date d&apos;arrivee prevue (optionnel)
          </label>
          <input
            id="arrival-date"
            type="date"
            min={departureDate}
            suppressHydrationWarning
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            disabled={pending}
            className="h-10 w-full max-w-xs rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          />
        </div>

        <ShipmentPricingSection
          value={pricing}
          onChange={setPricing}
          disabled={pending}
        />

        {/* ── Section véhicule (maritime uniquement) ─────────────────────── */}
        {isMaritime && (
          <div className="space-y-4 rounded-[var(--hh-radius-lg)] border border-teal-200 bg-teal-50/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car size={16} className="shrink-0 text-teal-700" />
                <div>
                  <p className="text-[13px] font-medium text-teal-900">
                    Accepter les véhicules
                  </p>
                  <p className="mt-0.5 text-[12px] text-teal-700/80">
                    Les clients pourront déclarer un véhicule sur cet envoi
                    maritime (conteneur).
                  </p>
                </div>
              </div>
              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={acceptsVehicles}
                disabled={pending}
                onClick={() => {
                  const next = !acceptsVehicles;
                  setAcceptsVehicles(next);
                  if (!next) setVehiclePrice("");
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 ${
                  acceptsVehicles ? "bg-teal-600" : "bg-hh-sand-dk/40"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    acceptsVehicles ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {acceptsVehicles && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-teal-800">
                    Prix par véhicule
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(e.target.value)}
                    disabled={pending}
                    placeholder="ex. 1 500.00"
                    className={numInputClass}
                  />
                  <p className="text-[11px] text-teal-700/70">
                    Laisse vide pour confirmer le tarif directement avec le
                    client.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-teal-800">
                    Devise
                  </label>
                  <select
                    value={vehicleCurrency}
                    onChange={(e) =>
                      setVehicleCurrency(e.target.value as Currency)
                    }
                    disabled={pending}
                    className={selectClass}
                  >
                    {(Object.keys(CURRENCY_LABEL) as Currency[]).map((k) => (
                      <option key={k} value={k}>
                        {CURRENCY_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="notes"
            className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
          >
            Notes (optionnel)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={pending}
            rows={3}
            className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 py-2 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/70 focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          />
        </div>

        {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
            className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
          >
            {pending ? "Création…" : "Créer l'envoi"}
          </Button>
        </div>
      </form>
    </>
  );
}
