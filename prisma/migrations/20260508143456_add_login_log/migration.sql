-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "forwarderId" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_logs_clientId_loginAt_idx" ON "login_logs"("clientId", "loginAt");

-- CreateIndex
CREATE INDEX "login_logs_forwarderId_loginAt_idx" ON "login_logs"("forwarderId", "loginAt");

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
