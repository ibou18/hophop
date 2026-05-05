"use client";

import { useState, useTransition } from "react";
import {
  Crown,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  Mail,
  Clock,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { TeamMemberRow, TeamInvitationRow } from "@/lib/forwarder-team-data";

// ─────────────────────────────────────────────
// Rôle helpers
// ─────────────────────────────────────────────

const ROLE_CONFIG = {
  OWNER: {
    label: "Propriétaire",
    icon: Crown,
    bg: "bg-hh-saffron-lt",
    text: "text-hh-saffron-dk",
    ring: "ring-hh-saffron/20",
  },
  ADMIN: {
    label: "Administrateur",
    icon: ShieldCheck,
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
  },
  STAFF: {
    label: "Collaborateur",
    icon: User,
    bg: "bg-hh-sand",
    text: "text-hh-muted",
    ring: "ring-hh-sand-dk/30",
  },
} as const;

function RoleBadge({ role }: { role: "OWNER" | "ADMIN" | "STAFF" }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Invite modal
// ─────────────────────────────────────────────

function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Une erreur est survenue");
        return;
      }
      onSent();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--hh-radius-lg)] bg-white p-6 shadow-2xl ring-1 ring-hh-sand-dk/20">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-hh-earth-dk">Inviter un membre</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-hh-muted hover:bg-hh-sand">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@agence.com"
              className="w-full rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 py-2.5 text-[14px] text-hh-earth-dk placeholder-hh-muted outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-hh-earth-dk">
              Rôle
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
                className="w-full appearance-none rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-white px-3 py-2.5 text-[14px] text-hh-earth-dk outline-none focus:border-hh-saffron/60 focus:ring-2 focus:ring-hh-saffron/15"
              >
                <option value="STAFF">Collaborateur — opérations terrain</option>
                <option value="ADMIN">Administrateur — accès complet sauf membres</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-hh-muted" />
            </div>
            <p className="mt-1.5 text-[12px] text-hh-muted">
              {role === "STAFF"
                ? "Peut gérer les colis et envois. Ne peut pas modifier les paramètres."
                : "Peut tout faire sauf gérer les membres et la facturation."}
            </p>
          </div>

          {error && (
            <p className="rounded-[var(--hh-radius-md)] bg-hh-kola-lt px-3 py-2 text-[13px] text-hh-kola-dk ring-1 ring-hh-kola/20">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 px-4 py-2.5 text-[14px] font-medium text-hh-muted hover:bg-hh-sand/60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 py-2.5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Envoyer l'invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

type Props = {
  initialMembers: TeamMemberRow[];
  initialInvitations: TeamInvitationRow[];
  currentUserId: string;
  currentRole: "OWNER" | "ADMIN" | "STAFF";
};

export function TeamManager({
  initialMembers,
  initialInvitations,
  currentUserId,
  currentRole,
}: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [showInvite, setShowInvite] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentRole === "OWNER";
  const isAdmin = currentRole === "OWNER" || currentRole === "ADMIN";

  function handleInviteSent() {
    // Reload invitations
    startTransition(async () => {
      const res = await fetch("/api/team/invitations");
      if (res.ok) {
        const json = await res.json();
        setInvitations(json.data ?? json);
      }
    });
  }

  function cancelInvitation(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/team/invitations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      }
    });
  }

  function removeMember(id: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/team/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    });
  }

  function changeRole(id: string, newRole: "ADMIN" | "STAFF") {
    startTransition(async () => {
      const res = await fetch(`/api/team/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)),
        );
      }
    });
  }

  return (
    <>
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSent={handleInviteSent}
        />
      )}

      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-medium text-hh-earth-dk">Équipe</h2>
            <p className="mt-1 text-[14px] text-hh-muted">
              {members.length} membre{members.length > 1 ? "s" : ""}
              {invitations.length > 0 && ` · ${invitations.length} invitation${invitations.length > 1 ? "s" : ""} en attente`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 py-2 text-[14px] font-medium text-white shadow-sm hover:opacity-90"
            >
              <UserPlus size={15} />
              Inviter
            </button>
          )}
        </div>

        {/* ── Membres actifs ── */}
        <section className="space-y-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-hh-muted">
            Membres
          </h3>
          <div className="overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white">
            {members
              .filter((m) => m.isActive)
              .map((member, idx, arr) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    idx < arr.length - 1 ? "border-b border-hh-sand-dk/15" : ""
                  }`}
                >
                  {/* Avatar initiales */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hh-earth-lt text-[13px] font-semibold text-hh-earth-dk">
                    {member.firstName[0]?.toUpperCase()}
                    {member.lastName[0]?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-hh-earth-dk">
                        {member.firstName} {member.lastName}
                        {member.id === currentUserId && (
                          <span className="ml-1.5 text-[11px] font-normal text-hh-muted">(vous)</span>
                        )}
                      </p>
                      <RoleBadge role={member.role} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-hh-muted">{member.email}</p>
                  </div>

                  {/* Actions owner */}
                  {isOwner && member.role !== "OWNER" && member.id !== currentUserId && (
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={isPending}
                          onChange={(e) =>
                            changeRole(member.id, e.target.value as "ADMIN" | "STAFF")
                          }
                          className="appearance-none rounded-[var(--hh-radius-md)] border border-hh-sand-dk/40 bg-hh-sand px-2.5 py-1 pr-6 text-[12px] text-hh-earth-dk outline-none focus:border-hh-saffron/50"
                        >
                          <option value="STAFF">Collaborateur</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-2 text-hh-muted" />
                      </div>
                      <button
                        onClick={() => removeMember(member.id)}
                        disabled={isPending}
                        className="rounded-[var(--hh-radius-md)] p-1.5 text-hh-muted hover:bg-hh-kola-lt hover:text-hh-kola-dk disabled:opacity-40"
                        title="Retirer le membre"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* ── Invitations en attente ── */}
        {invitations.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-hh-muted">
              Invitations en attente
            </h3>
            <div className="overflow-hidden rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white">
              {invitations.map((inv, idx, arr) => (
                <div
                  key={inv.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    idx < arr.length - 1 ? "border-b border-hh-sand-dk/15" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hh-sand ring-1 ring-hh-sand-dk/25">
                    <Mail size={15} className="text-hh-muted" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-hh-earth-dk">{inv.email}</p>
                      <RoleBadge role={inv.role} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-hh-muted">
                      <Clock size={10} />
                      Expire{" "}
                      {formatDistanceToNow(new Date(inv.expiresAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                      {" · "}
                      Invité par {inv.invitedBy.firstName}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => cancelInvitation(inv.id)}
                      disabled={isPending}
                      className="shrink-0 rounded-[var(--hh-radius-md)] p-1.5 text-hh-muted hover:bg-hh-kola-lt hover:text-hh-kola-dk disabled:opacity-40"
                      title="Annuler l'invitation"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Permissions résumé ── */}
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/20 bg-hh-sand p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-hh-earth-dk">Permissions par rôle</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-hh-muted">
                  <th className="pb-2 text-left font-medium">Action</th>
                  <th className="pb-2 text-center font-medium">Propriétaire</th>
                  <th className="pb-2 text-center font-medium">Admin</th>
                  <th className="pb-2 text-center font-medium">Collaborateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hh-sand-dk/20">
                {[
                  ["Gérer colis & envois", true, true, true],
                  ["Voir les clients", true, true, true],
                  ["Paramètres agence", true, true, false],
                  ["Grille tarifaire", true, true, false],
                  ["Inviter des membres", true, true, false],
                  ["Retirer / changer rôle", true, false, false],
                ].map(([label, owner, admin, staff]) => (
                  <tr key={label as string}>
                    <td className="py-1.5 text-hh-earth-dk">{label as string}</td>
                    <td className="py-1.5 text-center">{owner ? "✅" : "—"}</td>
                    <td className="py-1.5 text-center">{admin ? "✅" : "—"}</td>
                    <td className="py-1.5 text-center">{staff ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
