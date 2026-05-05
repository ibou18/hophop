import { prisma } from "@/lib/prisma";

export type TeamMemberRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: Date;
};

export type TeamInvitationRow = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { firstName: string; lastName: string };
};

export async function getTeamMembers(forwarderId: string): Promise<TeamMemberRow[]> {
  return prisma.forwarderUser.findMany({
    where: { forwarderId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function getPendingInvitations(forwarderId: string): Promise<TeamInvitationRow[]> {
  return prisma.forwarderInvitation.findMany({
    where: {
      forwarderId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getInvitationByToken(token: string) {
  return prisma.forwarderInvitation.findUnique({
    where: { token },
    include: {
      forwarder: { select: { id: true, name: true, logoUrl: true, city: true } },
    },
  });
}
