"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
      description: "",
    },
  });

  const country = form.watch("country");

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
      body: JSON.stringify(values),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      issues?: unknown;
    };
    if (!res.ok) {
      setApiError(data.error ?? "Inscription impossible.");
      return;
    }
    router.push("/login?registered=1");
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
              Indicatif téléphone et recherche d’adresse limités à ce pays.
            </p>
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
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              maxLength={15}
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
            disabled={form.formState.isSubmitting}
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
