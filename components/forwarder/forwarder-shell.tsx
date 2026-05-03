"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  UsersRound,
} from "lucide-react";
import { HopLogo } from "@/components/auth/hop-logo";
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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/shipments", label: "Envois", icon: Truck },
  { href: "/parcels", label: "Colis", icon: Package },
  { href: "/clients", label: "Clients", icon: UsersRound },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

function navItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ForwarderShell({
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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-[var(--hh-radius-md)] px-2 py-2 transition-colors hover:bg-hh-saffron/10 outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
          >
            <HopLogo />
            <span className="text-[11px] font-normal text-hh-muted group-data-[collapsible=icon]:hidden">
              Espace transitaire
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = navItemActive(item.href, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "text-[15px] font-normal text-hh-earth-dk hover:bg-hh-saffron/10",
                          active &&
                            "bg-hh-saffron/20 font-medium text-hh-earth-dk data-active:bg-hh-saffron/20"
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="shrink-0 text-hh-saffron-dk" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
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
          <div className="flex flex-1 items-center justify-end gap-4">
            <Link
              href="/"
              className="text-[13px] font-medium text-hh-saffron-dk underline-offset-4 hover:underline"
            >
              Site public
            </Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
