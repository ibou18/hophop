import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParcelRequestsMatchingList } from "@/components/forwarder/parcel-requests-matching-list";

export const metadata: Metadata = { title: "Demandes de colis — Hophop" };

async function getMatchingRequests(forwarderId: string) {
  // Récupérer les envois actifs du forwarder avec leurs routes
  const shipments = await prisma.shipment.findMany({
    where: {
      forwarderId,
      status: { not: "CLOSED" },
      isPublished: true,
    },
    select: {
      id: true,
      reference: true,
      originCountry: true,
      destinationCountry: true,
      departureDate: true,
      currency: true,
      pricingType: true,
      ratePerKg: true,
      ratePerBox: true,
      flatRate: true,
    },
  });

  if (shipments.length === 0) return { shipments: [], requests: [] };

  // Toutes les routes couvertes par ce forwarder
  const routes = shipments.map((s) => ({
    originCountry: s.originCountry,
    destinationCountry: s.destinationCountry,
    maxDate: s.departureDate,
  }));

  // Demandes PENDING qui matchent au moins une route du forwarder
  const requests = await prisma.parcelRequest.findMany({
    where: {
      status: "PENDING",
      OR: routes.map((r) => ({
        // Destination correspond
        recipient: { country: r.destinationCountry },
        // Origine correspond (si renseignée, sinon on inclut quand même)
        OR: [
          { originCountry: r.originCountry },
          { originCountry: null },
        ],
        // Le départ du colis ne dépasse pas la date d'envoi
        ...(r.maxDate ? { maxDepartureDate: { gte: r.maxDate } } : {}),
      })),
    },
    orderBy: { maxDepartureDate: "asc" },
    select: {
      id: true,
      status: true,
      maxDepartureDate: true,
      weightKg: true,
      description: true,
      declaredValue: true,
      createdAt: true,
      originCountry: true,
      originCity: true,
      client: {
        select: { firstName: true, lastName: true, country: true, city: true },
      },
      recipient: {
        select: { firstName: true, city: true, country: true },
      },
      items: { select: { name: true, quantity: true, category: true } },
    },
  });

  const ids = requests.map((r) => r.id);
  const imageRows =
    ids.length === 0
      ? []
      : await prisma.parcelRequestImage.findMany({
          where: { parcelRequestId: { in: ids } },
          orderBy: [{ parcelRequestId: "asc" }, { sortOrder: "asc" }],
          select: { parcelRequestId: true, url: true },
        });

  const urlsByRequest = new Map<string, string[]>();
  for (const row of imageRows) {
    const list = urlsByRequest.get(row.parcelRequestId) ?? [];
    list.push(row.url);
    urlsByRequest.set(row.parcelRequestId, list);
  }

  const requestsWithImages = requests.map((r) => {
    const imageUrls = urlsByRequest.get(r.id) ?? [];
    return {
      ...r,
      imageUrls,
      imageThumbnails: imageUrls.slice(0, 4),
      imageCount: imageUrls.length,
    };
  });

  return { shipments, requests: requestsWithImages };
}

export type MatchingRequestRow = Awaited<
  ReturnType<typeof getMatchingRequests>
>["requests"][number];

export type ForwarderShipmentOption = Awaited<
  ReturnType<typeof getMatchingRequests>
>["shipments"][number];

export default async function ForwarderParcelRequestsPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  const { shipments, requests } = await getMatchingRequests(forwarderId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Demandes de colis
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          Clients cherchant un transitaire sur vos routes.{" "}
          {requests.length > 0
            ? `${requests.length} demande${requests.length > 1 ? "s" : ""} disponible${requests.length > 1 ? "s" : ""}.`
            : "Aucune demande pour l'instant."}
        </p>
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hh-sand-dk/40 bg-white/60 px-8 py-14 text-center">
          <p className="text-[15px] font-medium text-hh-earth-dk">
            Aucun envoi publié actif
          </p>
          <p className="mt-2 text-[13px] text-hh-muted">
            Publiez un envoi pour voir les demandes de colis correspondantes.
          </p>
        </div>
      ) : (
        <ParcelRequestsMatchingList
          requests={requests}
          shipments={shipments}
        />
      )}
    </div>
  );
}
