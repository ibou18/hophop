import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TariffManager, type TariffRow } from "@/components/forwarder/tariff-manager";

export default async function TariffsSettingsPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId) {
    redirect("/login");
  }

  // STAFF n'a pas accès à la grille tarifaire
  if (session.user.forwarderRole === "STAFF") {
    redirect("/dashboard?blocked=tariffs");
  }

  const tariffs = await prisma.forwarderTariff.findMany({
    where: { forwarderId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const rows: TariffRow[] = tariffs.map((t) => ({
    id: t.id,
    destinationCountry: t.destinationCountry,
    transportMode: t.transportMode,
    pricingType: t.pricingType,
    ratePerKg: t.ratePerKg,
    ratePerBox: t.ratePerBox,
    flatRate: t.flatRate,
    ratePerVolume: t.ratePerVolume,
    volumeDivisor: t.volumeDivisor,
    minimumCharge: t.minimumCharge,
    currency: t.currency,
    isActive: t.isActive,
    sortOrder: t.sortOrder,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-medium text-hh-earth-dk">Grille tarifaire</h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Définis tes tarifs par kilo, carton, poids volumétrique ou prix fixe.
          Le tarif par destination est prioritaire sur le tarif global.
        </p>
      </div>

      <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-medium text-hh-earth-dk">Tarifs actifs</h2>
        <p className="mt-1 mb-5 text-[13px] text-hh-muted">
          Ces tarifs sont utilisés pour calculer automatiquement le prix d&apos;un colis
          lors de sa déclaration.
        </p>
        <TariffManager initialTariffs={rows} />
      </section>
    </div>
  );
}
