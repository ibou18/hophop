"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ShieldCheck } from "lucide-react";

type TokenState = "loading" | "valid" | "invalid" | "expired";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>("loading");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 410) { setTokenState("expired"); return; }
        if (!res.ok) { setTokenState("invalid"); return; }
        setTokenState("valid");
      })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410) setTokenState("expired");
        else setError((data as { error?: string }).error ?? "Une erreur est survenue.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (tokenState === "loading") {
    return (
      <div
        className="min-h-[20rem] w-full max-w-md animate-pulse rounded-2xl bg-white/60 p-10 shadow-xl shadow-hh-earth-dk/[0.06] ring-1 ring-white/80"
        aria-hidden
      />
    );
  }

  if (tokenState === "expired") {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="space-y-3 pb-4 pt-8">
          <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk">
            Lien expiré
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
            Ce lien de réinitialisation n'est plus valide (durée de vie : 1 heure).
            Faites une nouvelle demande.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Link
            href="/forgot-password"
            className="block w-full rounded-xl bg-hh-saffron py-3 text-center text-[14px] font-semibold text-white shadow-md shadow-hh-saffron/25 transition hover:bg-hh-saffron-dk"
          >
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (tokenState === "invalid") {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="space-y-3 pb-4 pt-8">
          <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk">
            Lien invalide
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
            Ce lien de réinitialisation est invalide ou déjà utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Link
            href="/forgot-password"
            className="block w-full rounded-xl bg-hh-saffron py-3 text-center text-[14px] font-semibold text-white shadow-md shadow-hh-saffron/25 transition hover:bg-hh-saffron-dk"
          >
            Faire une nouvelle demande
          </Link>
          <p className="mt-4 text-center text-[13px] text-hh-muted">
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

  if (success) {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="space-y-3 pb-4 pt-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
            Mot de passe mis à jour
          </div>
          <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk">
            C'est fait !
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
            Votre mot de passe a été modifié. Vous allez être redirigé vers la
            connexion dans quelques secondes…
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-hh-saffron py-3 text-center text-[14px] font-semibold text-white shadow-md shadow-hh-saffron/25 transition hover:bg-hh-saffron-dk"
          >
            Se connecter maintenant
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-3 pb-4 pt-8">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          Nouveau mot de passe
        </div>
        <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk sm:text-[2rem]">
          Choisissez un mot de passe
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Minimum 8 caractères.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-hh-muted">
              Nouveau mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={cn(authInputClass)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-[13px] font-medium text-hh-muted">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={cn(authInputClass)}
            />
          </div>
          {error ? (
            <p className="text-[13px] text-hh-kola" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={loading} className={authSubmitButtonClass}>
            {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
