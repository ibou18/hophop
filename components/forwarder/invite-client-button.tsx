"use client";

import { useCallback, useEffect, useRef, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GooglePlacesAddressField } from "@/components/maps/google-places-address";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Country } from "@/app/generated/prisma/enums";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const inputClass =
  "h-10 rounded-xl border-hh-sand-dk/35 bg-white text-[14px] placeholder:text-hh-muted/70 transition focus-visible:border-hh-saffron focus-visible:ring-2 focus-visible:ring-hh-saffron/20";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: Country;
  city: string;
  cityLatitude: number | undefined;
  cityLongitude: number | undefined;
};

export function InviteClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "CA",
      city: "",
      cityLatitude: undefined,
      cityLongitude: undefined,
    },
  });

  const country = form.watch("country");
  const prevCountryRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevCountryRef.current === null) {
      prevCountryRef.current = country;
      return;
    }
    if (prevCountryRef.current !== country) {
      prevCountryRef.current = country;
      form.setValue("city", "");
      form.setValue("cityLatitude", undefined);
      form.setValue("cityLongitude", undefined);
    }
  }, [country, form]);

  const onPhoneChange = useCallback(
    (v: string) => form.setValue("phone", v, { shouldDirty: true }),
    [form],
  );

  function handleOpenChange(v: boolean) {
    if (isPending) return;
    setOpen(v);
    if (!v) {
      form.reset();
      setApiError(null);
      setDone(false);
      setAlreadyExists(false);
      prevCountryRef.current = null;
    }
  }

  function onSubmit(values: FormValues) {
    setApiError(null);
    startTransition(async () => {
      const res = await fetch("/api/forwarder/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim() || undefined,
          country: values.country,
          city: values.city.trim() || undefined,
          cityLatitude: values.cityLatitude,
          cityLongitude: values.cityLongitude,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(json.message ?? "Une erreur est survenue.");
        return;
      }
      setAlreadyExists(Boolean(json.alreadyExists));
      setDone(true);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-2 rounded-xl bg-hh-saffron text-white shadow-md shadow-hh-saffron/20 hover:bg-hh-saffron-dk"
      >
        <UserPlus className="size-4" aria-hidden />
        Ajouter / Inviter un client
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-hh-earth-dk">
              Ajouter / Inviter un client
            </DialogTitle>
            <DialogDescription className="text-[13px] text-hh-muted">
              Le client recevra un email pour activer son compte. Vous pouvez
              l&apos;utiliser immédiatement pour assigner des colis.
            </DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-[15px] font-semibold text-hh-earth-dk">
                {alreadyExists
                  ? "Client déjà existant, rattaché à votre compte."
                  : "Invitation envoyée !"}
              </p>
              <p className="text-[13px] text-hh-muted">
                {alreadyExists
                  ? "Ce client était déjà inscrit sur Hophop."
                  : "Il recevra un email pour définir son mot de passe."}
              </p>
              <Button
                className="mt-2 rounded-xl bg-hh-saffron text-white hover:bg-hh-saffron-dk"
                onClick={() => handleOpenChange(false)}
              >
                Fermer
              </Button>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4 pt-1"
              noValidate
            >
              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-hh-muted">
                    Prénom *
                  </Label>
                  <Input
                    className={cn(inputClass)}
                    {...form.register("firstName", { required: "Requis" })}
                  />
                  {form.formState.errors.firstName ? (
                    <p className="text-[11px] text-hh-kola">
                      {form.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-hh-muted">
                    Nom *
                  </Label>
                  <Input
                    className={cn(inputClass)}
                    {...form.register("lastName", { required: "Requis" })}
                  />
                  {form.formState.errors.lastName ? (
                    <p className="text-[11px] text-hh-kola">
                      {form.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-hh-muted">
                  Email *
                </Label>
                <Input
                  type="email"
                  autoComplete="off"
                  className={cn(inputClass)}
                  {...form.register("email", {
                    required: "Requis",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email invalide",
                    },
                  })}
                />
                {form.formState.errors.email ? (
                  <p className="text-[11px] text-hh-kola">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              {/* Pays */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-hh-muted">
                  Pays *
                </Label>
                <select
                  className={cn(inputClass, "flex w-full px-3")}
                  {...form.register("country")}
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-hh-muted">
                  Définit l&apos;indicatif téléphonique et les suggestions de
                  ville.
                </p>
              </div>

              {/* Ville — autocomplete Google Places */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-hh-muted">
                  Ville
                </Label>
                <GooglePlacesAddressField
                  key={country}
                  id="invite-city"
                  apiKey={mapsApiKey}
                  value={form.watch("city")}
                  predictionTypes={["(cities)"]}
                  restrictCountry={country}
                  placeholder={
                    mapsApiKey ? "ex. Montréal, Conakry…" : "Nom de la ville"
                  }
                  disabled={form.formState.isSubmitting}
                  inputClassName={cn(inputClass)}
                  onChangeText={(v) => {
                    form.setValue("city", v, { shouldDirty: true });
                    form.setValue("cityLatitude", undefined);
                    form.setValue("cityLongitude", undefined);
                  }}
                  onResolved={(data) => {
                    const cityName =
                      data.city ??
                      data.formattedAddress.split(",")[0]?.trim() ??
                      data.formattedAddress;
                    form.setValue("city", cityName, { shouldDirty: true });
                    form.setValue("cityLatitude", data.latitude);
                    form.setValue("cityLongitude", data.longitude);
                    if (data.country)
                      form.setValue("country", data.country, {
                        shouldDirty: true,
                      });
                  }}
                />
              </div>

              {/* Téléphone avec indicatif */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-hh-muted">
                  Téléphone (optionnel)
                </Label>
                <PhoneCountryField
                  id="invite-phone"
                  country={country}
                  nationalFormatted={form.watch("phone")}
                  onNationalChange={onPhoneChange}
                  disabled={form.formState.isSubmitting}
                  inputClassName={inputClass}
                />
              </div>

              {apiError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
                  {apiError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-2 rounded-xl bg-hh-saffron text-white hover:bg-hh-saffron-dk"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      Inviter
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
