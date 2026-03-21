"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Edit, Trash2, Eye, Plus, X } from "lucide-react"

export default function AgentManagementPage() {
  const [agents, setAgents] = useState([
    { id: "AGT-001", name: "Daniel K.", email: "daniel@example.com", phone: "+254712345678", status: "Active", joined: "Jan 2025", performance: "Excellent", commission: "12%" },
    { id: "AGT-002", name: "Grace M.", email: "grace@example.com", phone: "+254712345679", status: "Active", joined: "Dec 2024", performance: "Good", commission: "10%" },
    { id: "AGT-003", name: "Robert J.", email: "robert@example.com", phone: "+254712345680", status: "Inactive", joined: "Nov 2024", performance: "Fair", commission: "8%" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", commission: "", status: "Active" })

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddAgent = () => {
    setFormData({ name: "", email: "", phone: "", commission: "", status: "Active" })
    setModalMode("add")
    setSelectedAgent(null)
    setShowModal(true)
  }

  const handleViewAgent = (agent: any) => {
    setSelectedAgent(agent)
    setFormData(agent)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEditAgent = (agent: any) => {
    setSelectedAgent(agent)
    setFormData(agent)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleSaveAgent = () => {
    if (modalMode === "add") {
      const newAgent = {
        id: `AGT-${String(agents.length + 1).padStart(3, "0")}`,
        ...formData,
        joined: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        performance: "New"
      }
      setAgents([...agents, newAgent])
      console.log("[v0] New agent added:", newAgent)
    } else if (modalMode === "edit") {
      setAgents(agents.map(a => a.id === selectedAgent.id ? { ...a, ...formData } : a))
      console.log("[v0] Agent updated:", formData)
    }
    setShowModal(false)
  }

  const handleDeleteAgent = (agentId: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      setAgents(agents.filter(a => a.id !== agentId))
      console.log("[v0] Agent deleted:", agentId)
    }
  }

  const handleExportAgents = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalAgents: agents.length,
      agents: agents
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agents-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Agents exported successfully")
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Agent Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage all agents under your supervision</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportAgents} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={handleAddAgent} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline" className="bg-transparent gap-2">
          <Filter size={18} />
          Filter
        </Button>
      </div>

      {/* Agents Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Agent ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Performance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAgents.map(agent => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{agent.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.status === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.performance}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleViewAgent(agent)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "add" ? "Add New Agent" : modalMode === "edit" ? "Edit Agent" : "View Agent"}
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
                  <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Commission Rate (%)</label>
                  <input
                    type="text"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
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
                    <option>Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                {modalMode !== "view" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveAgent}>
                    Save Agent
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
