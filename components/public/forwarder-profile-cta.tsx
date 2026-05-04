"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Check, Loader2, Share2 } from "lucide-react";
import { ForwarderAuthModal } from "./forwarder-auth-modal";

interface Props {
  code5: string;
  forwarderName: string;
  isAuthenticated: boolean;
  isLinked: boolean;
}

export function ForwarderProfileCta({
  code5,
  forwarderName,
  isAuthenticated,
  isLinked,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(isLinked);
  const [copied, setCopied] = useState(false);

  async function handleLink() {
    setLinking(true);
    await fetch("/api/client/forwarders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code5 }),
    });
    setLinked(true);
    setLinking(false);
    router.refresh();
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated && (
          <Link
            href={`/client/declare?forwarder=${code5}`}
            className="flex items-center gap-2 rounded-xl bg-hh-saffron px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-hh-saffron/90"
          >
            Déclarer un colis →
          </Link>
        )}

        {linked ? (
          <div className="flex items-center gap-2 rounded-xl bg-hh-savane-lt px-5 py-2.5 text-sm font-medium text-hh-savane-dk">
            <Check size={15} />
            Lié à ce transitaire
          </div>
        ) : isAuthenticated ? (
          <button
            type="button"
            onClick={handleLink}
            disabled={linking}
            className="flex items-center gap-2 rounded-xl border border-hh-saffron/40 bg-white px-5 py-2.5 text-sm font-medium text-hh-saffron-dk transition hover:bg-hh-saffron/5 disabled:opacity-60"
          >
            {linking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            Rejoindre (optionnel)
          </button>
        ) : (
          <>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/client/declare?forwarder=${code5}`)}`}
              className="flex items-center gap-2 rounded-xl bg-hh-saffron px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-hh-saffron/90"
            >
              Déclarer un colis →
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-hh-saffron/40 bg-white px-5 py-2.5 text-sm font-medium text-hh-saffron-dk transition hover:bg-hh-saffron/5"
            >
              <UserPlus size={15} />
              S&apos;inscrire
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-hh-sand-dk bg-white px-4 py-2.5 text-sm text-hh-muted transition hover:border-hh-saffron/30 hover:text-hh-nuit"
        >
          <Share2 size={14} />
          {copied ? "Lien copié !" : "Partager"}
        </button>
      </div>

      <ForwarderAuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        code5={code5}
        forwarderName={forwarderName}
      />
    </>
  );
}
