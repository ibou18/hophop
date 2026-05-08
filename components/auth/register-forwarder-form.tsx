"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createForwarderSchema,
  type ForwarderRegistrationFormInput,
} from "@/lib/validations/forwarder";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  authCardClass,
  authInputClass,
  authSubmitButtonClass,
} from "@/components/auth/auth-ui-classes";
import { cn } from "@/lib/utils";
import { GooglePlacesAddressField } from "@/components/maps/google-places-address";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import {
  messageFromZodFlatten,
  type ZodFlattenPayload,
} from "@/lib/zod-api-error";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function RegisterForwarderForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<ForwarderRegistrationFormInput>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      country: "CA",
      city: "",
      address: "",
      addressFormatted: undefined,
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
      description: "",
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
      form.setValue("address", "");
      form.setValue("addressFormatted", undefined, { shouldDirty: true });
      form.setValue("latitude", undefined, { shouldDirty: true });
      form.setValue("longitude", undefined, { shouldDirty: true });
    }
  }, [country, form]);

  const onPhoneNationalChange = useCallback(
    (v: string) => {
      form.setValue("phone", v, { shouldValidate: true, shouldDirty: true });
    },
    [form],
  );

  async function onSubmit(raw: ForwarderRegistrationFormInput) {
    setApiError(null);
    const parsed = createForwarderSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          form.setError(key as keyof ForwarderRegistrationFormInput, {
            message: issue.message,
          });
        }
      }
      return;
    }
    const values = parsed.data;
    const res = await fetch("/api/forwarders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(values),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      issues?: ZodFlattenPayload;
    };
    if (!res.ok) {
      const detail =
        res.status === 422 && payload.issues
          ? messageFromZodFlatten(payload.issues)
          : null;
      setApiError(
        detail ?? payload.error ?? `Inscription impossible (${res.status}).`,
      );
      return;
    }
    const signInRes = await signIn("forwarder-credentials", {
      email: values.email.trim().toLowerCase(),
      password: values.password,
      redirect: false,
    });
    if (signInRes?.error) {
      setApiError(
        "Compte créé. La connexion automatique a échoué — utilise la page Connexion.",
      );
      router.push("/login?registered=1");
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-2 pb-4 pt-7">
        <CardTitle className="text-[1.35rem] font-semibold leading-tight text-hh-earth-dk">
          Compte transitaire
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Crée ton espace pro pour gérer colis et envois.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[13px] font-medium text-hh-muted"
            >
              Nom de l’entreprise
            </Label>
            <Input
              id="name"
              className={cn(authInputClass)}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="country"
              className="text-[13px] font-medium text-hh-muted"
            >
              Pays
            </Label>
            <select
              id="country"
              className={cn(authInputClass, "flex w-full appearance-none px-3")}
              {...form.register("country")}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-hh-muted">
              Indicatif téléphone, ville et adresse (suggestions) sont limités à
              ce pays.
            </p>
          </div>

          <div className="space-y-2 w-full">
            <Label
              htmlFor="fwd-reg-address"
              className="text-[13px] font-medium text-hh-muted"
            >
              Adresse du siège <span className="text-hh-kola">*</span>
            </Label>
            <GooglePlacesAddressField
              key={`addr-${country}`}
              id="fwd-reg-address"
              required
              apiKey={mapsApiKey}
              value={form.watch("address") ?? ""}
              onChangeText={(v) => {
                form.setValue("address", v, { shouldDirty: true });
                form.setValue("addressFormatted", undefined, {
                  shouldDirty: true,
                });
                form.setValue("latitude", undefined, { shouldDirty: true });
                form.setValue("longitude", undefined, { shouldDirty: true });
              }}
              onResolved={(data) => {
                form.setValue("address", data.formattedAddress, {
                  shouldDirty: true,
                });
                form.setValue("addressFormatted", data.formattedAddress, {
                  shouldDirty: true,
                });
                form.setValue("latitude", data.latitude, {
                  shouldDirty: true,
                });
                form.setValue("longitude", data.longitude, {
                  shouldDirty: true,
                });
                if (data.city)
                  form.setValue("city", data.city, { shouldDirty: true });
                if (data.country)
                  form.setValue("country", data.country, { shouldDirty: true });
              }}
              disabled={form.formState.isSubmitting}
              placeholder={
                mapsApiKey
                  ? "Numéro et rue — choisis une suggestion"
                  : "Adresse complète"
              }
              restrictCountry={country}
              inputClassName={cn(authInputClass)}
            />
            {/* {mapsApiKey ? (
              <p className="text-[11px] text-hh-muted">
                Obligatoire : sélectionne une suggestion pour enregistrer le
                point GPS exact sur la carte.
              </p>
            ) : (
              <p className="text-[11px] text-hh-kola">
                <code className="text-[11px]">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </code>{" "}
                requis pour finaliser l’inscription (position du siège).
              </p>
            )}
            {form.formState.errors.address ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.address.message}
              </p>
            ) : null} */}
          </div>

          <div className="space-y-2 w-full">
            <Label
              htmlFor="fwd-reg-city"
              className="text-[13px] font-medium text-hh-muted"
            >
              Ville <span className="text-hh-kola">*</span>
            </Label>
            <GooglePlacesAddressField
              key={`city-${country}`}
              id="fwd-reg-city"
              required
              apiKey={mapsApiKey}
              value={form.watch("city") ?? ""}
              predictionTypes={["(cities)"]}
              onChangeText={(v) => {
                form.setValue("city", v, { shouldDirty: true });
                form.setValue("address", "", { shouldDirty: true });
                form.setValue("addressFormatted", undefined, {
                  shouldDirty: true,
                });
                form.setValue("latitude", undefined, { shouldDirty: true });
                form.setValue("longitude", undefined, { shouldDirty: true });
              }}
              onResolved={(data) => {
                const cityName =
                  data.city ??
                  data.formattedAddress.split(",")[0]?.trim() ??
                  data.formattedAddress;
                form.setValue("city", cityName, { shouldDirty: true });
                form.setValue("address", "", { shouldDirty: true });
                form.setValue("addressFormatted", undefined, {
                  shouldDirty: true,
                });
                form.setValue("latitude", undefined, { shouldDirty: true });
                form.setValue("longitude", undefined, { shouldDirty: true });
                if (data.country)
                  form.setValue("country", data.country, { shouldDirty: true });
              }}
              disabled={form.formState.isSubmitting}
              placeholder={
                mapsApiKey ? "ex. Montréal, Conakry…" : "Nom de la ville"
              }
              restrictCountry={country}
              inputClassName={cn(authInputClass)}
            />
            {form.formState.errors.city ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.city.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="fwd-reg-phone"
              className="text-[13px] font-medium text-hh-muted"
            >
              Téléphone
            </Label>
            <PhoneCountryField
              id="fwd-reg-phone"
              country={country}
              nationalFormatted={form.watch("phone") ?? ""}
              onNationalChange={onPhoneNationalChange}
              disabled={form.formState.isSubmitting}
              inputClassName={authInputClass}
              error={form.formState.errors.phone?.message}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[13px] font-medium text-hh-muted"
            >
              Email pro
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className={cn(authInputClass)}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[13px] font-medium text-hh-muted"
            >
              Mot de passe (5 à 72 caractères)
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              className={cn(authInputClass)}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-[13px] font-medium text-hh-muted"
            >
              Description (optionnel)
            </Label>
            <Input
              id="description"
              className={cn(authInputClass)}
              {...form.register("description")}
            />
          </div>

          {apiError ? (
            <p className="text-[13px] text-hh-kola" role="alert">
              {apiError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !mapsApiKey}
            className={authSubmitButtonClass}
          >
            {form.formState.isSubmitting ? "Création…" : "Créer mon compte pro"}
          </Button>
        </form>
        <p className="mt-8 border-t border-hh-sand-dk/15 pt-6 text-center text-[13px] text-hh-muted">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold text-hh-saffron-dk underline-offset-4 transition hover:text-hh-earth-dk hover:underline"
          >
            Connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
