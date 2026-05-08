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
      <TabsList
        variant="line"
        className="-mx-1 flex w-full justify-start overflow-x-auto rounded-none border-b border-hh-sand-dk/20 bg-transparent p-0"
      >
        <TabTrigger value="parcels" icon={<Package size={14} strokeWidth={1.8} />}>
          Colis
          {parcelCount > 0 ? <Counter>{parcelCount}</Counter> : null}
        </TabTrigger>
        <TabTrigger value="requests" icon={<MessageCircle size={14} strokeWidth={1.8} />}>
          Demandes
          {pendingRequestsCount > 0 ? (
            <Counter highlight>{pendingRequestsCount}</Counter>
          ) : null}
        </TabTrigger>
        <TabTrigger value="pricing" icon={<Tag size={14} strokeWidth={1.8} />}>
          Tarif
        </TabTrigger>
        <TabTrigger value="share" icon={<Share2 size={14} strokeWidth={1.8} />}>
          Partage
        </TabTrigger>
        <TabTrigger value="info" icon={<Calendar size={14} strokeWidth={1.8} />}>
          Infos
        </TabTrigger>
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
      <TabsContent value="share" className="mt-5 flex flex-col gap-5">
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
  children,
}: {
  value: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 text-[13px] font-medium text-hh-muted transition-colors hover:text-hh-earth-dk",
        "data-[state=active]:border-hh-saffron data-[state=active]:text-hh-earth-dk data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      )}
    >
      <span className="text-hh-muted/80 group-data-[state=active]/tabs-trigger:text-hh-saffron-dk">
        {icon}
      </span>
      {children}
    </TabsTrigger>
  );
}

function Counter({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
        highlight
          ? "bg-hh-saffron text-white"
          : "bg-hh-sand-dk/30 text-hh-earth-dk",
      )}
    >
      {children}
    </span>
  );
}
