"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Shield, Briefcase, UserCheck, Copy } from "lucide-react"
import { apiRequest } from "@/lib/api/client"

type TeamRole = "sub-admin" | "secretary" | "agent"

type TeamMember = {
  id: string
  name: string
  email: string
  role: TeamRole
  status: "active"
  joinedDate: string
}

type TeamResponse = {
  ok: boolean
  members: TeamMember[]
}

type CreateTeamResponse = {
  ok: boolean
  member: TeamMember
  temporaryPassword: string
}

const roleIcons = {
  "sub-admin": <Shield size={16} />,
  secretary: <Briefcase size={16} />,
  agent: <UserCheck size={16} />,
}

const roleDescriptions = {
  "sub-admin": "Manage users and basic operations",
  secretary: "Handle transactions and payments",
  agent: "Resolve disputes and customer queries",
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("")
  const [loadError, setLoadError] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "sub-admin" as TeamRole })

  const loadTeam = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true)

    try {
      setLoadError("")
      const payload = await apiRequest<TeamResponse>("/api/admin/team", { method: "GET" })
      setTeamMembers(payload.members)
      setLastRefreshedAt(new Date().toLocaleTimeString())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load team members"
      setLoadError(message)
    } finally {
      if (showLoader) setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTeam(false)
  }, [])

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return

    try {
      const payload = await apiRequest<CreateTeamResponse>("/api/admin/team", {
        method: "POST",
        body: newMember,
      })

      setTeamMembers((prev) => [payload.member, ...prev])
      setSelectedMember(payload.member)
      setTemporaryPassword(payload.temporaryPassword)
      setShowCredentialsModal(true)
      setNewMember({ name: "", email: "", role: "sub-admin" })
      setShowModal(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create member"
      setLoadError(message)
    }
  }

  const removeMember = async (id: string) => {
    try {
      await apiRequest(`/api/admin/team/${id}`, { method: "DELETE" })
      setTeamMembers((prev) => prev.filter((member) => member.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member"
      setLoadError(message)
    }
  }

  const roleCounts = useMemo(() => {
    return {
      "sub-admin": teamMembers.filter((member) => member.role === "sub-admin").length,
      secretary: teamMembers.filter((member) => member.role === "secretary").length,
      agent: teamMembers.filter((member) => member.role === "agent").length,
    }
  }, [teamMembers])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTeam(true)}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
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

      {lastRefreshedAt && <p className="text-sm text-gray-500 dark:text-gray-400">Last refreshed: {lastRefreshedAt}</p>}
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["sub-admin", "secretary", "agent"] as TeamRole[]).map((role) => (
          <div key={role} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              {roleIcons[role]}
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{role.replace("-", " ")}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{roleDescriptions[role]}</p>
            <p className="text-2xl font-bold text-blue-600">{roleCounts[role]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
                    Loading team members...
                  </td>
                </tr>
              )}
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium capitalize">
                      {roleIcons[member.role]}
                      {member.role.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.joinedDate}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && teamMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Team Member</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value as TeamRole })}
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCredentialsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team Member Credentials</h2>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {selectedMember.role.replace("-", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white dark:bg-gray-600 p-2 rounded border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white break-all">
                      {temporaryPassword}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(temporaryPassword)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                      title="Copy password"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
