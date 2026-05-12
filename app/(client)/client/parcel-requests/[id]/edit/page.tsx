import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getClientRecipients } from "@/lib/client-data";
import {
  NewParcelRequestForm,
  type ParcelRequestEditInitial,
} from "@/components/client/new-parcel-request-form";
import { prisma } from "@/lib/prisma";
import type { Country } from "@/app/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Modifier la demande — Hophop",
};

type Props = { params: Promise<{ id: string }> };

export default async function EditParcelRequestPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/login");
  }

  const request = await prisma.parcelRequest.findFirst({
    where: { id, clientId },
    include: { items: true },
  });

  if (!request) notFound();
  if (request.status !== "PENDING") {
    redirect("/client/parcel-requests");
  }

  const images = await prisma.parcelRequestImage.findMany({
    where: { parcelRequestId: id },
    orderBy: { sortOrder: "asc" },
    select: { id: true, url: true },
  });

  const recipients = await getClientRecipients(clientId);
  if (recipients.length === 0) {
    redirect("/client/recipients/new?next=/client/parcel-requests");
  }

  const maxDateStr = request.maxDepartureDate.toISOString().slice(0, 10);

  const initial: ParcelRequestEditInitial = {
    id: request.id,
    status: request.status,
    recipientId: request.recipientId,
    maxDepartureDate: maxDateStr,
    originCountry: request.originCountry as Country | null,
    originCity: request.originCity,
    originLatitude: request.originLatitude,
    originLongitude: request.originLongitude,
    weightKg: request.weightKg,
    declaredValue: request.declaredValue,
    description: request.description,
    items: request.items.map((it) => ({
      category: it.category,
      name: it.name,
      quantity: it.quantity,
    })),
    existingImages: images,
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-medium leading-tight text-hh-earth-dk">
          Modifier la demande
        </h1>
        <p className="mt-1 text-[14px] text-hh-muted">
          Tant qu&apos;aucune offre n&apos;a été envoyée, tu peux ajuster le trajet,
          le contenu et les photos.
        </p>
      </div>
      <NewParcelRequestForm recipients={recipients} edit={initial} />
    </div>
  );
}
