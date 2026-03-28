"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Trash2,
  Shield,
  Briefcase,
  UserCheck,
  Mail,
  RefreshCw,
} from "lucide-react";

type TeamRole = "sub-admin" | "secretary" | "agent";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "inactive";
  joinedDate: string;
  credentialsSent?: boolean;
}

const roleIcons: Record<TeamRole, ReactNode> = {
  "sub-admin": <Shield size={16} />,
  secretary: <Briefcase size={16} />,
  agent: <UserCheck size={16} />,
};

const roleDescriptions: Record<TeamRole, string> = {
  "sub-admin": "Manage users and basic operations",
  secretary: "Handle transactions and payments",
  agent: "Resolve disputes and customer queries",
};

function normalizeRole(value: string): TeamRole {
  if (value === "subadmin" || value === "sub-admin") return "sub-admin";
  if (value === "secretary") return "secretary";
  return "agent";
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<{
    email: string;
    loginUrl: string;
  } | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "sub-admin" as TeamRole,
  });

  const counts = useMemo(() => {
    return {
      "sub-admin": teamMembers.filter((m) => m.role === "sub-admin").length,
      secretary: teamMembers.filter((m) => m.role === "secretary").length,
      agent: teamMembers.filter((m) => m.role === "agent").length,
    };
  }, [teamMembers]);

  async function loadTeamMembers(showLoading = false) {
    if (showLoading) setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/team-members", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to load team members");
      }

      const mapped: TeamMember[] = (payload.data || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: normalizeRole(String(member.role || "")),
        status: member.status === "inactive" ? "inactive" : "active",
        joinedDate: String(member.joinedDate || "").split("T")[0],
        credentialsSent: true,
      }));

      setTeamMembers(mapped);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members";
      setError(message);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadTeamMembers(true);
  }, []);

  async function handleAddMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setError("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMember.name.trim(),
          email: newMember.email.trim(),
          role: newMember.role,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to send promotion email");
      }

      await loadTeamMembers(false);
      if (payload?.invitation?.email && payload?.invitation?.loginUrl) {
        setInviteNotice({
          email: String(payload.invitation.email),
          loginUrl: String(payload.invitation.loginUrl),
        });
      }
      setShowModal(false);
      setNewMember({ name: "", email: "", role: "sub-admin" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send promotion email";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeTeamRole(id: string) {
    setError("");

    try {
      const response = await fetch(
        `/api/admin/team-members?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to revoke team role");
      }

      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke team role";
      setError(message);
    }
  }

  async function resendInvite(member: TeamMember) {
    setError("");
    try {
      const response = await fetch("/api/admin/team-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, action: "resend-invite" }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to resend invite");
      }

      setTeamMembers((prev) =>
        prev.map((item) =>
          item.id === member.id ? { ...item, credentialsSent: true } : item,
        ),
      );
      setInviteNotice({ email: member.email, loginUrl: `/${member.role}` });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend invite";
      setError(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Team Management
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTeamMembers(true)}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Team Member
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {lastRefreshedAt && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last refreshed: {lastRefreshedAt}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["sub-admin", "secretary", "agent"] as TeamRole[]).map((role) => (
          <div
            key={role}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              {roleIcons[role]}
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {role.replace("-", " ")}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {roleDescriptions[role]}
            </p>
            <p className="text-2xl font-bold text-blue-600">{counts[role]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Invitation
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr
                  key={`${member.id}-${member.email.toLowerCase()}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium capitalize">
                      {roleIcons[member.role]}
                      {member.role.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        member.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {member.joinedDate}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        member.credentialsSent
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {member.credentialsSent ? "Invite sent" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => resendInvite(member)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        title="Resend invite"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => revokeTeamRole(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                        title="Revoke team role"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Team Member
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newMember.role}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    role: e.target.value as TeamRole,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="sub-admin">Sub Admin</option>
                <option value="secretary">Secretary</option>
                <option value="agent">Agent</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSubmitting ? "Creating..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Promotion Email Sent
            </h2>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Recipient Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {inviteNotice.email}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Acceptance Link
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                    {inviteNotice.loginUrl}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                The user must click this email link to accept the promotion.
                Their role changes only after acceptance.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setInviteNotice(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
