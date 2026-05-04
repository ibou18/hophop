"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TrackingSearch() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/track/${trimmed}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:gap-0"
    >
      <div className="relative flex-1">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-hh-muted pointer-events-none"
        />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ex. TRS-ABC123"
          className="h-12 w-full rounded-[var(--radius-hh-md)] border border-hh-sand-dk bg-white pl-10 pr-4 text-sm text-hh-nuit placeholder:text-hh-muted/60 shadow-sm outline-none transition focus:border-hh-saffron focus:ring-2 focus:ring-hh-saffron/20 sm:rounded-r-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        disabled={!code.trim()}
        className="h-12 rounded-[var(--radius-hh-md)] bg-hh-saffron px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-hh-saffron/90 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-l-none"
      >
        Suivre
      </button>
    </form>
  );
}
