"use client";

import type { ReactNode } from "react";
import { Clock, FileText, Building2, QrCode, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ParcelDetailTabs({
  hasJoinPanel,
  trackingContent,
  detailsContent,
  forwarderContent,
  qrContent,
  joinContent,
}: {
  hasJoinPanel: boolean;
  trackingContent: ReactNode;
  detailsContent: ReactNode;
  forwarderContent: ReactNode;
  qrContent: ReactNode;
  joinContent: ReactNode;
}) {
  return (
    <Tabs defaultValue="tracking" className="w-full">
      <TabsList
        variant="line"
        className="-mx-1 flex w-full justify-start overflow-x-auto rounded-none border-b border-hh-sand-dk/20 bg-transparent p-0"
      >
        <TabTrigger value="tracking" icon={<Clock size={14} strokeWidth={1.8} />}>
          Suivi
        </TabTrigger>
        <TabTrigger value="details" icon={<FileText size={14} strokeWidth={1.8} />}>
          Détails
        </TabTrigger>
        <TabTrigger value="forwarder" icon={<Building2 size={14} strokeWidth={1.8} />}>
          Transitaire
        </TabTrigger>
        <TabTrigger value="qr" icon={<QrCode size={14} strokeWidth={1.8} />}>
          QR Code
        </TabTrigger>
        {hasJoinPanel && (
          <TabTrigger value="join" icon={<PlusCircle size={14} strokeWidth={1.8} />}>
            Rejoindre
          </TabTrigger>
        )}
      </TabsList>

      <TabsContent value="tracking" className="mt-5">
        {trackingContent}
      </TabsContent>
      <TabsContent value="details" className="mt-5">
        {detailsContent}
      </TabsContent>
      <TabsContent value="forwarder" className="mt-5">
        {forwarderContent}
      </TabsContent>
      <TabsContent value="qr" className="mt-5">
        {qrContent}
      </TabsContent>
      {hasJoinPanel && (
        <TabsContent value="join" className="mt-5">
          {joinContent}
        </TabsContent>
      )}
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
      <span className="text-hh-muted/80">{icon}</span>
      {children}
    </TabsTrigger>
  );
}
