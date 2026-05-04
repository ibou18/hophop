"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TRACKING_CODE_PREFIX } from "@/lib/codes";

/** Même alphabet que `generateTrackingCode` (lib/codes.ts), en minuscules. */
const ALLOWED_SUFFIX = new Set(
  "abcdefghjkmnpqrstuvwxyz23456789".split(""),
);

function sanitizeSuffix(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (s.startsWith("hop-")) {
    s = s.slice(4);
  } else if (s.startsWith("trs-")) {
    s = s.slice(4);
  } else if (s.startsWith("hop")) {
    s = s.slice(3).replace(/^-/, "");
  } else if (s.startsWith("trs")) {
    s = s.slice(3).replace(/^-/, "");
  }
  const out: string[] = [];
  for (const ch of s) {
    if (ALLOWED_SUFFIX.has(ch)) out.push(ch);
    if (out.length >= 6) break;
  }
  return out.join("");
}

interface Props {
  dark?: boolean;
}

export function TrackingSearch({ dark = false }: Props) {
  const [suffix, setSuffix] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const s = sanitizeSuffix(suffix);
    if (!s) return;
    router.push(`/track/${TRACKING_CODE_PREFIX}${s.toUpperCase()}`);
  }

  function handleChange(value: string) {
    setSuffix(sanitizeSuffix(value));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 sm:flex-row sm:gap-0"
    >
      <div
        className={`relative flex h-12 min-w-0 flex-1 items-center gap-0 transition sm:rounded-r-none ${
          dark
            ? "rounded-xl border border-white/10 bg-white/8 focus-within:border-hh-saffron/50 focus-within:bg-white/12 focus-within:ring-2 focus-within:ring-hh-saffron/20"
            : "rounded-[var(--radius-hh-md)] border border-hh-sand-dk bg-white shadow-sm focus-within:border-hh-saffron focus-within:ring-2 focus-within:ring-hh-saffron/20"
        }`}
      >
        <Search
          size={15}
          className={`ml-4 shrink-0 ${dark ? "text-white/30" : "text-hh-muted"}`}
          aria-hidden
        />
        <span
          className={`shrink-0 pl-2 font-mono text-sm tabular-nums tracking-tight ${
            dark ? "text-white/55" : "text-hh-earth-dk/70"
          }`}
        >
          {TRACKING_CODE_PREFIX}
        </span>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          value={suffix}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="ex. zjrrw5"
          aria-label={`Suffixe du code de suivi après ${TRACKING_CODE_PREFIX}`}
          className={`min-h-0 min-w-0 flex-1 bg-transparent py-2 pr-4 font-mono text-sm lowercase outline-none placeholder:font-sans ${
            dark
              ? "text-white placeholder:text-white/25"
              : "text-hh-nuit placeholder:text-hh-muted/60"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={!sanitizeSuffix(suffix)}
        className={`h-12 px-6 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-l-none ${
          dark
            ? "rounded-xl bg-hh-saffron hover:bg-hh-saffron/90"
            : "rounded-[var(--radius-hh-md)] bg-hh-saffron shadow-sm hover:bg-hh-saffron/90"
        }`}
      >
        Suivre
      </button>
    </form>
  );
}
