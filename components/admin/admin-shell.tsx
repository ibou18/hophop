"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
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

const NAV = [
  { href: "/admin/dashboard",  label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/forwarders", label: "Transitaires",   icon: Building2 },
  { href: "/admin/clients",    label: "Clients",        icon: Users },
  { href: "/admin/shipments",  label: "Envois",         icon: Truck },
  { href: "/admin/stats",      label: "Statistiques",   icon: BarChart3 },
];

function navActive(href: string, pathname: string): boolean {
  if (href === "/admin/dashboard") return pathname === href;
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
        "text-[15px] font-normal text-slate-200 hover:bg-violet-500/15 hover:text-white",
        active && "bg-violet-500/20 font-medium text-white data-active:bg-violet-500/20",
      )}
    >
      <Link
        href={href}
        onClick={() => { if (isMobile) setOpenMobile(false); }}
      >
        <Icon className={cn("shrink-0", active ? "text-violet-400" : "text-slate-400")} />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-slate-700/50 bg-slate-900 text-white [&_[data-slot=sidebar-inner]]:bg-slate-900"
      >
        <SidebarHeader className="border-b border-slate-700/50">
          <HopLogoSidebarBrand href="/admin/dashboard">
            <span className="text-[11px] font-medium text-violet-400 group-data-[collapsible=icon]:hidden">
              Panneau admin
            </span>
          </HopLogoSidebarBrand>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Plateforme
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={navActive(item.href, pathname)}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-700/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex flex-col gap-0.5 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[13px] font-medium text-slate-200">Admin</p>
                <span className="inline-flex w-fit rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
                  Super Admin
                </span>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SignOutButton className="w-full max-w-full text-slate-400 hover:text-white" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="text-slate-600 hover:bg-violet-50" />
          <div className="flex flex-1 items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              <span className="size-1.5 rounded-full bg-violet-500" />
              Panneau Admin
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-[13px] font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
          >
            Espace transitaire →
          </Link>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
