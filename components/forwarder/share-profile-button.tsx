"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  code5: string;
}

export function ShareProfileButton({ code5 }: Props) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${code5}`
      : `/p/${code5}`;

  function copy() {
    navigator.clipboard.writeText(
      `${window.location.origin}/p/${code5}`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-hh-sand border border-hh-sand-dk/40 px-3 py-2">
      <span className="flex-1 truncate font-mono text-xs text-hh-muted">
        {url}
      </span>
      <a
        href={`/p/${code5}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg p-1.5 text-hh-muted transition hover:bg-hh-sand-dk hover:text-hh-nuit"
        title="Ouvrir"
      >
        <ExternalLink size={13} />
      </a>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 rounded-lg bg-hh-saffron px-3 py-1.5 text-xs font-medium text-white transition hover:bg-hh-saffron/90"
      >
        {copied ? (
          <>
            <Check size={12} />
            Copié !
          </>
        ) : (
          <>
            <Copy size={12} />
            Copier
          </>
        )}
      </button>
    </div>
  );
}
