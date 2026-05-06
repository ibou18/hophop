"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { Country } from "@/app/generated/prisma/enums";
import { COUNTRY_OPTIONS } from "@/lib/country-label-fr";
import { Button } from "@/components/ui/button";
import { GooglePlacesAddressField } from "@/components/maps/google-places-address";
import {
  forwarderLogoMaxBytes,
  S3ImageUploadButton,
} from "@/components/storage/s3-image-upload-button";
import { UserPreferencesSection } from "@/components/shared/user-preferences-section";
import { toast } from "sonner";

export type ForwarderProfileDTO = {
  id: string;
  code5: string;
  name: string;
  email: string;
  phone: string | null;
  country: Country;
  city: string;
  address: string | null;
  addressFormatted: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  description: string | null;
  paymentEnabled: boolean;
  stripeAccountId: string | null;
  locale: string;
  timezone: string;
  updatedAt: string;
};

export function ForwarderSettingsForm({
  profile,
}: {
  profile: ForwarderProfileDTO;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoUploadErr, setLogoUploadErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState<Country>(profile.country);
  const [city, setCity] = useState(profile.city);
  const [address, setAddress] = useState(profile.address ?? "");
  const [addressFormatted, setAddressFormatted] = useState(
    profile.addressFormatted ?? "",
  );
  const [latitude, setLatitude] = useState<number | null>(profile.latitude);
  const [longitude, setLongitude] = useState<number | null>(profile.longitude);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl ?? "");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const onPlaceResolved = useCallback(
    (data: {
      formattedAddress: string;
      latitude: number;
      longitude: number;
      city?: string;
      country?: Country;
    }) => {
      setAddressFormatted(data.formattedAddress);
      setAddress(data.formattedAddress);
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      if (data.city) setCity(data.city);
      if (data.country) setCountry(data.country);
    },
    [],
  );
  const [description, setDescription] = useState(profile.description ?? "");
  const [paymentEnabled, setPaymentEnabled] = useState(profile.paymentEnabled);
  const [stripeAccountId, setStripeAccountId] = useState(
    profile.stripeAccountId ?? "",
  );
  const [locale, setLocale] = useState(profile.locale);
  const [timezone, setTimezone] = useState(profile.timezone);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        city: city.trim(),
        country,
        paymentEnabled,
        phone: phone.trim() === "" ? null : phone.trim(),
        address: address.trim() === "" ? null : address.trim(),
        addressFormatted:
          addressFormatted.trim() === "" ? null : addressFormatted.trim(),
        latitude,
        longitude,
        description: description.trim() === "" ? null : description.trim(),
        logoUrl: logoUrl.trim() === "" ? null : logoUrl.trim(),
        stripeAccountId:
          stripeAccountId.trim() === "" ? null : stripeAccountId.trim(),
        locale,
        timezone,
      };

      const res = await fetch(`/api/forwarders/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        const msg = json?.error ?? `Enregistrement impossible (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Paramètres enregistrés ✓");
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-8"
      key={profile.updatedAt}
    >
      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Identité & connexion
        </h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Le code à 5 chiffres sert aux clients pour se connecter avec leur
          compte. L’e-mail sert à ta connexion transitaire.
        </p>
        <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Code client (code5)
            </dt>
            <dd className="mt-1 font-mono text-[18px] font-semibold text-hh-earth-dk">
              {profile.code5}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              E-mail connexion
            </dt>
            <dd className="mt-1 text-hh-earth-dk">{profile.email}</dd>
            <p className="mt-1 text-[12px] text-hh-muted">
              Modification non disponible ici (contact support ou migration
              compte).
            </p>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">
          Profil entreprise
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="fwd-name"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Nom affiché
            </label>
            <input
              id="fwd-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
              className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="fwd-phone"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Téléphone
            </label>
            <input
              id="fwd-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
              className="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="fwd-country"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Pays
            </label>
            <select
              id="fwd-country"
              value={country}
              onChange={(e) => setCountry(e.target.value as Country)}
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
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="fwd-city"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Ville
            </label>
            <input
              id="fwd-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={pending}
              className="h-10 w-full max-w-md rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="fwd-address"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Adresse
            </label>
            {mapsApiKey ? (
              <GooglePlacesAddressField
                apiKey={mapsApiKey}
                value={addressFormatted || address}
                onChangeText={(v) => {
                  setAddressFormatted(v);
                  setAddress(v);
                }}
                onResolved={onPlaceResolved}
                disabled={pending}
                placeholder="Rechercher une adresse…"
                restrictCountry={country}
                inputClassName="h-10 w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
              />
            ) : (
              <textarea
                id="fwd-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={pending}
                rows={2}
                className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 py-2 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
              />
            )}
            {latitude != null && longitude != null ? (
              <p className="text-[11px] text-hh-muted">
                GPS : {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Logo
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[var(--hh-radius-md)] border border-dashed border-hh-sand-dk/40 bg-hh-sand/30">
                {logoUrl.trim() ? (
                  <img
                    src={logoUrl.trim()}
                    alt="Aperçu du logo"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <span className="px-2 text-center text-[12px] leading-snug text-hh-muted">
                    Aucun logo
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <S3ImageUploadButton
                  label={
                    logoUrl.trim() ? "Modifier le logo" : "Ajouter un logo"
                  }
                  disabled={pending}
                  maxNewFiles={1}
                  maxBytes={forwarderLogoMaxBytes}
                  className="h-10 w-fit rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-hh-sand px-3 text-[13px] font-medium text-hh-earth-dk hover:bg-hh-sand-dk/20"
                  onError={(m) => setLogoUploadErr(m)}
                  onUploaded={(urls) => {
                    setLogoUploadErr(null);
                    const u = urls[0];
                    if (u) setLogoUrl(u);
                  }}
                />
                {logoUrl.trim() ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setLogoUploadErr(null);
                      setLogoUrl("");
                    }}
                    className="w-fit text-[12px] font-medium text-hh-muted underline-offset-2 hover:text-hh-earth-dk hover:underline disabled:opacity-50"
                  >
                    Retirer le logo
                  </button>
                ) : null}
              </div>
            </div>
            {logoUploadErr ? (
              <p className="text-[12px] text-hh-kola">{logoUploadErr}</p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="fwd-desc"
              className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
            >
              Description
            </label>
            <textarea
              id="fwd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={3}
              className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 py-2 text-[15px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">Paiement</h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Paiement en ligne (Stripe Connect). Active uniquement si ton compte est
          prêt côté Stripe.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-[14px] text-hh-earth-dk">
          <input
            type="checkbox"
            checked={paymentEnabled}
            onChange={(e) => setPaymentEnabled(e.target.checked)}
            disabled={pending}
            className="size-4 rounded border-hh-sand-dk/50"
          />
          Activer le paiement en ligne
        </label>
        <div className="mt-4 space-y-1.5">
          <label
            htmlFor="fwd-stripe"
            className="text-[11px] font-medium uppercase tracking-wide text-hh-muted"
          >
            ID compte Stripe Connect
          </label>
          <input
            id="fwd-stripe"
            value={stripeAccountId}
            onChange={(e) => setStripeAccountId(e.target.value)}
            disabled={pending}
            placeholder="acct_…"
            className="h-10 w-full max-w-lg rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 px-3 font-mono text-[13px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          />
        </div>
      </section>

      <UserPreferencesSection
        locale={locale}
        timezone={timezone}
        onLocaleChange={setLocale}
        onTimezoneChange={setTimezone}
        disabled={pending}
      />

      {error ? <p className="text-[13px] text-hh-kola">{error}</p> : null}
      {saved ? (
        <p className="text-[13px] text-hh-savane-dk">Modifications enregistrées.</p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
      >
        {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
      </Button>
    </form>
  );
}
