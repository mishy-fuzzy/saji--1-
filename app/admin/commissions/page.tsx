"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Percent, Save, History, TrendingUp, Users, DollarSign, Plus, Trash2, Pencil, Eye, X, AlertTriangle } from "lucide-react"

interface Tier {
  id: number
  name: string
  role: "Provider" | "Shopkeeper" | "Agent"
  rate: number
  minJobs: number
  description: string
  status: "active" | "paused"
}

const initialTiers: Tier[] = []

const changeHistory: Array<{ date: string; change: string; by: string; type: "add" | "edit" | "delete" }> = []

export default function AdminCommissionsPage() {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formRole, setFormRole] = useState<"Provider" | "Shopkeeper" | "Agent">("Provider")
  const [formRate, setFormRate] = useState("")
  const [formMinJobs, setFormMinJobs] = useState("")
  const [formDescription, setFormDescription] = useState("")

  const resetForm = () => {
    setFormName("")
    setFormRole("Provider")
    setFormRate("")
    setFormMinJobs("")
    setFormDescription("")
  }

  const openAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEdit = (tier: Tier) => {
    setSelectedTier(tier)
    setFormName(tier.name)
    setFormRole(tier.role)
    setFormRate(tier.rate.toString())
    setFormMinJobs(tier.minJobs.toString())
    setFormDescription(tier.description)
    setShowEditModal(true)
  }

  const openView = (tier: Tier) => {
    setSelectedTier(tier)
    setShowViewModal(true)
  }

  const openDelete = (tier: Tier) => {
    setSelectedTier(tier)
    setShowDeleteConfirm(true)
  }

  const handleAdd = () => {
    const rate = parseFloat(formRate)
    const minJobs = parseInt(formMinJobs || "0")
    if (!formName.trim() || isNaN(rate) || rate < 0 || rate > 50) return
    const newTier: Tier = {
      id: Date.now(),
      name: formName.trim(),
      role: formRole,
      rate,
      minJobs,
      description: formDescription.trim(),
      status: "active",
    }
    setTiers(prev => [...prev, newTier])
    setShowAddModal(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!selectedTier) return
    const rate = parseFloat(formRate)
    const minJobs = parseInt(formMinJobs || "0")
    if (!formName.trim() || isNaN(rate) || rate < 0 || rate > 50) return
    setTiers(prev =>
      prev.map(t =>
        t.id === selectedTier.id
          ? { ...t, name: formName.trim(), role: formRole, rate, minJobs, description: formDescription.trim() }
          : t
      )
    )
    setShowEditModal(false)
    setSelectedTier(null)
  }

  const handleDelete = () => {
    if (!selectedTier) return
    setTiers(prev => prev.filter(t => t.id !== selectedTier.id))
    setShowDeleteConfirm(false)
    setSelectedTier(null)
  }

  const toggleStatus = (id: number) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "active" ? "paused" : "active" } : t))
  }

  const avgRate = tiers.length > 0 ? (tiers.reduce((s, r) => s + r.rate, 0) / tiers.length).toFixed(1) : "0"

  const roleBadge = (role: string) => {
    switch (role) {
      case "Provider": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "Shopkeeper": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      default: return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    }
  }

  const TierForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 mt-2">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tier Name</label>
        <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Diamond Provider" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Role</label>
          <select value={formRole} onChange={e => setFormRole(e.target.value as typeof formRole)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="Provider">Provider</option>
            <option value="Shopkeeper">Shopkeeper</option>
            <option value="Agent">Agent</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Commission Rate (%)</label>
          <input value={formRate} onChange={e => setFormRate(e.target.value)} type="number" min="0" max="50" step="0.5" placeholder="e.g. 10" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Min Jobs Requirement</label>
        <input value={formMinJobs} onChange={e => setFormMinJobs(e.target.value)} type="number" min="0" placeholder="0 for default tier" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
        <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} placeholder="Describe when this tier applies..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false) }} className="rounded-lg">Cancel</Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 rounded-lg gap-1.5"><Save size={14} />{submitLabel}</Button>
      </DialogFooter>
    </div>
  )

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Commission Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure commission rates and tier structures</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm w-fit rounded-lg"><Plus size={16} />Add New Tier</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Commission Revenue (YTD)", value: "KES 24.8M", icon: DollarSign, color: "text-emerald-600" },
          { label: "Avg Commission Rate", value: `${avgRate}%`, icon: Percent, color: "text-blue-600" },
          { label: "Active Tiers", value: tiers.filter(t => t.status === "active").length.toString(), icon: Users, color: "text-amber-600" },
          { label: "Growth vs Last Month", value: "+14%", icon: TrendingUp, color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.color} />
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Commission Tiers */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Commission Tiers</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tiers.length} tiers configured</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {tiers.map(tier => (
            <div key={tier.id} className={`px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${tier.status === "paused" ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleBadge(tier.role)}`}>{tier.role}</span>
                  {tier.status === "paused" && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">Paused</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description}</p>
                {tier.minJobs > 0 && <p className="text-[11px] text-gray-400 mt-0.5">Requirement: {tier.minJobs}+ completed jobs</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-center min-w-[60px]">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{tier.rate}</span>
                  <span className="text-sm text-gray-500 ml-0.5">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(tier)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-blue-600" title="View details">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => openEdit(tier)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-amber-600" title="Edit tier">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => toggleStatus(tier.id)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium ${tier.status === "active" ? "text-gray-400 hover:text-orange-500" : "text-emerald-500 hover:text-emerald-600"}`} title={tier.status === "active" ? "Pause tier" : "Activate tier"}>
                    {tier.status === "active" ? "Pause" : "Activate"}
                  </button>
                  <button onClick={() => openDelete(tier)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-400 hover:text-red-600" title="Delete tier">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tiers.length === 0 && (
            <div className="p-8 text-center">
              <Percent size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No commission tiers configured. Click "Add New Tier" to get started.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Rate Change History */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rate Change History</h2>
        </div>
        <div className="space-y-3">
          {changeHistory.map((c, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.type === "delete" ? "bg-red-500" : c.type === "add" ? "bg-emerald-500" : "bg-blue-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200">{c.change}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.date} -- {c.by}</p>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${c.type === "delete" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : c.type === "add" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
                {c.type}
              </span>
            </div>
          ))}
          {changeHistory.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No commission history available.</p>
          )}
        </div>
      </Card>

      {/* Add Tier Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Commission Tier</DialogTitle>
            <DialogDescription>Create a new commission tier for a specific role.</DialogDescription>
          </DialogHeader>
          <TierForm onSubmit={handleAdd} submitLabel="Create Tier" />
        </DialogContent>
      </Dialog>

      {/* Edit Tier Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Commission Tier</DialogTitle>
            <DialogDescription>Update the settings for "{selectedTier?.name}".</DialogDescription>
          </DialogHeader>
          <TierForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tier Details</DialogTitle>
            <DialogDescription>Full details for this commission tier.</DialogDescription>
          </DialogHeader>
          {selectedTier && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Percent size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTier.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge(selectedTier.role)}`}>{selectedTier.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTier.rate}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Min Jobs Required</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTier.minJobs}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`text-sm font-semibold ${selectedTier.status === "active" ? "text-emerald-600" : "text-gray-500"}`}>{selectedTier.status === "active" ? "Active" : "Paused"}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Users on Tier</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">N/A</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTier.description || "No description provided"}</p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowViewModal(false)} className="rounded-lg">Close</Button>
                <Button onClick={() => { setShowViewModal(false); openEdit(selectedTier) }} className="bg-blue-600 hover:bg-blue-700 rounded-lg gap-1.5"><Pencil size={14} />Edit Tier</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Commission Tier</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Are you sure you want to delete "{selectedTier?.name}"?</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Any users currently on this tier will be moved to the default tier for their role.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-lg">Cancel</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-lg gap-1.5"><Trash2 size={14} />Delete Tier</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
