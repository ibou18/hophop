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
import { authCardClass, authInputClass, authSubmitButtonClass } from "@/components/auth/auth-ui-classes";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.infer<typeof createForwarderSchema>;

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
            <Label htmlFor="name" className="text-[13px] font-medium text-hh-muted">
              Nom de l’entreprise
            </Label>
            <Input id="name" className={cn(authInputClass)} {...form.register("name")} />
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
              className={cn(authInputClass)}
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
              className={cn(authInputClass)}
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
            <Input id="phone" className={cn(authInputClass)} {...form.register("phone")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[13px] font-medium text-hh-muted">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-[13px] font-medium text-hh-muted">
                Ville
              </Label>
              <Input id="city" className={cn(authInputClass)} {...form.register("city")} />
              {form.formState.errors.city ? (
                <p className="text-[11px] text-hh-kola">{form.formState.errors.city.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-[13px] font-medium text-hh-muted">
              Adresse (optionnel)
            </Label>
            <Input id="address" className={cn(authInputClass)} {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[13px] font-medium text-hh-muted">
              Description (optionnel)
            </Label>
            <Input id="description" className={cn(authInputClass)} {...form.register("description")} />
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
