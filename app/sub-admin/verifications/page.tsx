"use client"

import { useState } from "react"
import { Search, Eye, CheckCircle, X as XIcon, Clock, UserCheck, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Verification = {
  id: string
  name: string
  role: string
  documents: string
  status: "Pending" | "Approved" | "Rejected"
  date: string
}

const data: Verification[] = []

export default function SubAdminVerificationsPage() {
  const [verifications, setVerifications] = useState(data)
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Verification | null>(null)
  const [showModal, setShowModal] = useState(false)

  const filtered = verifications.filter(v => {
    const ms = v.name.toLowerCase().includes(search.toLowerCase())
    const mf = filter === "All" || v.status === filter
    return ms && mf
  })

  const getColor = (s: string) => s === "Approved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" : s === "Pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700" : "bg-red-100 dark:bg-red-900/30 text-red-700"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Verifications</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and process user verification requests</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-amber-600">{verifications.filter(v=>v.status==="Pending").length}</p></Card>
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Approved</p><p className="text-xl font-bold text-emerald-600">{verifications.filter(v=>v.status==="Approved").length}</p></Card>
        <Card className="p-3 border-0 shadow-sm"><p className="text-xs text-gray-500">Rejected</p><p className="text-xl font-bold text-red-600">{verifications.filter(v=>v.status==="Rejected").length}</p></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["All","Pending","Approved","Rejected"].map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${filter===f?"bg-blue-600 text-white":"bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{f}</button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Documents</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{v.name}</p>
                    <p className="text-[10px] text-gray-500">{v.role} -- {v.date}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden sm:table-cell">{v.documents}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getColor(v.status)}`}>{v.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={()=>{setSelected(v);setShowModal(true)}} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600"><Eye size={15}/></button>
                      {v.status==="Pending" && <>
                        <button onClick={()=>setVerifications(verifications.map(x=>x.id===v.id?{...x,status:"Approved"}:x))} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-emerald-600"><CheckCircle size={15}/></button>
                        <button onClick={()=>setVerifications(verifications.map(x=>x.id===v.id?{...x,status:"Rejected"}:x))} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600"><XIcon size={15}/></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No verification requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent><DialogHeader><DialogTitle>Verification Details</DialogTitle></DialogHeader>
          {selected && <div className="space-y-3 py-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              {[["ID",selected.id],["Name",selected.name],["Role",selected.role],["Documents",selected.documents],["Status",selected.status],["Submitted",selected.date]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="font-medium text-gray-900 dark:text-white">{v}</span></div>
              ))}
            </div>
            {selected.status==="Pending" && <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={()=>{setVerifications(verifications.map(x=>x.id===selected.id?{...x,status:"Rejected"}:x));setShowModal(false)}}>Reject</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={()=>{setVerifications(verifications.map(x=>x.id===selected.id?{...x,status:"Approved"}:x));setShowModal(false)}}>Approve</Button>
            </div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
