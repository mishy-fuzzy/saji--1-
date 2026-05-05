"use client"

import { useEffect, useState } from "react"
import {
  Tag, Plus, Search, Calendar, Percent, DollarSign, Eye, Trash2, Edit,
  Copy, CheckCircle2, Clock, XCircle, TrendingUp, ShoppingCart, Users, Zap
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthContext } from "@/lib/auth-context"

interface Promotion {
  id: string
  name: string
  code: string
  type: "percentage" | "fixed" | "bogo"
  value: number
  minOrder: number
  maxUses: number
  usedCount: number
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "expired" | "paused"
  products: string
  description: string
}

export default function ShopkeeperPromotionsPage() {
  const { user } = useAuthContext()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [productOptions, setProductOptions] = useState<string[]>([])

  const [newPromo, setNewPromo] = useState({
    name: "",
    code: "",
    type: "percentage" as "percentage" | "fixed" | "bogo",
    value: "",
    minOrder: "",
    maxUses: "",
    startDate: "",
    endDate: "",
    products: "",
    description: "",
  })

  const [editPromo, setEditPromo] = useState({
    name: "",
    code: "",
    type: "percentage" as "percentage" | "fixed" | "bogo",
    value: "",
    minOrder: "",
    maxUses: "",
    startDate: "",
    endDate: "",
    products: "",
    description: "",
  })

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const [promotionsResponse, productsResponse] = await Promise.all([
          fetch("/api/shopkeeper/promotions", {
            cache: "no-store",
          }),
          user?.id
            ? fetch(`/api/shopkeeper/products?providerId=${encodeURIComponent(user.id)}`, {
                cache: "no-store",
              })
            : Promise.resolve(null),
        ])

        const promotionsPayload = await promotionsResponse.json()
        if (promotionsPayload?.ok && Array.isArray(promotionsPayload?.data)) {
          setPromotions(promotionsPayload.data)
        }

        if (productsResponse) {
          const productsPayload = await productsResponse.json()
          if (productsPayload?.ok && Array.isArray(productsPayload?.data)) {
            const names = Array.from(
              new Set(
                productsPayload.data
                  .map((item: any) => String(item?.name || "").trim())
                  .filter(Boolean),
              ),
            )
            setProductOptions(names)
          }
        }
      } catch (err) {
        console.error("Failed to load promotions:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPromotions()
  }, [user?.id])

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "scheduled", label: "Scheduled" },
    { key: "expired", label: "Expired" },
    { key: "paused", label: "Paused" },
  ]

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.code.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeFilter === "all") return matchesSearch
    return matchesSearch && promo.status === activeFilter
  })

  const appliesToOptions = Array.from(
    new Set([
      ...productOptions,
      ...promotions
        .map((promo) => String(promo.products || "").trim())
        .filter(Boolean),
    ]),
  )

  const stats = {
    active: promotions.filter(p => p.status === "active").length,
    totalUsed: promotions.reduce((acc, p) => acc + p.usedCount, 0),
    totalRevenue: "KES " + (promotions.reduce((acc, p) => acc + (p.usedCount * p.value), 0)).toLocaleString(),
    conversionRate:
      promotions.reduce((acc, p) => acc + (p.maxUses || 0), 0) > 0
        ? `${Math.round((promotions.reduce((acc, p) => acc + p.usedCount, 0) / promotions.reduce((acc, p) => acc + (p.maxUses || 0), 0)) * 100)}%`
        : "0%"
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      active: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
      scheduled: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <Clock className="w-3 h-3" /> },
      expired: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", icon: <XCircle className="w-3 h-3" /> },
      paused: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
    }
    return configs[status] || configs.active
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreatePromo = async () => {
    if (!newPromo.name || !newPromo.code || !newPromo.value) {
      alert("Please fill in all required fields")
      return
    }

    if (!newPromo.startDate || !newPromo.endDate) {
      alert("Please provide both start and end dates")
      return
    }

    try {
      const response = await fetch("/api/shopkeeper/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPromo.name,
          code: newPromo.code.toUpperCase(),
          type: newPromo.type,
          value: parseFloat(newPromo.value),
          minOrder: parseFloat(newPromo.minOrder) || 0,
          maxUses: parseInt(newPromo.maxUses) || 999,
          startDate: newPromo.startDate,
          endDate: newPromo.endDate,
          products: newPromo.products,
          description: newPromo.description,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to create promotion")
      }

      if (payload?.data) {
        setPromotions([payload.data, ...promotions])
      }

      setShowCreateModal(false)
      setNewPromo({ name: "", code: "", type: "percentage", value: "", minOrder: "", maxUses: "", startDate: "", endDate: "", products: "", description: "" })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create promotion")
    }
  }

  const handleDeletePromo = async (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      try {
        const response = await fetch(`/api/shopkeeper/promotions/${id}`, {
          method: "DELETE",
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to delete promotion")
        }
        setPromotions(promotions.filter(p => p.id !== id))
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete promotion")
      }
    }
  }

  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === "active" ? "paused" : "active"
    try {
      const response = await fetch(`/api/shopkeeper/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to update promotion")
      }
      setPromotions((current) =>
        current.map((item) => (item.id === promo.id ? payload.data : item)),
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update promotion")
    }
  }

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo)
    setEditPromo({
      name: promo.name,
      code: promo.code,
      type: promo.type,
      value: String(promo.value),
      minOrder: String(promo.minOrder),
      maxUses: String(promo.maxUses),
      startDate: promo.startDate,
      endDate: promo.endDate,
      products: promo.products,
      description: promo.description,
    })
    setShowEditModal(true)
  }

  const handleUpdatePromo = async () => {
    if (!editingPromo?.id) {
      alert("Promotion not selected")
      return
    }

    if (!editPromo.name || !editPromo.code || !editPromo.value || !editPromo.startDate || !editPromo.endDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(`/api/shopkeeper/promotions/${editingPromo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPromo.name,
          code: editPromo.code.toUpperCase(),
          type: editPromo.type,
          value: parseFloat(editPromo.value),
          minOrder: parseFloat(editPromo.minOrder) || 0,
          maxUses: parseInt(editPromo.maxUses) || 999,
          startDate: editPromo.startDate,
          endDate: editPromo.endDate,
          products: editPromo.products,
          description: editPromo.description,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to update promotion")
      }

      setPromotions((current) =>
        current.map((item) => (item.id === editingPromo.id ? payload.data : item)),
      )
      setShowEditModal(false)
      setEditingPromo(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update promotion")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Promotions & Coupons</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage discount campaigns</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-amber-600 hover:bg-amber-700 gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Create Promotion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Promos", value: stats.active, icon: Tag, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" },
            { label: "Total Uses", value: stats.totalUsed, icon: Users, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
            { label: "Revenue Impact", value: stats.totalRevenue, icon: TrendingUp, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
            { label: "Conversion Rate", value: stats.conversionRate, icon: Zap, color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="p-4 border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="p-3 mb-4 border-0 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="flex gap-1.5">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter.key
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Promotions List */}
        <div className="space-y-3">
          {filteredPromotions.length > 0 ? (
            filteredPromotions.map((promo) => {
              const statusConfig = getStatusConfig(promo.status)
              const usagePercent = Math.round((promo.usedCount / promo.maxUses) * 100)

              return (
                <Card key={promo.id} className="p-4 lg:p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{promo.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{promo.description}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.icon}
                          {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                        </div>
                      </div>

                      {/* Code & Discount */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {copiedCode === promo.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                          {promo.code}
                        </button>
                        <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                          {promo.type === "percentage" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                          {promo.type === "percentage" ? `${promo.value}% OFF` : `KES ${promo.value.toLocaleString()} OFF`}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Min. order: KES {promo.minOrder.toLocaleString()}
                        </span>
                      </div>

                      {/* Dates & Category */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {promo.startDate} to {promo.endDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {promo.products}
                        </span>
                      </div>
                    </div>

                    {/* Right: Usage & Actions */}
                    <div className="flex flex-col items-end gap-3 lg:w-48 flex-shrink-0">
                      {/* Usage Bar */}
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Usage</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{promo.usedCount}/{promo.maxUses}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent"
                          onClick={() => openEditModal(promo)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {(promo.status === "active" || promo.status === "paused") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 bg-transparent"
                            onClick={() => handleToggleStatus(promo)}
                          >
                            {promo.status === "active" ? "Pause" : "Resume"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeletePromo(promo.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-12 border-0 shadow-sm text-center">
              <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No promotions found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create your first promotion to attract more customers</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Promotion Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Promotion Name *</label>
              <Input
                value={newPromo.name}
                onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                placeholder="e.g., Summer Sale 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Coupon Code *</label>
                <Input
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  className="font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Discount Type *</label>
                <select
                  value={newPromo.type}
                  onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as "percentage" | "fixed" | "bogo" })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Discount Value * {newPromo.type === "percentage" ? "(%)" : "(KES)"}
                </label>
                <Input
                  type="number"
                  value={newPromo.value}
                  onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })}
                  placeholder={newPromo.type === "percentage" ? "e.g., 25" : "e.g., 500"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Min. Order (KES)</label>
                <Input
                  type="number"
                  value={newPromo.minOrder}
                  onChange={(e) => setNewPromo({ ...newPromo, minOrder: e.target.value })}
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date</label>
                <Input
                  type="date"
                  value={newPromo.startDate}
                  onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date</label>
                <Input
                  type="date"
                  value={newPromo.endDate}
                  onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Uses</label>
                <Input
                  type="number"
                  value={newPromo.maxUses}
                  onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Applies To</label>
                <select
                  value={newPromo.products}
                  onChange={(e) => setNewPromo({ ...newPromo, products: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="">Entire catalog</option>
                  {appliesToOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <Textarea
                value={newPromo.description}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                placeholder="Brief description of this promotion..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleCreatePromo}>
                Create Promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Promotion Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Promotion Name *</label>
              <Input
                value={editPromo.name}
                onChange={(e) => setEditPromo({ ...editPromo, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Coupon Code *</label>
                <Input
                  value={editPromo.code}
                  onChange={(e) => setEditPromo({ ...editPromo, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Discount Type *</label>
                <select
                  value={editPromo.type}
                  onChange={(e) => setEditPromo({ ...editPromo, type: e.target.value as "percentage" | "fixed" | "bogo" })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Discount Value *</label>
                <Input
                  type="number"
                  value={editPromo.value}
                  onChange={(e) => setEditPromo({ ...editPromo, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Min. Order (KES)</label>
                <Input
                  type="number"
                  value={editPromo.minOrder}
                  onChange={(e) => setEditPromo({ ...editPromo, minOrder: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date</label>
                <Input
                  type="date"
                  value={editPromo.startDate}
                  onChange={(e) => setEditPromo({ ...editPromo, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date</label>
                <Input
                  type="date"
                  value={editPromo.endDate}
                  onChange={(e) => setEditPromo({ ...editPromo, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Uses</label>
                <Input
                  type="number"
                  value={editPromo.maxUses}
                  onChange={(e) => setEditPromo({ ...editPromo, maxUses: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Applies To</label>
                <select
                  value={editPromo.products}
                  onChange={(e) => setEditPromo({ ...editPromo, products: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="">Entire catalog</option>
                  {appliesToOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <Textarea
                value={editPromo.description}
                onChange={(e) => setEditPromo({ ...editPromo, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPromo(null)
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleUpdatePromo}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
