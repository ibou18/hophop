/**
 * Données de démo : 1 transitaire + 2 clients + colis.
 * Constantes en tête de fichier : email / code5 transitaire, codes colis TRS-SEED0x.
 *
 * Connexion transitaire : SEED_FORWARDER_EMAIL + test123
 * Connexion clients : SEED_CODE5 + email client + test123
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import {
  AuthMethod,
  Country,
  ItemCategory,
  ParcelStatus,
  PaymentMethod,
  ShipmentStatus,
  TrackingActor,
  TrackingEventType,
} from "../app/generated/prisma/enums";

const SEED_FORWARDER_EMAIL = "pro1@gmail.com";
const SEED_CODE5 = "12345";

/** Codes réservés au seed (globalement uniques) — nettoyage si orphelins d’un ancien run / autre tenant. */
const SEED_TRACKING_CODES = [
  "TRS-SEED01",
  "TRS-SEED02",
  "TRS-SEED03",
  "TRS-SEED04",
] as const;

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL est requise pour le seed.");
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Supprime un transitaire et toutes ses données liées (FK). */
async function wipeForwarderCascade(
  prisma: PrismaClient,
  forwarderId: string,
): Promise<void> {
  await prisma.payment.deleteMany({
    where: { client: { forwarderId } },
  });
  await prisma.notification.deleteMany({
    where: { client: { forwarderId } },
  });
  await prisma.trackingEvent.deleteMany({
    where: { parcel: { client: { forwarderId } } },
  });
  await prisma.parcelItem.deleteMany({
    where: { parcel: { client: { forwarderId } } },
  });
  await prisma.parcel.deleteMany({
    where: { client: { forwarderId } },
  });
  await prisma.shipment.deleteMany({ where: { forwarderId } });
  await prisma.recipient.deleteMany({
    where: { client: { forwarderId } },
  });
  await prisma.client.deleteMany({ where: { forwarderId } });
  await prisma.forwarder.delete({ where: { id: forwarderId } });
}

/**
 * Libère l’email ET le code5 réservés au seed (évite P2002 si un ancien enregistrement
 * n’a plus le même email mais garde encore le code5, ou l’inverse).
 */
async function wipeSeedForwarder(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.forwarder.findMany({
    where: {
      OR: [{ email: SEED_FORWARDER_EMAIL }, { code5: SEED_CODE5 }],
    },
    select: { id: true },
  });
  const ids = [...new Set(rows.map((r) => r.id))];
  for (const id of ids) {
    await wipeForwarderCascade(prisma, id);
  }
}

/** Supprime tout colis portant un code seed (même hors du transitaire courant). */
async function wipeParcelsBySeedTrackingCodes(prisma: PrismaClient): Promise<void> {
  const codes = [...SEED_TRACKING_CODES];
  await prisma.payment.deleteMany({
    where: { parcel: { trackingCode: { in: codes } } },
  });
  await prisma.notification.deleteMany({
    where: { parcel: { trackingCode: { in: codes } } },
  });
  await prisma.trackingEvent.deleteMany({
    where: { parcel: { trackingCode: { in: codes } } },
  });
  await prisma.parcelItem.deleteMany({
    where: { parcel: { trackingCode: { in: codes } } },
  });
  await prisma.parcel.deleteMany({
    where: { trackingCode: { in: codes } },
  });
}

async function main(): Promise<void> {
  const prisma = createPrisma();
  const passwordHash = await hash("test123", 12);

  try {
    await wipeSeedForwarder(prisma);
    await wipeParcelsBySeedTrackingCodes(prisma);

    const forwarder = await prisma.forwarder.create({
      data: {
        code5: SEED_CODE5,
        name: "Transitaire Demo (seed)",
        email: SEED_FORWARDER_EMAIL,
        phone: "+1 514-555-0100",
        country: Country.CA,
        city: "Montréal",
        address: "1000 rue du Port",
        description: "Compte généré par prisma/seed.ts",
        passwordHash,
        paymentEnabled: false,
      },
    });

    const client1 = await prisma.client.create({
      data: {
        forwarderId: forwarder.id,
        firstName: "Mamadou",
        lastName: "Diallo",
        email: "client1@gmail.com",
        phone: "+1 514-555-0201",
        address: "200 rue Ontario",
        city: "Montréal",
        country: Country.CA,
        authMethod: AuthMethod.EMAIL,
        passwordHash,
      },
    });

    const client2 = await prisma.client.create({
      data: {
        forwarderId: forwarder.id,
        firstName: "Karim",
        lastName: "Pro Logistics",
        email: "client2@gmail.com",
        phone: "+33 6 12 34 56 78",
        address: "15 avenue de la République",
        city: "Paris",
        country: Country.FR,
        authMethod: AuthMethod.EMAIL,
        passwordHash,
      },
    });

    const recipient1 = await prisma.recipient.create({
      data: {
        clientId: client1.id,
        firstName: "Ibrahima",
        lastName: "Camara",
        phone: "+224 611 22 33 44",
        address: "Quartier Kaloum",
        city: "Conakry",
        country: Country.GN,
        isDefault: true,
      },
    });

    const recipient1b = await prisma.recipient.create({
      data: {
        clientId: client1.id,
        firstName: "Fatou",
        lastName: "Diallo",
        phone: "+224 622 11 00 99",
        city: "Kindia",
        country: Country.GN,
        isDefault: false,
      },
    });

    const recipient2 = await prisma.recipient.create({
      data: {
        clientId: client2.id,
        firstName: "Amadou",
        lastName: "Sow",
        phone: "+221 77 100 20 30",
        address: "Plateau",
        city: "Dakar",
        country: Country.SN,
        isDefault: true,
      },
    });

    const shipment = await prisma.shipment.create({
      data: {
        forwarderId: forwarder.id,
        reference: "ENV-2026-SEED-001",
        status: ShipmentStatus.IN_TRANSIT,
        originCountry: Country.CA,
        destinationCountry: Country.GN,
        destinationCity: "Conakry",
        departureDate: new Date("2026-04-28T14:00:00.000Z"),
        notes: "Envoi seed — lot Montréal → Conakry",
      },
    });

    const parcelA = await prisma.parcel.create({
      data: {
        clientId: client1.id,
        recipientId: recipient1.id,
        trackingCode: "TRS-SEED01",
        status: ParcelStatus.DECLARED,
        weightKg: 4.2,
        lengthCm: 45,
        widthCm: 32,
        heightCm: 28,
        description: "Vêtements et cosmétiques",
        declaredValue: 180,
        price: 85,
        isPaid: false,
      },
    });

    const parcelB = await prisma.parcel.create({
      data: {
        clientId: client1.id,
        recipientId: recipient1.id,
        shipmentId: shipment.id,
        trackingCode: "TRS-SEED02",
        status: ParcelStatus.IN_TRANSIT,
        weightKg: 12.5,
        description: "Carton électronique + chargeurs",
        declaredValue: 420,
        price: 120,
        isPaid: true,
        paymentMethod: PaymentMethod.CASH,
      },
    });

    const parcelC = await prisma.parcel.create({
      data: {
        clientId: client1.id,
        recipientId: recipient1b.id,
        shipmentId: shipment.id,
        trackingCode: "TRS-SEED03",
        status: ParcelStatus.READY,
        weightKg: 2.1,
        description: "Documents administratifs",
        declaredValue: 0,
        price: 25,
        isPaid: true,
        paymentMethod: PaymentMethod.TRANSFER,
      },
    });

    const parcelD = await prisma.parcel.create({
      data: {
        clientId: client2.id,
        recipientId: recipient2.id,
        trackingCode: "TRS-SEED04",
        status: ParcelStatus.COLLECTED,
        weightKg: 8,
        description: "Matériel pro — pièces détachées",
        declaredValue: 950,
        price: 200,
        isPaid: false,
      },
    });

    await prisma.parcelItem.createMany({
      data: [
        {
          parcelId: parcelA.id,
          name: "Pulls et tee-shirts",
          quantity: 6,
          category: ItemCategory.CLOTHING,
          weightKg: 2.5,
        },
        {
          parcelId: parcelA.id,
          name: "Crème hydratante",
          quantity: 2,
          category: ItemCategory.COSMETICS,
          weightKg: 0.4,
        },
        {
          parcelId: parcelB.id,
          name: "Tablette reconditionnée",
          quantity: 1,
          category: ItemCategory.ELECTRONICS,
          weightKg: 0.6,
        },
        {
          parcelId: parcelD.id,
          name: "Roulements et joints",
          quantity: 40,
          category: ItemCategory.OTHER,
          weightKg: 6,
        },
      ],
    });

    await prisma.trackingEvent.createMany({
      data: [
        {
          parcelId: parcelA.id,
          type: TrackingEventType.PARCEL_DECLARED,
          actor: TrackingActor.CLIENT,
          actorId: client1.id,
          location: "Montréal",
          country: Country.CA,
          note: "Colis déclaré par le client",
        },
        {
          parcelId: parcelB.id,
          type: TrackingEventType.PARCEL_DECLARED,
          actor: TrackingActor.CLIENT,
          actorId: client1.id,
          country: Country.CA,
        },
        {
          parcelId: parcelB.id,
          type: TrackingEventType.PARCEL_COLLECTED,
          actor: TrackingActor.FORWARDER,
          actorId: forwarder.id,
          location: "Entrepôt Montréal",
          country: Country.CA,
          shipmentId: shipment.id,
        },
        {
          parcelId: parcelB.id,
          type: TrackingEventType.SHIPMENT_DEPARTED,
          actor: TrackingActor.FORWARDER,
          actorId: forwarder.id,
          location: "Aéroport YUL",
          country: Country.CA,
          shipmentId: shipment.id,
        },
        {
          parcelId: parcelC.id,
          type: TrackingEventType.PARCEL_READY,
          actor: TrackingActor.FORWARDER,
          actorId: forwarder.id,
          location: "Agence Kindia",
          country: Country.GN,
          note: "Prêt au retrait — pièce d’identité requise",
          shipmentId: shipment.id,
        },
        {
          parcelId: parcelD.id,
          type: TrackingEventType.PARCEL_COLLECTED,
          actor: TrackingActor.FORWARDER,
          actorId: forwarder.id,
          location: "Paris — entrepôt",
          country: Country.FR,
        },
      ],
    });

    console.log("Seed terminé.");
    console.log(`Transitaire : ${SEED_FORWARDER_EMAIL} (mdp: test123)`);
    console.log(
      `Code5 clients : ${SEED_CODE5} — client1@gmail.com, client2@gmail.com (mdp: test123)`,
    );
    console.log(
      `Colis : ${parcelA.trackingCode}, ${parcelB.trackingCode}, ${parcelC.trackingCode}, ${parcelD.trackingCode}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
