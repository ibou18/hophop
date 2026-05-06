"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  Settings,
  Truck,
  UsersRound,
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

const NAV: {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: "ADMIN" | "OWNER"; // undefined = accessible à tous les rôles
}[] = [
  { href: "/dashboard",        label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/shipments",        label: "Envois",           icon: Truck },
  { href: "/parcels",          label: "Colis",            icon: Package },
  { href: "/scan",             label: "Scanner",          icon: ScanLine },
  { href: "/clients",          label: "Clients",          icon: UsersRound },
  { href: "/settings/team",    label: "Équipe",           icon: Users,    minRole: "ADMIN" },
  { href: "/settings",         label: "Paramètres",       icon: Settings, minRole: "ADMIN" },
];

function navItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard" || href === "/settings") return pathname === href;
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
        active && "bg-hh-saffron/20 font-medium text-hh-earth-dk data-active:bg-hh-saffron/20"
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

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  OWNER:  { label: "Propriétaire", cls: "bg-hh-saffron-lt text-hh-saffron-dk" },
  ADMIN:  { label: "Admin",        cls: "bg-sky-50 text-sky-700" },
  STAFF:  { label: "Collaborateur", cls: "bg-hh-sand text-hh-muted" },
};

function canAccess(itemMinRole: "ADMIN" | "OWNER" | undefined, userRole: string | undefined): boolean {
  if (!itemMinRole) return true;
  if (userRole === "OWNER") return true;
  if (userRole === "ADMIN" && itemMinRole === "ADMIN") return true;
  return false;
}

export function ForwarderShell({
  user,
  children,
}: {
  user: { name: string; email: string; forwarderRole?: string };
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
          <HopLogoSidebarBrand href="/dashboard">
            <span className="text-[11px] font-normal text-hh-muted group-data-[collapsible=icon]:hidden">
              Espace transitaire
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
                {NAV.filter((item) => canAccess(item.minRole, user.forwarderRole)).map((item) => {
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
              <div className="flex flex-col gap-0.5 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-hh-earth-dk">{user.name}</p>
                  {user.forwarderRole && ROLE_BADGE[user.forwarderRole] && (
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ROLE_BADGE[user.forwarderRole].cls}`}>
                      {ROLE_BADGE[user.forwarderRole].label}
                    </span>
                  )}
                </div>
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
