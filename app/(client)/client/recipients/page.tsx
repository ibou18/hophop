import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, Plus, Star } from "lucide-react";
import { getClientRecipients } from "@/lib/client-data";
import { countryLabelFr } from "@/lib/country-label-fr";

export const metadata: Metadata = { title: "Mes proches" };

export default async function RecipientsPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const recipients = await getClientRecipients(clientId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Mes proches
          </h1>
          <p className="mt-1 text-[14px] text-hh-muted">
            {recipients.length} destinataire{recipients.length !== 1 ? "s" : ""}{" "}
            enregistré{recipients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/client/recipients/new"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus size={14} strokeWidth={2} />
          Ajouter
        </Link>
      </div>

      {recipients.length === 0 ? (
        <div className="rounded-[var(--hh-radius-lg)] border border-dashed border-hh-sand-dk/40 bg-white px-5 py-14 text-center">
          <Users
            size={36}
            strokeWidth={1}
            className="mx-auto mb-3 text-hh-sand-dk"
          />
          <p className="text-[15px] font-medium text-hh-earth-dk">
            Aucun proche enregistré
          </p>
          <p className="mt-1 text-[13px] text-hh-muted">
            Ajoute un destinataire pour déclarer un colis rapidement.
          </p>
          <Link
            href="/client/recipients/new"
            className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2} />
            Ajouter un proche
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recipients.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between rounded-[var(--hh-radius-lg)] bg-white px-4 py-4 ring-1 ring-hh-sand-dk/20"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-medium text-hh-earth-dk">
                    {r.firstName} {r.lastName}
                  </p>
                  {r.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-hh-saffron-lt px-2 py-0.5 text-[11px] font-medium text-hh-saffron-dk">
                      <Star size={10} strokeWidth={2} />
                      défaut
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] text-hh-muted">
                  {r.city && `${r.city}, `}
                  {countryLabelFr(r.country)}
                </p>
                <p className="mt-0.5 text-[13px] text-hh-muted">{r.phone}</p>
                {r.address && (
                  <p className="mt-0.5 text-[12px] text-hh-muted">
                    {r.address}
                  </p>
                )}
              </div>
              <Link
                href={`/client/declare?recipientId=${r.id}`}
                className="shrink-0 rounded-[var(--hh-radius-sm)] bg-hh-saffron-lt px-3 py-1.5 text-[12px] font-medium text-hh-saffron-dk hover:bg-hh-saffron/15"
              >
                Déclarer
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
