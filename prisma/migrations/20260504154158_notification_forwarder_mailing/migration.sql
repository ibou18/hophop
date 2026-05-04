-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FORWARDER_NEW_PARCEL_DECLARED';

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_clientId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "forwarderId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
