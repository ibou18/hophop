"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ParcelDetailTabItem = {
  value: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

export function ParcelDetailTabsBase({
  defaultValue,
  tabs,
}: {
  defaultValue: string;
  tabs: ParcelDetailTabItem[];
}) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList
        variant="line"
        className="flex h-auto w-full items-stretch gap-0 rounded-none border-b border-hh-sand-dk/30 bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabTrigger key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </TabTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-5">
          {tab.content}
        </TabsContent>
      ))}
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
        "group/tab relative inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-2 sm:px-3 pt-2.5 pb-2 -mb-px text-[13px] font-medium text-hh-muted whitespace-nowrap transition-colors",
        "hover:bg-hh-sand/50 hover:text-hh-earth-dk",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 focus-visible:ring-inset",
        "data-[state=active]:border-b-hh-saffron data-[state=active]:bg-hh-saffron-lt/40 data-[state=active]:text-hh-saffron-dk data-[state=active]:font-semibold data-[state=active]:shadow-none",
      )}
    >
      <span className="shrink-0 text-hh-muted transition-colors group-hover/tab:text-hh-earth-dk group-data-[state=active]/tab:text-hh-saffron-dk">
        {icon}
      </span>
      <span className="hidden sm:inline">{children}</span>
    </TabsTrigger>
  );
}
