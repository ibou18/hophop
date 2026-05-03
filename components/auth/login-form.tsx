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
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 rounded-[var(--hh-radius-md)] border-hh-sand-dk/40 bg-white text-[15px] placeholder:text-hh-muted focus-visible:border-hh-saffron focus-visible:ring-hh-saffron/25";

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
    <Card className="border-hh-sand-dk/35 bg-white shadow-sm ring-1 ring-hh-earth/5 rounded-[var(--hh-radius-lg)]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-[32px] font-medium leading-tight text-hh-earth-dk">
          Connexion
        </CardTitle>
        <CardDescription className="text-[13px] text-hh-muted">
          Espace transitaire ou compte expéditeur
        </CardDescription>
        {registered ? (
          <p className="text-[13px] font-medium text-hh-savane-dk pt-1">
            Compte créé. Tu peux te connecter.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "forwarder" | "client");
            setError(null);
          }}
          className="gap-4"
        >
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-[var(--hh-radius-md)] bg-hh-earth-lt/60 p-1">
            <TabsTrigger
              value="forwarder"
              className="rounded-[8px] data-active:bg-white data-active:text-hh-earth-dk data-active:shadow-sm text-[13px] font-medium text-hh-muted"
            >
              Transitaire
            </TabsTrigger>
            <TabsTrigger
              value="client"
              className="rounded-[8px] data-active:bg-white data-active:text-hh-earth-dk data-active:shadow-sm text-[13px] font-medium text-hh-muted"
            >
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
                  className={cn(inputClass)}
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
                  className={cn(inputClass)}
                />
              </div>
              {error && tab === "forwarder" ? (
                <p className="text-[13px] text-hh-kola" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-[var(--hh-radius-md)] bg-hh-saffron text-white text-sm font-medium hover:bg-hh-saffron/90 shadow-none"
              >
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
                  className={cn(inputClass)}
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
                  className={cn(inputClass)}
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
                  className={cn(inputClass)}
                />
              </div>
              {error && tab === "client" ? (
                <p className="text-[13px] text-hh-kola" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-[var(--hh-radius-md)] bg-hh-saffron text-white text-sm font-medium hover:bg-hh-saffron/90 shadow-none"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-[13px] text-hh-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
