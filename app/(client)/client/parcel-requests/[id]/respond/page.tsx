import { Suspense } from "react";
import type { Metadata } from "next";
import { RespondToQuotePage } from "@/components/client/respond-to-quote";

export const metadata: Metadata = { title: "Réponse à l'offre — Hophop" };

export default function RespondPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Suspense>
        <RespondToQuotePage />
      </Suspense>
    </div>
  );
}
