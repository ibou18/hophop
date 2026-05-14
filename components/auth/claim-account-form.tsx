"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  authCardClass,
  authInputClass,
  authSubmitButtonClass,
} from "@/components/auth/auth-ui-classes";
import { cn } from "@/lib/utils";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

type TokenStatus =
  | { state: "loading" }
  | { state: "valid"; firstName: string; email: string | null }
  | { state: "invalid"; message: string }
  | { state: "expired" }
  | { state: "already_claimed" };

export function ClaimAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({ state: "loading" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setTokenStatus({ state: "invalid", message: "Lien d'activation manquant." });
      return;
    }
    fetch(`/api/register/claim?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (r.status === 404) {
          setTokenStatus({ state: "invalid", message: "Lien invalide ou déjà utilisé." });
        } else if (r.status === 410) {
          setTokenStatus({ state: "expired" });
        } else if (r.status === 409) {
          setTokenStatus({ state: "already_claimed" });
        } else if (r.ok) {
          const json = await r.json();
          setTokenStatus({ state: "valid", firstName: json.firstName, email: json.email });
        } else {
          setTokenStatus({ state: "invalid", message: "Erreur de validation du lien." });
        }
      })
      .catch(() => setTokenStatus({ state: "invalid", message: "Erreur réseau." }));
  }, [token]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/register/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.status === 410) {
        setError("Ce lien a expiré. Contactez votre transitaire.");
        return;
      }
      if (res.status === 409) {
        setError("Compte déjà activé. Connectez-vous directement.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.message ?? "Une erreur est survenue.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login?registered=1"), 2500);
    });
  }

  if (tokenStatus.state === "loading") {
    return (
      <Card className={cn(authCardClass)}>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-hh-saffron" />
        </CardContent>
      </Card>
    );
  }

  if (tokenStatus.state === "expired") {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="pt-8 pb-4">
          <CardTitle className="text-[1.5rem] font-semibold text-hh-earth-dk">
            Lien expiré
          </CardTitle>
          <CardDescription className="text-[14px] text-hh-muted">
            Ce lien d&apos;activation a expiré (validité 7 jours). Contactez
            votre transitaire pour qu&apos;il vous renvoie l&apos;invitation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (tokenStatus.state === "already_claimed") {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="pt-8 pb-4">
          <CardTitle className="text-[1.5rem] font-semibold text-hh-earth-dk">
            Compte déjà activé
          </CardTitle>
          <CardDescription className="text-[14px] text-hh-muted">
            Votre compte est déjà actif. Connectez-vous avec votre email et mot
            de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button
            className={cn(authSubmitButtonClass)}
            onClick={() => router.push("/login")}
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tokenStatus.state === "invalid") {
    return (
      <Card className={cn(authCardClass)}>
        <CardHeader className="pt-8 pb-4">
          <CardTitle className="text-[1.5rem] font-semibold text-hh-earth-dk">
            Lien invalide
          </CardTitle>
          <CardDescription className="text-[14px] text-hh-muted">
            {tokenStatus.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className={cn(authCardClass)}>
        <CardContent className="flex flex-col items-center gap-4 py-14">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <p className="text-[16px] font-semibold text-hh-earth-dk">
            Compte activé avec succès !
          </p>
          <p className="text-[13px] text-hh-muted">
            Redirection vers la connexion…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-2 pt-8 pb-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
          <KeyRound className="size-3.5" aria-hidden />
          Activation du compte
        </div>
        <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk">
          Bonjour, {tokenStatus.firstName}&nbsp;👋
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Définissez votre mot de passe pour activer votre compte Hophop.
          {tokenStatus.email ? (
            <>
              <br />
              <span className="font-medium text-hh-earth-dk/70">
                {tokenStatus.email}
              </span>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="claim-password"
              className="text-[13px] font-medium text-hh-muted"
            >
              Mot de passe
            </Label>
            <PasswordInput
              id="claim-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(authInputClass)}
              placeholder="8 caractères minimum"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="claim-confirm"
              className="text-[13px] font-medium text-hh-muted"
            >
              Confirmer le mot de passe
            </Label>
            <PasswordInput
              id="claim-confirm"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(authInputClass)}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            className={cn(authSubmitButtonClass, "mt-1")}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Activer mon compte"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
