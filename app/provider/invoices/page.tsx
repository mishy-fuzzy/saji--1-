"use client"

import { useState } from "react"
import { FileText, Download, Send, Plus, Search, Filter, Eye, Check, Clock, AlertCircle, X, Printer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Invoice = {
  id: string; client: string; clientPhone: string; service: string; date: string
  dueDate: string; amount: number; tax: number; total: number
  status: "paid" | "pending" | "overdue" | "draft"; items: { desc: string; qty: number; rate: number }[]
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "INV-001", client: "Sarah Wanjiku", clientPhone: "+254 712 345 678", service: "Kitchen Plumbing Repair", date: "2026-02-18", dueDate: "2026-03-04", amount: 8500, tax: 1360, total: 9860, status: "paid", items: [{ desc: "Pipe replacement", qty: 1, rate: 5000 }, { desc: "Labor (2 hrs)", qty: 2, rate: 1750 }] },
    { id: "INV-002", client: "John Kamau", clientPhone: "+254 723 456 789", service: "Bathroom Installation", date: "2026-02-15", dueDate: "2026-03-01", amount: 25000, tax: 4000, total: 29000, status: "pending", items: [{ desc: "Fixtures & materials", qty: 1, rate: 15000 }, { desc: "Labor (3 days)", qty: 3, rate: 3333 }] },
    { id: "INV-003", client: "Grace Muthoni", clientPhone: "+254 734 567 890", service: "Electrical Wiring", date: "2026-01-28", dueDate: "2026-02-11", amount: 12000, tax: 1920, total: 13920, status: "overdue", items: [{ desc: "Wiring materials", qty: 1, rate: 7000 }, { desc: "Labor (1 day)", qty: 1, rate: 5000 }] },
    { id: "INV-004", client: "Peter Odhiambo", clientPhone: "+254 745 678 901", service: "Water Heater Setup", date: "2026-02-20", dueDate: "2026-03-06", amount: 8000, tax: 1280, total: 9280, status: "draft", items: [{ desc: "Heater unit", qty: 1, rate: 5500 }, { desc: "Installation", qty: 1, rate: 2500 }] },
  ])
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const [newInvoice, setNewInvoice] = useState({ client: "", clientPhone: "", service: "", items: [{ desc: "", qty: 1, rate: 0 }] })

  const filtered = invoices
    .filter(inv => filterStatus === "All" || inv.status === filterStatus.toLowerCase())
    .filter(inv => inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase()))

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    draft: "bg-muted text-muted-foreground",
  }

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.total, 0)
  const totalPending = invoices.filter(i => i.status === "pending").reduce((a, i) => a + i.total, 0)
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((a, i) => a + i.total, 0)

  const addItem = () => setNewInvoice(p => ({ ...p, items: [...p.items, { desc: "", qty: 1, rate: 0 }] }))
  const removeItem = (idx: number) => setNewInvoice(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx: number, field: string, val: string | number) => {
    setNewInvoice(p => ({ ...p, items: p.items.map((item, i) => i === idx ? { ...item, [field]: val } : item) }))
  }

  const createInvoice = () => {
    const amount = newInvoice.items.reduce((a, item) => a + item.qty * item.rate, 0)
    const tax = Math.round(amount * 0.16)
    const inv: Invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`, client: newInvoice.client, clientPhone: newInvoice.clientPhone,
      service: newInvoice.service, date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      amount, tax, total: amount + tax, status: "draft", items: newInvoice.items,
    }
    setInvoices(prev => [inv, ...prev])
    setShowCreate(false)
    setNewInvoice({ client: "", clientPhone: "", service: "", items: [{ desc: "", qty: 1, rate: 0 }] })
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices & Receipts</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate, send, and track invoices for your services</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Collected</p>
          <p className="text-lg font-bold text-emerald-600">KES {totalRevenue.toLocaleString()}</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-amber-600">KES {totalPending.toLocaleString()}</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Overdue</p>
          <p className="text-lg font-bold text-destructive">KES {totalOverdue.toLocaleString()}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search invoices..." className="pl-9 rounded-xl bg-card border-border" />
        </div>
        <div className="flex gap-1.5">
          {["All", "Paid", "Pending", "Overdue", "Draft"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {filtered.map(inv => (
          <Card key={inv.id} className="p-4 border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{inv.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[inv.status]}`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.client} - {inv.service}</p>
                  <p className="text-[10px] text-muted-foreground">Due: {inv.dueDate}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">KES {inv.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => setViewInvoice(inv)} className="p-1 rounded hover:bg-muted transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-muted transition-colors"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-muted transition-colors"><Send className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-md rounded-xl p-0" showCloseButton={false}>
          {viewInvoice && (
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{viewInvoice.id}</h2>
                  <p className="text-xs text-muted-foreground">Issued: {viewInvoice.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[viewInvoice.status]}`}>{viewInvoice.status.charAt(0).toUpperCase() + viewInvoice.status.slice(1)}</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Bill To</p>
                <p className="text-sm font-semibold text-foreground">{viewInvoice.client}</p>
                <p className="text-xs text-muted-foreground">{viewInvoice.clientPhone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">ITEMS</p>
                {viewInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{item.desc}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">KES {(item.qty * item.rate).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">KES {viewInvoice.amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (16%)</span><span className="text-foreground">KES {viewInvoice.tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border"><span className="text-foreground">Total</span><span className="text-foreground">KES {viewInvoice.total.toLocaleString()}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewInvoice(null)} className="flex-1 rounded-xl">Close</Button>
                <Button className="flex-1 rounded-xl"><Printer className="w-4 h-4 mr-1" />Print</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Create Invoice</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Client Name</label>
              <Input value={newInvoice.client} onChange={(e) => setNewInvoice(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Client Phone</label>
              <Input value={newInvoice.clientPhone} onChange={(e) => setNewInvoice(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+254..." className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Service</label>
              <Input value={newInvoice.service} onChange={(e) => setNewInvoice(p => ({ ...p, service: e.target.value }))} placeholder="Service description" className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">Line Items</label>
                <button onClick={addItem} className="text-xs text-primary font-medium hover:underline">+ Add Item</button>
              </div>
              {newInvoice.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={item.desc} onChange={(e) => updateItem(idx, "desc", e.target.value)} placeholder="Description" className="flex-1 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} className="w-14 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.rate || ""} onChange={(e) => updateItem(idx, "rate", Number(e.target.value))} placeholder="Rate" className="w-20 rounded-lg bg-card border-border text-sm" />
                  {newInvoice.items.length > 1 && <button onClick={() => removeItem(idx)} className="p-1 text-destructive"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              <div className="text-right text-sm font-semibold text-foreground mt-2">
                Total: KES {newInvoice.items.reduce((a, i) => a + i.qty * i.rate, 0).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={createInvoice} disabled={!newInvoice.client.trim()} className="flex-1 rounded-xl">Create Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
