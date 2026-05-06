"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <TooltipProvider delayDuration={0}>
        {children}
        <Toaster
          position="bottom-center"
          richColors
          toastOptions={{
            classNames: {
              toast: "font-sans text-[14px]",
            },
          }}
        />
      </TooltipProvider>
    </SessionProvider>
  );
}
