"use client"

import { useState } from "react"
import { Plus, Search, Edit2, Trash2, Clock, DollarSign, Star, Eye, EyeOff, GripVertical, Tag, Layers, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Service = {
  id: number; name: string; description: string; category: string
  basePrice: number; priceType: "fixed" | "hourly" | "quote"
  duration: string; isActive: boolean; bookings: number; rating: number
}

const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "Painting", "HVAC", "General Maintenance", "Cleaning", "Landscaping"]

export default function ServicesCatalogPage() {
  const [services, setServices] = useState<Service[]>([
    { id: 1, name: "Emergency Pipe Repair", description: "Fast response pipe leak and burst repair service. Includes assessment, parts, and labor.", category: "Plumbing", basePrice: 5000, priceType: "fixed", duration: "1-2 hours", isActive: true, bookings: 48, rating: 4.8 },
    { id: 2, name: "Full Bathroom Installation", description: "Complete bathroom fitting including plumbing, tiling, and fixtures installation.", category: "Plumbing", basePrice: 3500, priceType: "hourly", duration: "2-5 days", isActive: true, bookings: 23, rating: 4.9 },
    { id: 3, name: "Electrical Wiring & Rewiring", description: "Professional electrical wiring for new builds and rewiring for older buildings.", category: "Electrical", basePrice: 0, priceType: "quote", duration: "Varies", isActive: true, bookings: 31, rating: 4.7 },
    { id: 4, name: "Water Heater Installation", description: "Installation of instant and storage water heaters with warranty.", category: "Plumbing", basePrice: 8000, priceType: "fixed", duration: "3-4 hours", isActive: false, bookings: 12, rating: 4.6 },
    { id: 5, name: "Kitchen Sink Replacement", description: "Remove old sink and install new sink with proper plumbing connections.", category: "Plumbing", basePrice: 4500, priceType: "fixed", duration: "2-3 hours", isActive: true, bookings: 35, rating: 4.8 },
  ])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [form, setForm] = useState({ name: "", description: "", category: "Plumbing", basePrice: "", priceType: "fixed" as "fixed" | "hourly" | "quote", duration: "" })

  const filtered = services
    .filter(s => filterCategory === "All" || s.category === filterCategory)
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const activeCount = services.filter(s => s.isActive).length
  const totalBookings = services.reduce((a, s) => a + s.bookings, 0)
  const avgRating = (services.reduce((a, s) => a + s.rating, 0) / services.length).toFixed(1)

  const openAddDialog = () => {
    setForm({ name: "", description: "", category: "Plumbing", basePrice: "", priceType: "fixed", duration: "" })
    setEditingService(null)
    setShowAddDialog(true)
  }

  const openEditDialog = (service: Service) => {
    setForm({ name: service.name, description: service.description, category: service.category, basePrice: String(service.basePrice), priceType: service.priceType, duration: service.duration })
    setEditingService(service)
    setShowAddDialog(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, name: form.name, description: form.description, category: form.category, basePrice: Number(form.basePrice), priceType: form.priceType, duration: form.duration } : s))
    } else {
      setServices(prev => [...prev, { id: Date.now(), name: form.name, description: form.description, category: form.category, basePrice: Number(form.basePrice), priceType: form.priceType, duration: form.duration, isActive: true, bookings: 0, rating: 0 }])
    }
    setShowAddDialog(false)
  }

  const toggleActive = (id: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s))
  }

  const deleteService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services & Pricing</h1>
          <p className="text-sm text-muted-foreground mt-1">Define what you offer and set your rates</p>
        </div>
        <Button onClick={openAddDialog} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add Service</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-[11px] text-muted-foreground">Active Services</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
          <p className="text-[11px] text-muted-foreground">Total Bookings</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">{avgRating}</p>
          <p className="text-[11px] text-muted-foreground">Avg Rating</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search services..." className="pl-9 rounded-xl bg-card border-border" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["All", ...CATEGORIES.slice(0, 4)].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {filtered.map(service => (
          <Card key={service.id} className={`p-4 border rounded-xl transition-all ${service.isActive ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                  {!service.isActive && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Hidden</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{service.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Tag className="w-3 h-3" />{service.category}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{service.duration}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Layers className="w-3 h-3" />{service.bookings} bookings</span>
                  {service.rating > 0 && <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-current" />{service.rating}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="mb-2">
                  {service.priceType === "quote" ? (
                    <span className="text-sm font-semibold text-foreground">Get Quote</span>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-foreground">KES {service.basePrice.toLocaleString()}</span>
                      {service.priceType === "hourly" && <span className="text-[10px] text-muted-foreground block">/hour</span>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(service.id)} className={`p-1.5 rounded-lg transition-colors ${service.isActive ? "hover:bg-muted" : "hover:bg-primary/10"}`}>
                    {service.isActive ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEditDialog(service)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteService(service.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-xl" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">{editingService ? "Edit Service" : "Add New Service"}</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Service Name</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Emergency Pipe Repair" className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this service includes..." className="rounded-lg bg-card border-border min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Price Type</label>
                <select value={form.priceType} onChange={(e) => setForm(p => ({ ...p, priceType: e.target.value as "fixed" | "hourly" | "quote" }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Per Hour</option>
                  <option value="quote">Request Quote</option>
                </select>
              </div>
            </div>
            {form.priceType !== "quote" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Base Price (KES)</label>
                <Input type="number" value={form.basePrice} onChange={(e) => setForm(p => ({ ...p, basePrice: e.target.value }))} placeholder="0" className="rounded-lg bg-card border-border" />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Estimated Duration</label>
              <Input value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2-3 hours" className="rounded-lg bg-card border-border" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 rounded-xl">{editingService ? "Update" : "Add Service"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
