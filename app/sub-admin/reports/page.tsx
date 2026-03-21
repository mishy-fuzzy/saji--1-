"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Eye, Clock, CheckCircle } from "lucide-react"

const reports = [
  { id: "RPT-001", title: "Monthly User Activity Report", type: "Users", period: "January 2026", generated: "Feb 01, 2026", status: "Ready", size: "2.4 MB" },
  { id: "RPT-002", title: "Verification Summary Report", type: "Verifications", period: "January 2026", generated: "Feb 01, 2026", status: "Ready", size: "1.1 MB" },
  { id: "RPT-003", title: "Platform Revenue Overview", type: "Financial", period: "Q4 2025", generated: "Jan 15, 2026", status: "Ready", size: "3.8 MB" },
  { id: "RPT-004", title: "Dispute Resolution Report", type: "Disputes", period: "January 2026", generated: "Feb 02, 2026", status: "Processing", size: "--" },
  { id: "RPT-005", title: "Weekly Performance Summary", type: "Performance", period: "Week 5, 2026", generated: "Feb 03, 2026", status: "Ready", size: "890 KB" },
]

export default function SubAdminReportsPage() {
  const [filter, setFilter] = useState("All")
  const types = ["All", "Users", "Verifications", "Financial", "Disputes", "Performance"]
  const filtered = filter === "All" ? reports : reports.filter(r => r.type === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generated reports and export tools</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm"><FileText size={16} /> Generate New Report</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {types.map(t => (
          <button key={t} onClick={()=>setFilter(t)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${filter===t?"bg-blue-600 text-white":"bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{r.type}</span>
                    <span className="text-[10px] text-gray-500">{r.period}</span>
                    <span className="text-[10px] text-gray-400">{r.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${r.status==="Ready" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700"}`}>
                  {r.status==="Ready" ? <CheckCircle size={10}/> : <Clock size={10}/>} {r.status}
                </span>
                {r.status === "Ready" && (
                  <Button size="sm" variant="outline" className="bg-transparent gap-1 text-xs h-7"><Download size={13}/> Download</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
