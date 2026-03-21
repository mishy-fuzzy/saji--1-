"use client"

import { useState } from "react"
import { Search, Eye, AlertCircle, CheckCircle2, Clock, Users, Filter, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const initialUsers = [
  { id: "USR-001", name: "Sarah K.", email: "sarah@email.com", phone: "+254 712 345 678", role: "Customer", status: "Active", joined: "Jan 15, 2026", orders: 12 },
  { id: "USR-002", name: "Mark L.", email: "mark@email.com", phone: "+254 722 456 789", role: "Provider", status: "Pending", joined: "Jan 18, 2026", orders: 8 },
  { id: "USR-003", name: "David N.", email: "david@email.com", phone: "+254 742 678 901", role: "Shopkeeper", status: "Active", joined: "Dec 28, 2025", orders: 5 },
  { id: "USR-004", name: "Alice T.", email: "alice@email.com", phone: "+254 762 890 123", role: "Customer", status: "Suspended", joined: "Jan 22, 2026", orders: 7 },
  { id: "USR-005", name: "John M.", email: "john@email.com", phone: "+254 752 789 012", role: "Provider", status: "Active", joined: "Jan 20, 2026", orders: 18 },
  { id: "USR-006", name: "Grace N.", email: "grace@email.com", phone: "+254 772 901 234", role: "Shopkeeper", status: "Active", joined: "Feb 1, 2026", orders: 22 },
]

export default function SubAdminUsersPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [users, setUsers] = useState(initialUsers)
  const [selected, setSelected] = useState<(typeof initialUsers)[0] | null>(null)
  const [showModal, setShowModal] = useState(false)

  const filters = ["All", "Active", "Pending", "Suspended"]
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "All" || u.status === filter
    return matchSearch && matchFilter
  })

  const getStatusColor = (s: string) => {
    if (s === "Active") return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
    if (s === "Pending") return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
  }

  const handleSuspend = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "Suspended" ? "Active" : "Suspended" } : u))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage platform users (limited permissions)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-gray-900 dark:text-white">{users.length}</p></Card>
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Active</p><p className="text-xl font-bold text-emerald-600">{users.filter(u=>u.status==="Active").length}</p></Card>
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-amber-600">{users.filter(u=>u.status==="Pending").length}</p></Card>
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Suspended</p><p className="text-xl font-bold text-red-600">{users.filter(u=>u.status==="Suspended").length}</p></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${filter === f ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{f}</button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">{u.name[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 hidden sm:table-cell">{u.role}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(u.status)}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{u.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={()=>{setSelected(u);setShowModal(true)}} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600"><Eye size={15} /></button>
                      <button onClick={()=>handleSuspend(u.id)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-amber-600"><AlertCircle size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                {[["Name", selected.name], ["Email", selected.email], ["Phone", selected.phone], ["Role", selected.role], ["Status", selected.status], ["Joined", selected.joined], ["Orders", String(selected.orders)]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="font-medium text-gray-900 dark:text-white">{v}</span></div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={()=>setShowModal(false)}>Close</Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={()=>{handleSuspend(selected.id);setShowModal(false)}}>{selected.status==="Suspended"?"Reactivate":"Suspend"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
