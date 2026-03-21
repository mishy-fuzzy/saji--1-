"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Shield, Briefcase, UserCheck, Copy, Mail, RefreshCw } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "sub-admin" | "secretary" | "agent"
  status: "active" | "inactive"
  joinedDate: string
  password?: string
  credentialsSent?: boolean
}

const TEAM_MEMBERS_STORAGE_KEY = "saji-admin-team-members"
const TEAM_CREDENTIALS_STORAGE_KEY = "team_credentials"
const TEAM_AUTO_REFRESH_MS = 5000

const defaultTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "sub-admin",
    status: "active",
    joinedDate: "2024-01-15",
    credentialsSent: true,
  },
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "secretary",
    status: "active",
    joinedDate: "2024-02-20",
    credentialsSent: true,
  },
  {
    id: "3",
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "agent",
    status: "active",
    joinedDate: "2024-03-10",
    credentialsSent: true,
  },
]

function isTeamRole(value: unknown): value is TeamMember["role"] {
  return value === "sub-admin" || value === "secretary" || value === "agent"
}

function getMergedTeamMembers(): TeamMember[] {
  const persistedTeamMembers = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY)
  let baseTeamMembers = defaultTeamMembers

  if (persistedTeamMembers) {
    try {
      const parsed = JSON.parse(persistedTeamMembers) as TeamMember[]
      if (Array.isArray(parsed)) {
        baseTeamMembers = parsed
      }
    } catch {
      // Fall back to defaults when storage is invalid.
    }
  }

  let credentialsRecord: Record<string, any> = {}
  const storedCredentials = localStorage.getItem(TEAM_CREDENTIALS_STORAGE_KEY)
  if (storedCredentials) {
    try {
      const parsed = JSON.parse(storedCredentials)
      if (parsed && typeof parsed === "object") {
        credentialsRecord = parsed
      }
    } catch {
      // Ignore invalid credentials storage and keep current team list.
    }
  }

  const mergedByEmail = new Map(baseTeamMembers.map((member) => [member.email.toLowerCase(), member]))

  Object.values(credentialsRecord).forEach((record: any) => {
    const email = typeof record?.email === "string" ? record.email : ""
    if (!email) return

    const normalizedEmail = email.toLowerCase()
    const existing = mergedByEmail.get(normalizedEmail)
    const role = isTeamRole(record?.teamRole) ? record.teamRole : existing?.role ?? "sub-admin"

    mergedByEmail.set(normalizedEmail, {
      id: typeof record?.id === "string" ? record.id : existing?.id ?? `member-${normalizedEmail}`,
      name:
        typeof record?.name === "string" && record.name.trim() ? record.name : existing?.name ?? email.split("@")[0],
      email,
      role,
      status: existing?.status ?? "active",
      joinedDate: existing?.joinedDate ?? new Date().toISOString().split("T")[0],
      password: existing?.password,
      credentialsSent: true,
    })
  })

  const mergedMembers = Array.from(mergedByEmail.values())
  const usedIds = new Set<string>()

  return mergedMembers.map((member) => {
    let normalizedId = member.id || `member-${member.email.toLowerCase()}`
    if (usedIds.has(normalizedId)) {
      normalizedId = `member-${member.email.toLowerCase()}`
    }
    usedIds.add(normalizedId)
    return { ...member, id: normalizedId }
  })
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("")

  const [showModal, setShowModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "sub-admin" as const })

  const syncTeamMembers = (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)

    const storedCredentials = localStorage.getItem(TEAM_CREDENTIALS_STORAGE_KEY)
    if (storedCredentials) {
      try {
        const parsed = JSON.parse(storedCredentials)

        if (Array.isArray(parsed)) {
          const normalized: Record<string, any> = {}
          parsed.forEach((record: any) => {
            const email = typeof record?.email === "string" ? record.email : ""
            if (!email) return
            normalized[email] = {
              id: String(record?.id ?? `member-${email.toLowerCase()}`),
              name: typeof record?.name === "string" ? record.name : email.split("@")[0],
              email,
              teamRole: isTeamRole(record?.teamRole) ? record.teamRole : isTeamRole(record?.role) ? record.role : "sub-admin",
              password: typeof record?.password === "string" ? record.password : "",
            }
          })
          localStorage.setItem(TEAM_CREDENTIALS_STORAGE_KEY, JSON.stringify(normalized))
        }
      } catch {
        // Keep existing data if credentials JSON cannot be parsed.
      }
    }

    setTeamMembers(getMergedTeamMembers())
    setLastRefreshedAt(new Date().toLocaleTimeString())
    if (showLoading) setIsRefreshing(false)
  }

  useEffect(() => {
    syncTeamMembers(false)

    const handleStorageSync = (event: StorageEvent) => {
      if (!event.key || event.key === TEAM_MEMBERS_STORAGE_KEY || event.key === TEAM_CREDENTIALS_STORAGE_KEY) {
        syncTeamMembers(false)
      }
    }

    const handleWindowFocus = () => {
      syncTeamMembers(false)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncTeamMembers(false)
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncTeamMembers(false)
      }
    }, TEAM_AUTO_REFRESH_MS)

    window.addEventListener("storage", handleStorageSync)
    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("storage", handleStorageSync)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(teamMembers))
  }, [teamMembers])

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

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleAddMember = () => {
    if (newMember.name && newMember.email) {
      const password = generatePassword()
      const member: TeamMember = {
        id: crypto.randomUUID(),
        ...newMember,
        status: "active",
        joinedDate: new Date().toISOString().split("T")[0],
        password,
        credentialsSent: false,
      }

      setTeamMembers([...teamMembers, member])
      setSelectedMember(member)
      setShowCredentialsModal(true)
      setNewMember({ name: "", email: "", role: "sub-admin" })
      setShowModal(false)
    }
  }

  const handleSendCredentials = (member: TeamMember) => {
    const credentials = JSON.parse(localStorage.getItem(TEAM_CREDENTIALS_STORAGE_KEY) || "{}")
    credentials[member.email] = {
      id: member.id,
      name: member.name,
      email: member.email,
      teamRole: member.role,
      password: member.password,
    }
    localStorage.setItem(TEAM_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))

    // Mark as sent
    setTeamMembers(teamMembers.map((m) => (m.id === member.id ? { ...m, credentialsSent: true } : m)))

    setShowCredentialsModal(false)
  }

  const removeMember = (id: string) => {
    const memberToRemove = teamMembers.find((m) => m.id === id)
    if (memberToRemove) {
      const credentials = JSON.parse(localStorage.getItem(TEAM_CREDENTIALS_STORAGE_KEY) || "{}")
      delete credentials[memberToRemove.email]
      localStorage.setItem(TEAM_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
    }

    setTeamMembers(teamMembers.filter((m) => m.id !== id))
  }

  const refreshFromCredentials = () => {
    syncTeamMembers(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshFromCredentials}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
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

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["sub-admin", "secretary", "agent"].map((role) => (
          <div key={role} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              {roleIcons[role as keyof typeof roleIcons]}
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{role.replace("-", " ")}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {roleDescriptions[role as keyof typeof roleDescriptions]}
            </p>
            <p className="text-2xl font-bold text-blue-600">{teamMembers.filter((m) => m.role === role).length}</p>
          </div>
        ))}
      </div>

      {/* Team Members Table */}
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Credentials
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr key={`${member.id}-${member.email.toLowerCase()}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.email}</td>
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
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.joinedDate}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        member.credentialsSent
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {member.credentialsSent ? "✓ Sent" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {!member.credentialsSent && (
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowCredentialsModal(true)
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                          title="Send credentials"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
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

      {/* Add Member Modal */}
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
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
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

      {/* Credentials Modal */}
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
                      {selectedMember.password}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedMember.password || "")}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                      title="Copy password"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Login URL</p>
                  <a
                    href="/team-login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {window.location.origin}/team-login
                  </a>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                Share these credentials with the team member. They should log in at the provided URL and change their
                password on first login.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => handleSendCredentials(selectedMember)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Mark as Sent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
