"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Package,
  PlusCircle,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { HopLogoSidebarBrand } from "@/components/auth/hop-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/client/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/client/shipments", label: "Envois", icon: Truck },
  { href: "/client/parcels", label: "Mes colis", icon: Package },
  { href: "/client/parcel-requests", label: "Demandes", icon: Inbox },
  { href: "/client/declare", label: "Déclarer", icon: PlusCircle },
  { href: "/client/recipients", label: "Proches", icon: Users },
  { href: "/client/settings", label: "Paramètres", icon: Settings },
];

function navItemActive(href: string, pathname: string): boolean {
  if (href === "/client/dashboard") return pathname === "/client/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      tooltip={label}
      className={cn(
        "text-[15px] font-normal text-hh-earth-dk hover:bg-hh-saffron/10",
        active &&
          "bg-hh-saffron/20 font-medium text-hh-earth-dk data-active:bg-hh-saffron/20",
      )}
    >
      <Link
        href={href}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <Icon className="shrink-0 text-hh-saffron-dk" />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

/** Raccourcis bas d’écran (mobile uniquement) — le reste du menu reste dans la sidebar. */
const MOBILE_BOTTOM_SHORTCUTS: {
  href: string;
  label: string;
  icon: React.ElementType;
}[] = [
  { href: "/client/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/client/parcels", label: "Colis", icon: Package },
  { href: "/client/declare", label: "Déclarer", icon: PlusCircle },
  { href: "/client/parcel-requests", label: "Demandes", icon: Inbox },
];

function ClientMobileBottomBar({ pathname }: { pathname: string }) {
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-hh-sand-dk/20 bg-white/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-2px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:hidden"
      aria-label="Raccourcis"
    >
      {MOBILE_BOTTOM_SHORTCUTS.map((item) => {
        const active = navItemActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5"
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              className={cn(active ? "text-hh-saffron" : "text-hh-muted")}
            />
            <span
              className={cn(
                "max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight",
                active ? "text-hh-saffron-dk" : "text-hh-muted",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          if (isMobile) setOpenMobile(true);
        }}
        className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-hh-muted transition hover:text-hh-earth-dk"
      >
        <Menu size={20} strokeWidth={1.5} className="text-hh-saffron-dk" />
        <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-hh-muted">
          Menu
        </span>
      </button>
    </nav>
  );
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
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-hh-sand-dk/25 bg-hh-earth-lt text-hh-earth-dk [&_[data-slot=sidebar-inner]]:bg-hh-earth-lt"
      >
        <SidebarHeader className="border-b border-hh-sand-dk/15">
          <HopLogoSidebarBrand href="/client/dashboard">
            <span className="text-[11px] font-normal text-hh-muted group-data-[collapsible=icon]:hidden">
              Espace client
            </span>
          </HopLogoSidebarBrand>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const active = navItemActive(item.href, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <NavLink
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={active}
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-hh-sand-dk/15">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Contacter le support"
                className="text-[14px] font-normal text-hh-earth-dk hover:bg-hh-saffron/10"
              >
                <a href="mailto:contact@hopop.ca">
                  <LifeBuoy className="shrink-0 text-hh-saffron-dk" />
                  <span>Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex flex-col gap-0.5 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[13px] font-medium text-hh-earth-dk">{user.name}</p>
                <p className="truncate text-[11px] font-normal text-hh-muted">{user.email}</p>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SignOutButton className="w-full max-w-full" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-hh-sand">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-hh-sand-dk/25 bg-hh-sand/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-hh-sand/80 md:px-6">
          <SidebarTrigger className="text-hh-earth-dk hover:bg-hh-saffron/15" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <a
              href="mailto:contact@hopop.ca"
              className="hidden items-center gap-1.5 text-[12px] font-medium text-hh-saffron-dk underline-offset-2 hover:underline sm:inline-flex"
            >
              <LifeBuoy size={14} />
              Support
            </a>
            <span className="hidden max-w-[140px] truncate text-[13px] text-hh-muted md:inline">
              {user.name}
            </span>
            <Link
              href="/"
              className="shrink-0 text-[13px] font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
            >
              Site public
            </Link>
          </div>
        </header>
        <div
          className={cn(
            "flex flex-1 flex-col gap-6 p-4 md:p-6",
            /* Espace pour la barre flottante mobile (hauteur + bottom-3 + safe area) */
            "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-6",
          )}
        >
          {children}
        </div>

        <ClientMobileBottomBar pathname={pathname} />
      </SidebarInset>
    </SidebarProvider>
  );
}
