import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotype spec : Hop (earth-dk) + hop (saffron), weight 500, tracking -0.5px */
export function HopLogo({
  className,
  href,
}: {
  className?: string;
  /** Si omis, logotype sans lien (ex. page d’accueil). */
  href?: string;
}) {
  const inner = (
    <span
      className={cn(
        "inline-block text-[22px] font-medium tracking-[-0.5px] leading-none",
        className
      )}
    >
      <span className="text-hh-saffron-dk">Hop</span>
      <span className="text-hh-saffron">hop</span>
    </span>
  );
  if (href === undefined) return inner;
  return (
    <Link
      href={href}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron rounded-sm"
    >
      {inner}
    </Link>
  );
}
