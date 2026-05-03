"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-9 rounded-[var(--hh-radius-md)] border-hh-saffron text-hh-saffron-dk text-[13px] font-medium hover:bg-hh-saffron-lt",
        className
      )}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Déconnexion
    </Button>
  );
}
