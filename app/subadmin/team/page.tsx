"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Eye, X } from "lucide-react"

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: "Sarah Johnson", role: "Team Lead", email: "sarah@example.com", agents: 25, status: "Active" },
    { id: 2, name: "Michael Chen", role: "Operations Manager", email: "michael@example.com", agents: 18, status: "Active" },
    { id: 3, name: "Emma Wilson", role: "Quality Analyst", email: "emma@example.com", agents: 12, status: "Active" },
  ])

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", email: "", role: "Team Lead", agents: 0, status: "Active" })

  const teamStats = [
    { label: "Total Team Members", value: teamMembers.length, icon: "👥" },
    { label: "Active Members", value: teamMembers.filter(m => m.status === "Active").length, icon: "✓" },
    { label: "Total Agents Supervised", value: teamMembers.reduce((sum, m) => sum + m.agents, 0), icon: "📊" },
  ]

  const handleAddMember = () => {
    setFormData({ name: "", email: "", role: "Team Lead", agents: 0, status: "Active" })
    setModalMode("add")
    setSelectedMember(null)
    setShowModal(true)
  }

  const handleViewMember = (member: any) => {
    setSelectedMember(member)
    setFormData(member)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEditMember = (member: any) => {
    setSelectedMember(member)
    setFormData(member)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleSaveMember = () => {
    if (modalMode === "add") {
      const newMember = { id: Math.max(...teamMembers.map(m => m.id), 0) + 1, ...formData }
      setTeamMembers([...teamMembers, newMember])
      console.log("[v0] New team member added:", newMember)
    } else if (modalMode === "edit") {
      setTeamMembers(teamMembers.map(m => m.id === selectedMember.id ? { ...m, ...formData } : m))
      console.log("[v0] Team member updated:", formData)
    }
    setShowModal(false)
  }

  const handleDeleteMember = (memberId: number) => {
    if (confirm("Are you sure you want to delete this team member?")) {
      setTeamMembers(teamMembers.filter(m => m.id !== memberId))
      console.log("[v0] Team member deleted:", memberId)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage team members and their responsibilities</p>
        </div>
        <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={18} />
          Add Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teamStats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Team Members Table */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Team Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Agents</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{member.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{member.agents}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">
                      <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent gap-1">
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent gap-1 text-red-600" onClick={() => handleDeleteMember(member.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "add" ? "Add Team Member" : modalMode === "edit" ? "Edit Member" : "View Member"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>Team Lead</option>
                    <option>Operations Manager</option>
                    <option>Quality Analyst</option>
                    <option>Junior Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Agents Supervised</label>
                  <input
                    type="number"
                    value={formData.agents}
                    onChange={(e) => setFormData({ ...formData, agents: parseInt(e.target.value) || 0 })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                {modalMode !== "view" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveMember}>
                    Save Member
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
