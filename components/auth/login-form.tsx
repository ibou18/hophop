"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  authCardClass,
  authInputClass,
  authSubmitButtonClass,
  authTabsListClass,
  authTabsTriggerClass,
} from "@/components/auth/auth-ui-classes";
import { cn } from "@/lib/utils";
import { Building2, Sparkles, User } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [tab, setTab] = useState<"forwarder" | "client">("forwarder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onForwarderSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    setLoading(true);
    const res = await signIn("forwarder-credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects ou compte inactif.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onClientSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const phone = String(fd.get("phone") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!password || (!email && !phone)) {
      setError("Email ou téléphone, et mot de passe requis.");
      return;
    }
    setLoading(true);
    const res = await signIn("client-credentials", {
      email: email || undefined,
      phone: phone || undefined,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects ou compte inactif.");
      return;
    }
    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <Card className={cn(authCardClass)}>
      <CardHeader className="space-y-3 pb-4 pt-8">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          Accès compte
        </div>
        <CardTitle className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-hh-earth-dk sm:text-[2rem]">
          Connexion
        </CardTitle>
        <CardDescription className="text-[14px] leading-relaxed text-hh-muted">
          Espace transitaire ou compte expéditeur
        </CardDescription>
        {registered ? (
          <p className="rounded-xl border border-hh-savane/25 bg-hh-savane-lt/80 px-3 py-2 text-[13px] font-medium text-hh-savane-dk">
            Compte créé. Tu peux te connecter.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pb-8">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "forwarder" | "client");
            setError(null);
          }}
          className="gap-5"
        >
          <TabsList className={authTabsListClass}>
            <TabsTrigger value="forwarder" className={authTabsTriggerClass}>
              <Building2 className="size-4 opacity-80" aria-hidden />
              Transitaire
            </TabsTrigger>
            <TabsTrigger value="client" className={authTabsTriggerClass}>
              <User className="size-4 opacity-80" aria-hidden />
              Client
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forwarder" className="mt-0">
            <form onSubmit={onForwarderSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium text-hh-muted">
                  Email pro
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium text-hh-muted">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={cn(authInputClass)}
                />
              </div>
              {error && tab === "forwarder" ? (
                <p className="text-[13px] text-hh-kola" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={loading} className={authSubmitButtonClass}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="client" className="mt-0">
            <form onSubmit={onClientSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="cemail" className="text-[13px] font-medium text-hh-muted">
                  Email
                </Label>
                <Input
                  id="cemail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={cn(authInputClass)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[13px] font-medium text-hh-muted">
                  Téléphone (si pas d’email)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={cn(authInputClass)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpassword" className="text-[13px] font-medium text-hh-muted">
                  Mot de passe
                </Label>
                <Input
                  id="cpassword"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={cn(authInputClass)}
                />
              </div>
              {error && tab === "client" ? (
                <p className="text-[13px] text-hh-kola" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={loading} className={authSubmitButtonClass}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-8 border-t border-hh-sand-dk/15 pt-6 text-center text-[13px] text-hh-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-semibold text-hh-saffron-dk underline-offset-4 transition hover:text-hh-earth-dk hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
