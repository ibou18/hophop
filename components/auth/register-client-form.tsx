"use client";

import { useCallback, useState } from "react";
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

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function RegisterClientForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<ClientRegistrationFormInput>({
    defaultValues: {
      code5: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "CA",
      authMethod: "EMAIL",
      password: "",
    },
  });

  const country = form.watch("country");

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
      body: JSON.stringify({
        ...values,
        email: values.email,
        phone: values.phone,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setApiError(data.error ?? "Inscription impossible.");
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
    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-2 pb-4 pt-7">
        <CardTitle className="text-[1.35rem] font-semibold leading-tight text-hh-earth-dk">
          Compte expéditeur
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Rattache-toi à ton transitaire avec son code à 5 chiffres.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* <div className="space-y-2">
            <Label
              htmlFor="code5"
              className="text-[13px] font-medium text-hh-muted"
            >
              Code transitaire
            </Label>
            <Input
              id="code5"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="5 chiffres"
              className={cn(
                authInputClass,
                "font-mono text-[13px] font-medium text-hh-saffron-dk",
              )}
              {...form.register("code5")}
            />
            {form.formState.errors.code5 ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.code5.message}
              </p>
            ) : null}
          </div> */}
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
              Choisis d’abord ton pays : indicatif téléphone et suggestions
              d’adresse s’alignent dessus.
            </p>
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
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                maxLength={12}
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

          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-[13px] font-medium text-hh-muted"
            >
              Adresse (optionnel)
            </Label>
            <GooglePlacesAddressField
              apiKey={mapsApiKey}
              value={form.watch("address") ?? ""}
              onChangeText={(v) =>
                form.setValue("address", v, { shouldDirty: true })
              }
              onResolved={(data) => {
                form.setValue("address", data.formattedAddress, {
                  shouldDirty: true,
                });
                if (data.city)
                  form.setValue("city", data.city, { shouldDirty: true });
                if (data.country)
                  form.setValue("country", data.country, { shouldDirty: true });
              }}
              disabled={form.formState.isSubmitting}
              placeholder={
                mapsApiKey ? "Rechercher une adresse…" : "Adresse libre"
              }
              restrictCountry={country}
              inputClassName={cn(authInputClass)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="city"
              className="text-[13px] font-medium text-hh-muted"
            >
              Ville
            </Label>
            <Input
              id="city"
              className={cn(authInputClass)}
              {...form.register("city")}
            />
            {form.formState.errors.city ? (
              <p className="text-[11px] text-hh-kola">
                {form.formState.errors.city.message}
              </p>
            ) : null}
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
