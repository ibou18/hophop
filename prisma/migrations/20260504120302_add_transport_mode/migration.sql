-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('AIR', 'SEA', 'ROAD');

-- DropIndex
DROP INDEX "forwarder_tariffs_forwarderId_destinationCountry_idx";

-- AlterTable
ALTER TABLE "forwarder_tariffs" ADD COLUMN     "transportMode" "TransportMode";

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "transportMode" "TransportMode" NOT NULL DEFAULT 'AIR';

-- CreateIndex
CREATE INDEX "forwarder_tariffs_forwarderId_destinationCountry_transportM_idx" ON "forwarder_tariffs"("forwarderId", "destinationCountry", "transportMode");
