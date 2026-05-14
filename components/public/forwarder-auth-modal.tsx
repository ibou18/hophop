"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import type { Country } from "@/app/generated/prisma/enums";
import { createClientSchema } from "@/lib/validations/client";
import { PhoneCountryField } from "@/components/forms/phone-country-field";
import { PasswordInput } from "@/components/ui/password-input";

type Tab = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  code5: string;
  forwarderName: string;
}

const inputClass =
  "h-11 w-full rounded-xl border border-hh-sand-dk/50 bg-hh-sand/60 px-4 text-sm text-hh-nuit placeholder:text-hh-muted/60 outline-none transition focus:border-hh-saffron focus:bg-white focus:ring-2 focus:ring-hh-saffron/15";

const labelClass = "mb-1.5 block text-xs font-medium text-hh-nuit/70";

export function ForwarderAuthModal({
  open,
  onClose,
  code5,
  forwarderName,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regCountry, setRegCountry] = useState<Country>("FR");
  const [regPhoneNational, setRegPhoneNational] = useState("");
  const onRegPhoneNational = useCallback((v: string) => setRegPhoneNational(v), []);

  async function linkForwarder() {
    await fetch("/api/client/forwarders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code5 }),
    });
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) return setError("Tous les champs sont requis.");
    setLoading(true);
    const res = await signIn("client-credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      return setError("Identifiants incorrects.");
    }
    await linkForwarder();
    setLoading(false);
    onClose();
    router.push(`/client/declare?forwarder=${code5}`);
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = createClientSchema.safeParse({
      code5,
      firstName: String(fd.get("firstName") ?? "").trim(),
      lastName: String(fd.get("lastName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim().toLowerCase(),
      phone: regPhoneNational,
      password: String(fd.get("password") ?? ""),
      country: regCountry,
      authMethod: "EMAIL" as const,
      address: "",
      city: "",
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Données invalides.";
      return setError(msg);
    }
    const body = parsed.data;
    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setLoading(false);
      return setError(data.error ?? "Inscription impossible.");
    }
    const login = await signIn("client-credentials", {
      email: body.email,
      password: body.password,
      redirect: false,
    });
    if (login?.error) {
      setLoading(false);
      return setError("Compte créé, mais connexion échouée. Réessayez.");
    }
    setLoading(false);
    onClose();
    router.push(`/client/declare?forwarder=${code5}`);
    router.refresh();
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-hh-sand-dk/30 bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogTitle className="sr-only">
          Se connecter pour rejoindre {forwarderName}
        </DialogTitle>

        {/* Header */}
        <div className="relative bg-hh-nuit px-7 py-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/40 transition hover:text-white"
          >
            <X size={16} />
          </button>
          <p className="text-xs font-medium uppercase tracking-widest text-hh-saffron/80">
            Rejoindre
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {forwarderName}
          </h2>
          <p className="mt-0.5 text-sm text-white/50">
            Connectez-vous pour accéder aux envois et déclarer vos colis.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-hh-sand-dk/40">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                tab === t
                  ? "border-b-2 border-hh-saffron text-hh-saffron-dk"
                  : "text-hh-muted hover:text-hh-nuit"
              }`}
            >
              {t === "login" ? "Connexion" : "Créer un compte"}
            </button>
          ))}
        </div>

        <div className="px-7 py-6">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mot de passe</label>
                <PasswordInput
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-hh-saffron text-sm font-medium text-white transition hover:bg-hh-saffron/90 disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Se connecter et rejoindre
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input name="firstName" placeholder="Mamadou" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nom</label>
                  <input name="lastName" placeholder="Diallo" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pays</label>
                <select
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value as Country)}
                  className={inputClass}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="modal-reg-phone">
                  Téléphone
                </label>
                <PhoneCountryField
                  id="modal-reg-phone"
                  country={regCountry}
                  nationalFormatted={regPhoneNational}
                  onNationalChange={onRegPhoneNational}
                  disabled={loading}
                  inputClassName={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mot de passe</label>
                <PasswordInput
                  name="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 caractères"
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-hh-saffron text-sm font-medium text-white transition hover:bg-hh-saffron/90 disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Créer mon compte et rejoindre
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
