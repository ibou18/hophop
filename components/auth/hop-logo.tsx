"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import logoWideSrc from "@/assets/logos/logo-b.png";
import logoMarkSrc from "@/assets/logos/logo.png";

export type HopLogoVariant = "wide" | "mark";

type HopLogoProps = {
  className?: string;
  /** Sans lien (ex. pied de page fixe). */
  href?: string;
  variant?: HopLogoVariant;
  /** Hauteur approximative en px — largeur déduite (wide) ou carré (mark). */
  height?: number;
  priority?: boolean;
};

/**
 * Logo officiel HopHop — `logo-b.png` (horizontal) ou `logo.png` (carré).
 */
export function HopLogo({
  className,
  href,
  variant = "wide",
  height,
  priority,
}: HopLogoProps) {
  const hWide = height ?? 36;
  const hMark = height ?? 40;

  const inner =
    variant === "mark" ? (
      <Image
        src={logoMarkSrc}
        alt="HopHop"
        width={512}
        height={512}
        className={cn("object-contain", className)}
        style={{ width: hMark, height: hMark, maxWidth: hMark, maxHeight: hMark }}
        priority={priority}
      />
    ) : (
      <Image
        src={logoWideSrc}
        alt="HopHop"
        width={1500}
        height={400}
        sizes="(max-width: 320px) 70vw, 280px"
        className={cn("w-auto max-w-[280px] object-contain object-left", className)}
        style={{ height: hWide }}
        priority={priority}
      />
    );

  if (href === undefined) return inner;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron rounded-sm"
    >
      {inner}
    </Link>
  );
}

/**
 * Barre latérale transitaire : logo horizontal si la sidebar est ouverte,
 * pictogramme carré si mode « icône » (réduit). En mobile (sheet), toujours horizontal.
 */
export function HopLogoSidebarBrand({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-[var(--hh-radius-md)] px-2 py-2 transition-colors hover:bg-hh-saffron/10 outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40",
        className,
      )}
    >
      {collapsed ? (
        <Image
          src={logoMarkSrc}
          alt="HopHop"
          width={512}
          height={512}
          className="size-9 shrink-0 object-contain"
          priority
        />
      ) : (
        <Image
          src={logoWideSrc}
          alt="HopHop"
          width={1500}
          height={400}
          className="h-9 w-auto max-w-[min(100%,200px)] shrink-0 object-contain object-left sm:max-w-[220px]"
          priority
        />
      )}
      {children}
    </Link>
  );
}
