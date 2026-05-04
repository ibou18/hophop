import { cn } from "@/lib/utils";

/** Carte formulaire auth — verre léger, ombre douce */
export const authCardClass = cn(
  "border-0 bg-white/[0.97] shadow-[0_12px_40px_-12px_rgba(74,31,8,0.15)] ring-1 ring-hh-earth-dk/[0.06]",
  "rounded-2xl backdrop-blur-sm",
);

/** Champ texte auth */
export const authInputClass = cn(
  "h-11 rounded-xl border-hh-sand-dk/35 bg-white text-[15px] shadow-inner shadow-black/[0.02]",
  "placeholder:text-hh-muted/80 transition-[box-shadow,border-color]",
  "focus-visible:border-hh-saffron focus-visible:ring-2 focus-visible:ring-hh-saffron/20",
);

/** Liste d’onglets type pilule */
export const authTabsListClass = cn(
  "grid h-11 w-full grid-cols-2 gap-1 rounded-full bg-gradient-to-b from-hh-earth-lt/90 to-hh-sand-dk/25 p-1 shadow-inner",
);

/** Déclencheur onglet (aligné Radix + tokens tabs du projet) */
export const authTabsTriggerClass = cn(
  "gap-2 rounded-full text-[13px] font-semibold text-hh-muted transition-all",
  "data-active:bg-white data-active:text-hh-earth-dk data-active:shadow-md",
  "hover:text-hh-earth-dk/80",
);

/** Bouton principal auth */
export const authSubmitButtonClass = cn(
  "h-11 w-full rounded-xl bg-hh-saffron text-[14px] font-semibold text-white shadow-md shadow-hh-saffron/25",
  "transition hover:bg-hh-saffron-dk hover:shadow-lg hover:shadow-hh-saffron/30",
);
