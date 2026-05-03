"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { createClientSchema } from "@/lib/validations/client";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.infer<typeof createClientSchema>;

const inputClass =
  "h-10 rounded-[var(--hh-radius-md)] border-hh-sand-dk/40 bg-white text-[15px] placeholder:text-hh-muted focus-visible:border-hh-saffron focus-visible:ring-hh-saffron/25";

export function RegisterClientForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    defaultValues: {
      code5: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "FR",
      authMethod: "EMAIL",
      password: "",
    },
  });
  const authMethod = useWatch({
    control: form.control,
    name: "authMethod",
    defaultValue: "EMAIL",
  });

  async function onSubmit(raw: FormValues) {
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
          form.setError(key as keyof FormValues, { message: issue.message });
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
    router.push("/login?registered=1");
  }

  return (
    <Card className="border-hh-sand-dk/35 bg-white shadow-sm ring-1 ring-hh-earth/5 rounded-[var(--hh-radius-lg)]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-[32px] font-medium leading-tight text-hh-earth-dk">
          Compte expéditeur
        </CardTitle>
        <CardDescription className="text-[13px] text-hh-muted">
          Rattache-toi à ton transitaire avec son code à 5 chiffres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="code5" className="text-[13px] font-medium text-hh-muted">
              Code transitaire
            </Label>
            <Input
              id="code5"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="5 chiffres"
              className={cn(inputClass, "font-mono text-[13px] font-medium text-hh-saffron-dk")}
              {...form.register("code5")}
            />
            {form.formState.errors.code5 ? (
              <p className="text-[11px] text-hh-kola">{form.formState.errors.code5.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[13px] font-medium text-hh-muted">
                Prénom
              </Label>
              <Input id="firstName" className={cn(inputClass)} {...form.register("firstName")} />
              {form.formState.errors.firstName ? (
                <p className="text-[11px] text-hh-kola">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[13px] font-medium text-hh-muted">
                Nom
              </Label>
              <Input id="lastName" className={cn(inputClass)} {...form.register("lastName")} />
              {form.formState.errors.lastName ? (
                <p className="text-[11px] text-hh-kola">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="authMethod" className="text-[13px] font-medium text-hh-muted">
              Méthode de connexion
            </Label>
            <Controller
              name="authMethod"
              control={form.control}
              render={({ field }) => (
                <select
                  id="authMethod"
                  className={cn(inputClass, "flex w-full px-3")}
                  {...field}
                >
                  <option value="EMAIL">Email + mot de passe</option>
                  <option value="PHONE">Téléphone + mot de passe</option>
                </select>
              )}
            />
          </div>
          {authMethod === "EMAIL" ? (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-hh-muted">
                Email
              </Label>
              <Input id="email" type="email" className={cn(inputClass)} {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-[11px] text-hh-kola">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[13px] font-medium text-hh-muted">
                Téléphone
              </Label>
              <Input id="phone" type="tel" className={cn(inputClass)} {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-[11px] text-hh-kola">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-hh-muted">
              Mot de passe (min. 8 caractères)
            </Label>
            <Input
              id="password"
              type="password"
              className={cn(inputClass)}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-[11px] text-hh-kola">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[13px] font-medium text-hh-muted">
                Pays
              </Label>
              <select
                id="country"
                className={cn(inputClass, "flex w-full px-3")}
                {...form.register("country")}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-[13px] font-medium text-hh-muted">
                Ville
              </Label>
              <Input id="city" className={cn(inputClass)} {...form.register("city")} />
              {form.formState.errors.city ? (
                <p className="text-[11px] text-hh-kola">{form.formState.errors.city.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-[13px] font-medium text-hh-muted">
              Adresse (optionnel)
            </Label>
            <Input id="address" className={cn(inputClass)} {...form.register("address")} />
          </div>
          {apiError ? (
            <p className="text-[13px] text-hh-kola" role="alert">
              {apiError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-10 w-full rounded-[var(--hh-radius-md)] bg-hh-saffron text-white text-sm font-medium hover:bg-hh-saffron/90 shadow-none"
          >
            {form.formState.isSubmitting ? "Création…" : "Créer mon compte"}
          </Button>
        </form>
        <p className="mt-6 text-center text-[13px] text-hh-muted">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
          >
            Connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
