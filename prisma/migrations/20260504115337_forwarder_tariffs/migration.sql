-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('WEIGHT_KG', 'PER_BOX', 'VOLUMETRIC', 'FLAT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'CAD', 'XOF', 'XAF', 'GNF');

-- AlterTable
ALTER TABLE "parcels" ADD COLUMN     "calculatedPrice" DOUBLE PRECISION,
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'EUR',
ADD COLUMN     "pricingType" "PricingType";

-- CreateTable
CREATE TABLE "forwarder_tariffs" (
    "id" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "destinationCountry" "Country",
    "pricingType" "PricingType" NOT NULL,
    "ratePerKg" DOUBLE PRECISION,
    "ratePerBox" DOUBLE PRECISION,
    "flatRate" DOUBLE PRECISION,
    "ratePerVolume" DOUBLE PRECISION,
    "volumeDivisor" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "minimumCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forwarder_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forwarder_tariffs_forwarderId_destinationCountry_idx" ON "forwarder_tariffs"("forwarderId", "destinationCountry");

-- AddForeignKey
ALTER TABLE "forwarder_tariffs" ADD CONSTRAINT "forwarder_tariffs_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
