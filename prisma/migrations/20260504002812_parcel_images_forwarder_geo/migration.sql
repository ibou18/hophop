-- AlterTable
ALTER TABLE "forwarders" ADD COLUMN     "addressFormatted" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "parcel_images" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcel_images_parcelId_idx" ON "parcel_images"("parcelId");

-- AddForeignKey
ALTER TABLE "parcel_images" ADD CONSTRAINT "parcel_images_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
