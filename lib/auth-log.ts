import { prisma } from "@/lib/prisma";

export async function logLogin({
  clientId,
  forwarderId,
  ipAddress,
  userAgent,
}: {
  clientId?: string;
  forwarderId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!clientId && !forwarderId) return;

  await prisma.loginLog.create({
    data: {
      clientId,
      forwarderId,
      ipAddress,
      userAgent,
    },
  });
}
