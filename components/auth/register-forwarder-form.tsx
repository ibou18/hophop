"use client";

import { useState } from "react";
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
import { createForwarderSchema } from "@/lib/validations/forwarder";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.infer<typeof createForwarderSchema>;

const inputClass =
  "h-10 rounded-[var(--hh-radius-md)] border-hh-sand-dk/40 bg-white text-[15px] placeholder:text-hh-muted focus-visible:border-hh-saffron focus-visible:ring-hh-saffron/25";

export function RegisterForwarderForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      country: "FR",
      city: "",
      address: "",
      description: "",
    },
  });

  async function onSubmit(raw: FormValues) {
    setApiError(null);
    const parsed = createForwarderSchema.safeParse(raw);
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
    <Card className="border-hh-sand-dk/35 bg-white shadow-sm ring-1 ring-hh-earth/5 rounded-[var(--hh-radius-lg)]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-[32px] font-medium leading-tight text-hh-earth-dk">
          Compte transitaire
        </CardTitle>
        <CardDescription className="text-[13px] text-hh-muted">
          Crée ton espace pro pour gérer colis et envois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px] font-medium text-hh-muted">
              Nom de l’entreprise
            </Label>
            <Input id="name" className={cn(inputClass)} {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-[11px] text-hh-kola">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-hh-muted">
              Email pro
            </Label>
            <Input
              id="email"
              type="email"
              className={cn(inputClass)}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-[11px] text-hh-kola">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[13px] font-medium text-hh-muted">
              Téléphone (optionnel)
            </Label>
            <Input id="phone" className={cn(inputClass)} {...form.register("phone")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[13px] font-medium text-hh-muted">
                Pays
              </Label>
              <select
                id="country"
                className={cn(inputClass, "flex w-full appearance-none px-3")}
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
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[13px] font-medium text-hh-muted">
              Description (optionnel)
            </Label>
            <Input id="description" className={cn(inputClass)} {...form.register("description")} />
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
            {form.formState.isSubmitting ? "Création…" : "Créer mon compte pro"}
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
