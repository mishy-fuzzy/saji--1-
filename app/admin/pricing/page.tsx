"use client"

import { useState } from "react"
import { Search, Download, Edit, Plus, Trash2, Eye, DollarSign, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const pricingData: any[] = []

export default function PricingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [pricing, setPricing] = useState(pricingData)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editPrice, setEditPrice] = useState("")
  const [editCommission, setEditCommission] = useState("")
  const [newServiceName, setNewServiceName] = useState("")
  const [newServiceCategory, setNewServiceCategory] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [newServiceCommission, setNewServiceCommission] = useState("")

  const handleExportPricing = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalServices: pricing.length,
      pricing: pricing.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        commission: p.commission,
        tier: p.tier,
        status: p.status,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pricing-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteService = (serviceId: string) => {
    setPricing(pricing.filter(p => p.id !== serviceId))
  }

  const handleSaveChanges = () => {
    if (selectedService && editPrice && editCommission) {
      setPricing(pricing.map(p =>
        p.id === selectedService.id
          ? { ...p, basePrice: parseInt(editPrice), commission: parseFloat(editCommission) }
          : p
      ))
      setShowModal(false)
    }
  }

  const handleAddService = () => {
    if (newServiceName && newServiceCategory && newServicePrice && newServiceCommission) {
      const newService = {
        id: `SV-${Math.floor(Math.random() * 10000)}`,
        name: newServiceName,
        category: newServiceCategory,
        basePrice: parseInt(newServicePrice),
        commission: parseFloat(newServiceCommission),
        tier: "Standard",
        status: "Active"
      }
      setPricing([...pricing, newService])
      setNewServiceName("")
      setNewServiceCategory("")
      setNewServicePrice("")
      setNewServiceCommission("")
      setShowCreateModal(false)
    }
  }

  const filters = [
    { label: "All", type: "All", count: pricing.length },
    { label: "Active", type: "Active", count: pricing.filter(p => p.status === "Active").length },
    { label: "Inactive", type: "Inactive", count: pricing.filter(p => p.status === "Inactive").length },
  ]

  const filteredPricing = pricing.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === "All" || p.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const stats = [
    { label: "Total Services", value: pricing.length, icon: DollarSign, color: "from-blue-50 to-blue-100" },
    { label: "Active Services", value: pricing.filter(p => p.status === "Active").length, icon: TrendingUp, color: "from-emerald-50 to-emerald-100" },
    { label: "Avg Commission", value: `${(pricing.reduce((sum, p) => sum + p.commission, 0) / pricing.length).toFixed(1)}%`, icon: DollarSign, color: "from-yellow-50 to-yellow-100" },
    { label: "Total Value", value: `KES ${(pricing.reduce((sum, p) => sum + p.basePrice, 0) / 1000).toFixed(0)}K`, icon: TrendingUp, color: "from-purple-50 to-purple-100" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Pricing & Services</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage service pricing and commission rates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={18} />
          <span className="hidden sm:inline">Add Service</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className={`p-4 border-0 shadow-lg bg-gradient-to-br ${stat.color} dark:from-gray-800 dark:to-gray-800`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button 
          onClick={handleExportPricing}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.type}
            onClick={() => setActiveFilter(filter.type)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
              activeFilter === filter.type
                ? "bg-blue-600 text-white shadow-lg"
                : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Pricing Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Base Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Commission</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Tier</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPricing.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{service.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{service.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {service.basePrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{service.commission}%</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{service.tier}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      service.status === "Active" 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button 
                      onClick={() => { setSelectedService(service); setEditPrice(service.basePrice.toString()); setEditCommission(service.commission.toString()); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600"
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

      {/* Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Pricing</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Service Name</label>
                  <p className="font-semibold mt-1">{selectedService.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Base Price (KES)</label>
                  <input 
                    type="number" 
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Commission (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveChanges}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input 
              placeholder="Service Name" 
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              placeholder="Category" 
              value={newServiceCategory}
              onChange={(e) => setNewServiceCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              placeholder="Base Price (KES)" 
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              step="0.1" 
              placeholder="Commission (%)" 
              value={newServiceCommission}
              onChange={(e) => setNewServiceCommission(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleAddService}>Add Service</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
