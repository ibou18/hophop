"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LifeBuoy,
  Package,
  PlusCircle,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { HopLogo } from "@/components/auth/hop-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/client/dashboard",  label: "Accueil",    icon: LayoutDashboard },
  { href: "/client/shipments",  label: "Envois",     icon: Truck },
  { href: "/client/parcels",    label: "Mes colis",  icon: Package },
  { href: "/client/declare",    label: "Déclarer",   icon: PlusCircle },
  { href: "/client/recipients", label: "Proches",    icon: Users },
  { href: "/client/settings",   label: "Paramètres", icon: Settings },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/client/dashboard") return pathname === "/client/dashboard";
  if (href === "/client/shipments") {
    return pathname === "/client/shipments" || pathname.startsWith("/client/shipments/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ClientShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-hh-sand">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hh-sand-dk/25 bg-hh-earth-lt px-4 sm:px-6">
        <Link
          href="/client/dashboard"
          className="flex min-w-0 items-center gap-2"
        >
          <span className="shrink-0 sm:hidden">
            <HopLogo variant="wide" height={32} />
          </span>
          <span className="hidden text-[15px] font-medium text-hh-earth-dk sm:inline">
            Espace client
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="mailto:contact@hopop.ca"
            className="hidden items-center gap-1.5 text-[12px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline sm:inline-flex"
          >
            <LifeBuoy size={14} />
            Support
          </a>
          <span className="hidden text-[13px] text-hh-muted sm:block">
            {user.name}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <nav className="hidden w-56 shrink-0 flex-col border-r border-hh-sand-dk/20 bg-hh-earth-lt py-6 sm:flex">
          <div className="px-3 pb-5">
            <Link
              href="/client/dashboard"
              className="inline-flex rounded-[var(--hh-radius-md)] p-1 transition hover:bg-hh-saffron/10"
              aria-label="Hophop — accueil client"
            >
              <HopLogo variant="mark" height={44} />
            </Link>
          </div>
          <div className="flex flex-col gap-1 px-3">
            {NAV.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--hh-radius-md)] px-3 py-2.5 text-[14px] font-normal transition-colors",
                    active
                      ? "bg-hh-saffron text-white"
                      : "text-hh-earth-dk hover:bg-hh-saffron/10"
                  )}
                >
                  <item.icon
                    size={18}
                    strokeWidth={1.5}
                    className={active ? "text-white" : "text-hh-saffron"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto px-3">
            <a
              href="mailto:contact@hopop.ca"
              className="mb-3 flex items-center gap-2 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-3 py-2 text-[13px] font-medium text-hh-saffron-dk transition hover:bg-hh-saffron-lt/40"
            >
              <LifeBuoy size={16} strokeWidth={1.7} />
              Contacter le support
            </a>
            <div className="rounded-[var(--hh-radius-md)] bg-hh-saffron-lt/50 px-3 py-3">
              <p className="text-[13px] font-medium text-hh-earth-dk">{user.name}</p>
              <p className="mt-0.5 text-[11px] text-hh-muted">{user.email}</p>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 pb-24 sm:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-hh-sand-dk/25 bg-white px-2 sm:hidden">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <item.icon
                size={20}
                strokeWidth={1.5}
                className={active ? "text-hh-saffron" : "text-hh-muted"}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-hh-saffron-dk" : "text-hh-muted"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <a
          href="mailto:contact@hopop.ca"
          className="flex flex-1 flex-col items-center gap-1 py-2"
        >
          <LifeBuoy size={20} strokeWidth={1.5} className="text-hh-muted" />
          <span className="text-[10px] font-medium text-hh-muted">Support</span>
        </a>
      </nav>
    </div>
  );
}
