"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error";

export function RespondToQuotePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const action = searchParams.get("action") as "accept" | "reject" | null;
  const token = searchParams.get("token");

  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // Si action + token proviennent de l'email, déclencher automatiquement
  useEffect(() => {
    if (action && token) {
      void handleResponse(action, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResponse(act: "accept" | "reject", tok?: string) {
    setState("loading");
    setMessage(null);
    try {
      const endpoint = `/api/parcel-requests/${params.id}/${act}`;
      const url = tok ? `${endpoint}?token=${encodeURIComponent(tok)}` : endpoint;
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setMessage(
          (data as { error?: string }).error ?? "Une erreur est survenue.",
        );
        return;
      }

      setState("success");
      if (act === "accept") {
        setTrackingCode((data as { trackingCode?: string }).trackingCode ?? null);
        setTimeout(() => router.push("/client/parcels"), 4000);
      } else {
        setTimeout(() => router.push("/client/parcel-requests"), 3000);
      }
    } catch {
      setState("error");
      setMessage("Impossible de contacter le serveur.");
    }
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm">
        <div className="size-10 animate-spin rounded-full border-4 border-hh-sand-dk border-t-hh-saffron" />
        <p className="text-[14px] text-hh-muted">Traitement en cours…</p>
      </div>
    );
  }

  if (state === "success" && action === "accept") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm text-center">
        <CheckCircle className="size-12 text-green-500" />
        <h1 className="text-[22px] font-semibold text-hh-earth-dk">
          Offre acceptée !
        </h1>
        <p className="text-[14px] text-hh-muted">
          Votre colis a été créé et lié à l'envoi du transitaire.
        </p>
        {trackingCode && (
          <p className="rounded-xl bg-hh-sand px-4 py-2 font-mono text-[15px] font-bold text-hh-earth-dk">
            {trackingCode}
          </p>
        )}
        <p className="text-[13px] text-hh-muted">
          Redirection vers vos colis…
        </p>
        <Link
          href="/client/parcels"
          className="mt-2 text-[13px] font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
        >
          Voir mes colis →
        </Link>
      </div>
    );
  }

  if (state === "success" && action === "reject") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm text-center">
        <XCircle className="size-12 text-slate-400" />
        <h1 className="text-[22px] font-semibold text-hh-earth-dk">
          Offre refusée
        </h1>
        <p className="text-[14px] text-hh-muted">
          Votre demande est de nouveau disponible. D'autres transitaires pourront
          vous faire une offre.
        </p>
        <Link
          href="/client/parcel-requests"
          className="mt-2 inline-flex h-9 items-center rounded-xl bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          Voir mes demandes
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm text-center">
        <XCircle className="size-12 text-red-400" />
        <h1 className="text-[22px] font-semibold text-hh-earth-dk">Erreur</h1>
        <p className="text-[14px] text-hh-muted">{message}</p>
        <Link
          href="/client/parcel-requests"
          className="mt-2 text-[13px] font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
        >
          ← Retour à mes demandes
        </Link>
      </div>
    );
  }

  // Affichage par défaut si pas de token dans l'URL (accès direct depuis le dashboard)
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-[22px] font-semibold text-hh-earth-dk">
        {action === "accept" ? "Accepter l'offre" : "Refuser l'offre"}
      </h1>
      <p className="text-[14px] text-hh-muted">
        {action === "accept"
          ? "En acceptant, votre colis sera créé et lié à l'envoi du transitaire."
          : "En refusant, votre demande redeviendra disponible pour d'autres transitaires."}
      </p>
      {message && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {message}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => handleResponse(action ?? "reject")}
          className={`flex-1 h-10 rounded-xl text-[13px] font-semibold ${
            action === "accept"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          {action === "accept" ? "Confirmer l'acceptation" : "Confirmer le refus"}
        </Button>
        <Link
          href="/client/parcel-requests"
          className="flex-1 flex items-center justify-center h-10 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50"
        >
          Annuler
        </Link>
      </div>
    </div>
  );
}
