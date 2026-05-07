"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Check, Loader2, ArrowRight } from "lucide-react";
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated && (
          <Link
            href={`/client/declare?forwarder=${code5}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-saffron px-6 text-sm font-medium text-white shadow-md shadow-hh-saffron/25 transition-all hover:-translate-y-0.5 hover:bg-hh-saffron/95"
          >
            Déclarer un colis
            <ArrowRight size={15} />
          </Link>
        )}

        {linked ? (
          <div className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-savane-lt px-5 text-sm font-medium text-hh-savane-dk">
            <Check size={15} />
            Lié à ce transitaire
          </div>
        ) : isAuthenticated ? (
          <button
            type="button"
            onClick={handleLink}
            disabled={linking}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-hh-saffron/40 bg-white px-5 text-sm font-medium text-hh-saffron-dk transition hover:bg-hh-saffron-lt disabled:opacity-60"
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
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-hh-saffron px-6 text-sm font-medium text-white shadow-md shadow-hh-saffron/25 transition-all hover:-translate-y-0.5 hover:bg-hh-saffron/95"
            >
              Déclarer un colis
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-hh-saffron/40 bg-white px-5 text-sm font-medium text-hh-saffron-dk transition hover:bg-hh-saffron-lt"
            >
              <UserPlus size={15} />
              S&apos;inscrire
            </button>
          </>
        )}
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
