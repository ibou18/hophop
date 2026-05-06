import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";
import { ScanInterface } from "@/components/forwarder/scan-interface";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scanner un colis — Hophop",
};

export default async function ScanPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <ScanLine size={22} className="text-hh-saffron-dk" />
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Scanner
          </h1>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-hh-muted">
          Scanne le QR code d&apos;un colis ou saisis son code de suivi pour
          consulter sa fiche, changer son statut ou l&apos;affecter à un envoi.
        </p>
      </div>

      <ScanInterface forwarderRole={session.user.forwarderRole} />
    </div>
  );
}
