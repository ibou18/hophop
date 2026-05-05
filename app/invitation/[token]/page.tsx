"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Building2, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { HopLogo } from "@/components/auth/hop-logo";

const ROLE_LABEL = { OWNER: "Propriétaire", ADMIN: "Administrateur", STAFF: "Collaborateur" };

type InvitationData = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  expiresAt: string;
  forwarder: { id: string; name: string; city: string | null; code5: string; logoUrl: string | null };
};

type Status = "loading" | "ready" | "invalid" | "success" | "error";

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch invitation info
  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error ?? "Invitation invalide");
          setStatus("invalid");
        } else {
          setInvitation(json.data ?? json);
          setStatus("ready");
        }
      })
      .catch(() => {
        setErrorMsg("Impossible de charger l'invitation");
        setStatus("invalid");
      });
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setFormError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error ?? "Une erreur est survenue");
        return;
      }

      // Connexion automatique
      const email = invitation?.email ?? json.data?.email ?? json.email;
      const signInResult = await signIn("forwarder-credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("success"); // compte créé mais login échoué → rediriger vers login
      }
    });
  }

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hh-sand">
        <Loader2 size={32} className="animate-spin text-hh-saffron" />
      </div>
    );
  }

  // ── Invalid ──
  if (status === "invalid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hh-sand px-4">
        <HopLogo href="/" variant="wide" height={36} />
        <div className="w-full max-w-sm rounded-[var(--hh-radius-lg)] bg-white p-8 text-center shadow-sm ring-1 ring-hh-sand-dk/20">
          <XCircle size={40} className="mx-auto mb-4 text-hh-kola" />
          <h1 className="text-[20px] font-semibold text-hh-earth-dk">Invitation invalide</h1>
          <p className="mt-2 text-[14px] text-hh-muted">
            {errorMsg ?? "Ce lien d'invitation est expiré ou inexistant."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center rounded-[var(--hh-radius-md)] bg-hh-saffron px-6 text-[14px] font-medium text-white hover:opacity-90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hh-sand px-4">
        <HopLogo href="/" variant="wide" height={36} />
        <div className="w-full max-w-sm rounded-[var(--hh-radius-lg)] bg-white p-8 text-center shadow-sm ring-1 ring-hh-sand-dk/20">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-hh-savane" />
          <h1 className="text-[20px] font-semibold text-hh-earth-dk">Bienvenue dans l'équipe !</h1>
          <p className="mt-2 text-[14px] text-hh-muted">
            Votre compte a été créé. Redirection vers le tableau de bord…
          </p>
          <Loader2 size={18} className="mx-auto mt-4 animate-spin text-hh-saffron" />
        </div>
      </div>
    );
  }

  // ── Ready: form ──
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hh-sand px-4 py-10">
      <HopLogo href="/" variant="wide" height={36} />

      <div className="w-full max-w-md rounded-[var(--hh-radius-lg)] bg-white p-8 shadow-sm ring-1 ring-hh-sand-dk/20">
        {/* Forwarder info */}
        <div className="mb-6 flex items-center gap-3 rounded-[var(--hh-radius-md)] bg-hh-sand p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hh-earth-lt">
            <Building2 size={18} className="text-hh-earth-dk" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-hh-earth-dk">
              {invitation?.forwarder.name}
            </p>
            <p className="text-[12px] text-hh-muted">
              Vous rejoignez en tant que{" "}
              <strong>{ROLE_LABEL[invitation?.role ?? "STAFF"]}</strong>
            </p>
          </div>
        </div>

        <h1 className="mb-1 text-[22px] font-semibold text-hh-earth-dk">
          Créer votre compte
        </h1>
        <p className="mb-6 text-[14px] text-hh-muted">
          Votre email : <strong>{invitation?.email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
                Prénom
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marie"
                className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 px-3 py-2.5 text-[14px] outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
                Nom
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Diallo"
                className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 px-3 py-2.5 text-[14px] outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 px-3 py-2.5 text-[14px] outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 px-3 py-2.5 text-[14px] outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
            />
          </div>

          {formError && (
            <p className="rounded-[var(--hh-radius-md)] bg-hh-kola-lt px-3 py-2 text-[13px] text-hh-kola-dk ring-1 ring-hh-kola/20">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Rejoindre l'équipe
          </button>
        </form>
      </div>
    </div>
  );
}
