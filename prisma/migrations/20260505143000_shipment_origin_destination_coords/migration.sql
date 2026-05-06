-- AlterTable
ALTER TABLE "shipments" ADD COLUMN "originCity" TEXT,
ADD COLUMN "originLatitude" DOUBLE PRECISION,
ADD COLUMN "originLongitude" DOUBLE PRECISION,
ADD COLUMN "destinationLatitude" DOUBLE PRECISION,
ADD COLUMN "destinationLongitude" DOUBLE PRECISION;
