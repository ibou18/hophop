"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { MapPin } from "lucide-react";
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
  createClientSchema,
  type ClientRegistrationFormInput,
} from "@/lib/validations/client";
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

export function RegisterClientForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<ClientRegistrationFormInput>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      country: "CA",
      authMethod: "EMAIL",
      password: "",
      cityLatitude: undefined as number | undefined,
      cityLongitude: undefined as number | undefined,
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
      form.setValue("cityLatitude", undefined, { shouldDirty: true });
      form.setValue("cityLongitude", undefined, { shouldDirty: true });
    }
  }, [country, form]);

  const onPhoneNationalChange = useCallback(
    (v: string) => {
      form.setValue("phone", v, { shouldValidate: true, shouldDirty: true });
    },
    [form],
  );

  async function onSubmit(raw: ClientRegistrationFormInput) {
    setApiError(null);
    const parsed = createClientSchema.safeParse({
      ...raw,
      email: raw.email?.trim() || undefined,
      phone: raw.phone?.trim() || undefined,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          form.setError(key as keyof ClientRegistrationFormInput, {
            message: issue.message,
          });
        }
      }
      return;
    }
    const values = parsed.data;
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        ...(values.code5 ? { code5: values.code5 } : {}),
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        country: values.country,
        authMethod: values.authMethod,
        password: values.password,
        city: values.city,
        ...(values.cityLatitude != null && values.cityLongitude != null
          ? {
              cityLatitude: values.cityLatitude,
              cityLongitude: values.cityLongitude,
            }
          : {}),
      }),
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
    const signInRes = await signIn("client-credentials", {
      email: values.email.toLowerCase(),
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
    window.location.assign("/client/dashboard");
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-2 pb-4 pt-7">
        <CardTitle className="text-[1.35rem] font-semibold leading-tight text-hh-earth-dk">
          Compte expéditeur
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Tu pourras lier un transitaire plus tard depuis ton espace (code à 5
          chiffres).
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-[13px] font-medium text-hh-muted"
              >
                Prénom
              </Label>
              <Input
                id="firstName"
                className={cn(authInputClass)}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-[11px] text-hh-kola">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-[13px] font-medium text-hh-muted"
              >
                Nom
              </Label>
              <Input
                id="lastName"
                className={cn(authInputClass)}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-[11px] text-hh-kola">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
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
              className={cn(authInputClass, "flex w-full px-3")}
              {...form.register("country")}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-hh-muted">
              Choisis d’abord ton pays : indicatif téléphone et suggestions de
              ville s’alignent dessus.
            </p>
          </div>

          <div className="space-y-2 w-full">
            <Label
              htmlFor="city"
              className="text-[13px] font-medium text-hh-muted"
            >
              Ville <span className="text-hh-kola">*</span>
            </Label>
            <GooglePlacesAddressField
              key={country}
              id="city"
              required
              apiKey={mapsApiKey}
              value={form.watch("city") ?? ""}
              predictionTypes={["(cities)"]}
              onChangeText={(v) => {
                form.setValue("city", v, { shouldDirty: true });
                form.setValue("cityLatitude", undefined, { shouldDirty: true });
                form.setValue("cityLongitude", undefined, {
                  shouldDirty: true,
                });
              }}
              onResolved={(data) => {
                const cityName =
                  data.city ??
                  data.formattedAddress.split(",")[0]?.trim() ??
                  data.formattedAddress;
                form.setValue("city", cityName, { shouldDirty: true });
                form.setValue("cityLatitude", data.latitude, {
                  shouldDirty: true,
                });
                form.setValue("cityLongitude", data.longitude, {
                  shouldDirty: true,
                });
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
            {/* {mapsApiKey ? (
              <p className="text-[11px] text-hh-muted">
                Obligatoire. Choisis une ville dans la liste pour enregistrer le
                centre-ville (GPS), comme pour les envois.
              </p>
            ) : (
              <p className="text-[11px] text-hh-muted">
                Obligatoire — saisie libre (sans carte, pas de GPS).
              </p>
            )} */}
            {/* {form.watch("cityLatitude") != null &&
            form.watch("cityLongitude") != null ? (
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <MapPin size={12} className="shrink-0" aria-hidden />
                Centre-ville enregistré&nbsp;:{" "}
                {Number(form.watch("cityLatitude")).toFixed(5)},{" "}
                {Number(form.watch("cityLongitude")).toFixed(5)}
              </p>
            ) : null} */}
            {form.formState.errors.city ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.city.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-[13px] font-medium text-hh-muted"
            >
              Téléphone
            </Label>
            <PhoneCountryField
              id="phone"
              country={country}
              nationalFormatted={form.watch("phone")}
              onNationalChange={onPhoneNationalChange}
              disabled={form.formState.isSubmitting}
              inputClassName={authInputClass}
              error={form.formState.errors.phone?.message}
            />
            <p className="text-[11px] text-hh-muted">
              Saisie limitée (14 chiffres côté numéro national, hors indicatif).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-hh-muted"
              >
                Email
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
          </div>

          {apiError ? (
            <p className="text-[13px] text-hh-kola" role="alert">
              {apiError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={authSubmitButtonClass}
          >
            {form.formState.isSubmitting ? "Création…" : "Créer mon compte"}
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
