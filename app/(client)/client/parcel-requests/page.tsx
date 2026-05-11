import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { ParcelRequestCard } from "@/components/client/parcel-request-card";

export const metadata: Metadata = { title: "Mes demandes de colis — Hophop" };

async function getParcelRequests(clientId: string) {
  const rows = await prisma.parcelRequest.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      maxDepartureDate: true,
      quotedPrice: true,
      quotedCurrency: true,
      quotedAt: true,
      quoteExpiresAt: true,
      quoteNote: true,
      quoteToken: true,
      description: true,
      weightKg: true,
      createdAt: true,
      recipient: {
        select: { firstName: true, lastName: true, city: true, country: true },
      },
      quotedForwarder: { select: { name: true } },
      quotedShipment: {
        select: { reference: true, departureDate: true, originCountry: true },
      },
      items: { select: { name: true, quantity: true } },
    },
  });

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [thumbRows, countRows] = await Promise.all([
    prisma.parcelRequestImage.findMany({
      where: { parcelRequestId: { in: ids } },
      orderBy: [{ parcelRequestId: "asc" }, { sortOrder: "asc" }],
      select: { parcelRequestId: true, url: true },
    }),
    prisma.parcelRequestImage.groupBy({
      by: ["parcelRequestId"],
      where: { parcelRequestId: { in: ids } },
      _count: { id: true },
    }),
  ]);

  const thumbnailsByRequest = new Map<string, string[]>();
  for (const img of thumbRows) {
    const list = thumbnailsByRequest.get(img.parcelRequestId) ?? [];
    if (list.length >= 4) continue;
    list.push(img.url);
    thumbnailsByRequest.set(img.parcelRequestId, list);
  }

  const countByRequest = new Map(
    countRows.map((c) => [c.parcelRequestId, c._count.id]),
  );

  return rows.map((r) => ({
    ...r,
    imageThumbnails: thumbnailsByRequest.get(r.id) ?? [],
    imageCount: countByRequest.get(r.id) ?? 0,
  }));
}

export type ParcelRequestRow = Awaited<ReturnType<typeof getParcelRequests>>[number];

export default async function ParcelRequestsPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const requests = await getParcelRequests(clientId);

  const active = requests.filter((r) =>
    ["PENDING", "QUOTED"].includes(r.status),
  );
  const closed = requests.filter((r) =>
    ["MATCHED", "EXPIRED", "CANCELLED"].includes(r.status),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
            Mes demandes de colis
          </h1>
          <p className="mt-1 text-[14px] text-hh-muted">
            {active.length} demande{active.length !== 1 ? "s" : ""} en cours
          </p>
        </div>
        <Link
          href="/client/parcel-requests/new"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nouvelle demande
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hh-sand-dk/40 bg-white/60 px-8 py-16 text-center">
          <p className="text-[15px] font-medium text-hh-earth-dk">
            Aucune demande pour l&apos;instant
          </p>
          <p className="mt-2 text-[13px] text-hh-muted">
            Décrivez votre colis et des transitaires vous feront une offre.
          </p>
          <Link
            href="/client/parcel-requests/new"
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-hh-saffron px-4 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Créer une demande
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-hh-muted">
                En cours
              </h2>
              {active.map((r) => (
                <ParcelRequestCard key={r.id} request={r} />
              ))}
            </section>
          )}
          {closed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-hh-muted">
                Terminées
              </h2>
              {closed.map((r) => (
                <ParcelRequestCard key={r.id} request={r} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
