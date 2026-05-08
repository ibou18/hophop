import { Suspense } from "react";
import type { Metadata } from "next";
import { ClaimAccountForm } from "@/components/auth/claim-account-form";

export const metadata: Metadata = {
  title: "Activer mon compte — Hophop",
};

export default function ClaimAccountPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense
        fallback={
          <div className="min-h-[24rem] w-full animate-pulse rounded-2xl bg-white/60" />
        }
      >
        <ClaimAccountForm />
      </Suspense>
    </div>
  );
}
