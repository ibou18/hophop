-- CreateEnum
CREATE TYPE "ForwarderRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "forwarder_users" (
    "id" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "ForwarderRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forwarder_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forwarder_invitations" (
    "id" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ForwarderRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forwarder_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forwarder_users_email_key" ON "forwarder_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "forwarder_invitations_token_key" ON "forwarder_invitations"("token");

-- CreateIndex
CREATE INDEX "forwarder_invitations_forwarderId_idx" ON "forwarder_invitations"("forwarderId");

-- AddForeignKey
ALTER TABLE "forwarder_users" ADD CONSTRAINT "forwarder_users_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forwarder_invitations" ADD CONSTRAINT "forwarder_invitations_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forwarder_invitations" ADD CONSTRAINT "forwarder_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "forwarder_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
