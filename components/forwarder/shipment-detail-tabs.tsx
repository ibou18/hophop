"use client";

import type { ReactNode } from "react";
import { Package, MessageCircle, Tag, Share2, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ShipmentDetailTabs({
  parcelCount,
  pendingRequestsCount,
  parcelsContent,
  requestsContent,
  pricingContent,
  shareContent,
  infoContent,
}: {
  parcelCount: number;
  pendingRequestsCount: number;
  parcelsContent: ReactNode;
  requestsContent: ReactNode;
  pricingContent: ReactNode;
  shareContent: ReactNode;
  infoContent: ReactNode;
}) {
  return (
    <Tabs defaultValue="parcels" className="w-full">
      {/* Tabs classiques — bordure pleine largeur, underline épais saffron sur l'actif */}
      <TabsList
        variant="line"
        className="flex h-auto w-full items-stretch gap-0 rounded-none border-b border-hh-sand-dk/30 bg-transparent p-0"
      >
        <TabTrigger
          value="parcels"
          label="Colis"
          icon={<Package size={18} strokeWidth={2} />}
          counter={parcelCount > 0 ? <Counter>{parcelCount}</Counter> : null}
        />
        <TabTrigger
          value="requests"
          label="Demandes"
          icon={<MessageCircle size={18} strokeWidth={2} />}
          counter={
            pendingRequestsCount > 0 ? (
              <Counter highlight>{pendingRequestsCount}</Counter>
            ) : null
          }
        />
        <TabTrigger
          value="pricing"
          label="Tarif"
          icon={<Tag size={18} strokeWidth={2} />}
        />
        <TabTrigger
          value="share"
          label="Partage"
          icon={<Share2 size={18} strokeWidth={2} />}
        />
        <TabTrigger
          value="info"
          label="Infos"
          icon={<Calendar size={18} strokeWidth={2} />}
        />
      </TabsList>

      <TabsContent value="parcels" className="mt-5 flex flex-col gap-5">
        {parcelsContent}
      </TabsContent>
      <TabsContent value="requests" id="tab-requests" className="mt-5 scroll-mt-24">
        {requestsContent}
      </TabsContent>
      <TabsContent value="pricing" className="mt-5">
        {pricingContent}
      </TabsContent>
      <TabsContent
        value="share"
        id="tab-share"
        className="mt-5 scroll-mt-24 flex flex-col gap-5"
      >
        {shareContent}
      </TabsContent>
      <TabsContent value="info" className="mt-5">
        {infoContent}
      </TabsContent>
    </Tabs>
  );
}

function TabTrigger({
  value,
  icon,
  label,
  counter,
}: {
  value: string;
  icon: ReactNode;
  label: string;
  counter?: ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      aria-label={label}
      title={label}
      className={cn(
        // Base — onglet plat, underline transparent au repos
        "group/tab relative inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-2 sm:px-3 pt-2.5 pb-2 -mb-px text-[13px] font-medium text-hh-muted whitespace-nowrap transition-colors",
        // Hover
        "hover:bg-hh-sand/50 hover:text-hh-earth-dk",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 focus-visible:ring-inset",
        // Actif — underline saffron épais + fond saffron léger + texte foncé bold
        "data-[state=active]:border-b-hh-saffron data-[state=active]:bg-hh-saffron-lt/40 data-[state=active]:text-hh-saffron-dk data-[state=active]:font-semibold data-[state=active]:shadow-none",
      )}
    >
      <span className="shrink-0 text-hh-muted transition-colors group-hover/tab:text-hh-earth-dk group-data-[state=active]/tab:text-hh-saffron-dk">
        {icon}
      </span>
      {/* Label : caché en mobile, visible dès sm (≥640px) */}
      <span className="hidden sm:inline">{label}</span>
      {counter}
    </TabsTrigger>
  );
}

function Counter({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
        highlight
          ? "bg-hh-saffron text-white shadow-sm"
          : "bg-hh-sand-dk/40 text-hh-earth-dk",
      )}
    >
      {children}
    </span>
  );
}
