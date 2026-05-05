import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTeamMembers, getPendingInvitations } from "@/lib/forwarder-team-data";
import { TeamManager } from "@/components/forwarder/team-manager";

export const metadata: Metadata = { title: "Équipe — Hophop" };

export default async function TeamPage() {
  const session = await auth();
  const forwarderId = session?.user?.forwarderId;
  const forwarderUserId = session?.user?.forwarderUserId;
  const forwarderRole = session?.user?.forwarderRole;

  if (!session?.user || session.user.role !== "FORWARDER" || !forwarderId || !forwarderUserId) {
    redirect("/login");
  }

  const [members, invitations] = await Promise.all([
    getTeamMembers(forwarderId),
    getPendingInvitations(forwarderId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-medium text-hh-earth-dk">Équipe</h1>
        <p className="mt-2 text-[15px] text-hh-muted">
          Gérez les membres de votre agence et envoyez des invitations par email.
        </p>
      </div>
      <TeamManager
        initialMembers={members}
        initialInvitations={invitations}
        currentUserId={forwarderUserId}
        currentRole={forwarderRole ?? "STAFF"}
      />
    </div>
  );
}
