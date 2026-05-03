import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddRecipientForm } from "@/components/client/add-recipient-form";

export const metadata: Metadata = { title: "Ajouter un proche" };

export default async function NewRecipientPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/client/recipients"
        className="mb-4 flex w-fit items-center gap-1.5 text-[13px] text-hh-muted hover:text-hh-earth-dk"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Retour aux proches
      </Link>
      <h1 className="mb-6 text-[28px] font-medium leading-tight text-hh-earth-dk">
        Ajouter un proche
      </h1>
      <AddRecipientForm />
    </div>
  );
}
