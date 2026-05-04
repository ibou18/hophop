-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('CA', 'FR', 'GN', 'SN', 'CI', 'CM');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'IN_TRANSIT', 'ARRIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('DECLARED', 'COLLECTED', 'IN_TRANSIT', 'ARRIVED', 'READY', 'DELIVERED', 'ISSUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PARCEL_REGISTERED', 'SHIPMENT_DEPARTURE', 'SHIPMENT_ARRIVED', 'PARCEL_READY', 'PARCEL_DELIVERED', 'PAYMENT_CONFIRMED', 'SHIPMENT_REQUEST_ACCEPTED', 'SHIPMENT_REQUEST_REJECTED');

-- CreateEnum
CREATE TYPE "ShipmentRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'MOVED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('PARCEL_DECLARED', 'PARCEL_LABEL_PRINTED', 'PARCEL_COLLECTED', 'PARCEL_CHECKED', 'PARCEL_ASSIGNED', 'PARCEL_UNASSIGNED', 'SHIPMENT_DEPARTED', 'CUSTOMS_ORIGIN', 'CUSTOMS_DESTINATION', 'IN_TRANSIT', 'SHIPMENT_ARRIVED', 'PARCEL_RECEIVED', 'PARCEL_READY', 'PARCEL_DELIVERED', 'PARCEL_ISSUE', 'PARCEL_ISSUE_RESOLVED', 'PARCEL_RETURNED', 'PAYMENT_RECEIVED');

-- CreateEnum
CREATE TYPE "TrackingActor" AS ENUM ('CLIENT', 'FORWARDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('CLOTHING', 'ELECTRONICS', 'FOOD', 'COSMETICS', 'DOCUMENTS', 'OTHER');

-- CreateTable
CREATE TABLE "forwarders" (
    "id" TEXT NOT NULL,
    "code5" CHAR(5) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" "Country" NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "paymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forwarders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" "Country" NOT NULL,
    "authMethod" "AuthMethod" NOT NULL DEFAULT 'EMAIL',
    "passwordHash" TEXT,
    "otpSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_forwarders" (
    "clientId" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_forwarders_pkey" PRIMARY KEY ("clientId","forwarderId")
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "originCountry" "Country" NOT NULL,
    "destinationCountry" "Country" NOT NULL,
    "destinationCity" TEXT,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "notes" TEXT,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "trackingCode" TEXT NOT NULL,
    "status" "ParcelStatus" NOT NULL DEFAULT 'DECLARED',
    "weightKg" DOUBLE PRECISION,
    "lengthCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "description" TEXT,
    "notes" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" "PaymentMethod",
    "declaredValue" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_items" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "category" "ItemCategory" NOT NULL DEFAULT 'OTHER',
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "type" "TrackingEventType" NOT NULL,
    "actor" "TrackingActor" NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "location" TEXT,
    "country" "Country",
    "note" TEXT,
    "internalNote" TEXT,
    "shipmentId" TEXT,
    "scannedCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_requests" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ShipmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "forwarderNote" TEXT,
    "movedToShipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forwarders_code5_key" ON "forwarders"("code5");

-- CreateIndex
CREATE UNIQUE INDEX "forwarders_email_key" ON "forwarders"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_key" ON "clients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_trackingCode_key" ON "parcels"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "payments_parcelId_key" ON "payments"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_requests_parcelId_key" ON "shipment_requests"("parcelId");

-- AddForeignKey
ALTER TABLE "client_forwarders" ADD CONSTRAINT "client_forwarders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_forwarders" ADD CONSTRAINT "client_forwarders_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_items" ADD CONSTRAINT "parcel_items_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_movedToShipmentId_fkey" FOREIGN KEY ("movedToShipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
