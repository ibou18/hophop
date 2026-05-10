"use client";

import { useState } from "react";
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
import { authCardClass, authInputClass, authSubmitButtonClass } from "@/components/auth/auth-ui-classes";
import { cn } from "@/lib/utils";
import { KeyRound } from "lucide-react";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Une erreur est survenue.");
        return;
      }
      setSent(true);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="space-y-3 pb-4 pt-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
            <KeyRound className="size-3.5 shrink-0" aria-hidden />
            Email envoyé
          </div>
          <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk sm:text-[2rem]">
            Vérifiez votre boîte mail
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
            Si un compte existe avec cet email, vous recevrez un lien de
            réinitialisation valable <strong>1 heure</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <p className="mt-2 text-center text-[13px] text-hh-muted">
            <Link
              href="/login"
              className="font-semibold text-hh-saffron-dk underline-offset-4 transition hover:text-hh-earth-dk hover:underline"
            >
              ← Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-3 pb-4 pt-8">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
          <KeyRound className="size-3.5 shrink-0" aria-hidden />
          Mot de passe oublié
        </div>
        <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk sm:text-[2rem]">
          Réinitialiser le mot de passe
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Saisissez votre adresse email. Si un compte existe, vous recevrez un
          lien pour choisir un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-hh-muted">
              Adresse email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={cn(authInputClass)}
            />
          </div>
          {error ? (
            <p className="text-[13px] text-hh-kola" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={loading} className={authSubmitButtonClass}>
            {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>

        <p className="mt-6 border-t border-hh-sand-dk/15 pt-5 text-center text-[13px] text-hh-muted">
          <Link
            href="/login"
            className="font-semibold text-hh-saffron-dk underline-offset-4 transition hover:text-hh-earth-dk hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
