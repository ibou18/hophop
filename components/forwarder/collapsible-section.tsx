"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Petit indicateur à droite du titre (ex. « Configurée » / « Non configurée »). */
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white shadow-sm transition-colors",
        open && "ring-1 ring-hh-saffron/20",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-hh-sand/30"
      >
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-hh-earth-dk">
            {title}
            {badge}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[12px] text-hh-muted">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cn(
            "shrink-0 text-hh-muted transition-transform",
            open && "rotate-180 text-hh-saffron-dk",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-hh-sand-dk/15 px-5 py-5">{children}</div>
      ) : null}
    </section>
  );
}
