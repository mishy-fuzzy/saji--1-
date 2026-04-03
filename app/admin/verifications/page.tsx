"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, Eye, CheckCircle, Clock, UserCheck, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Verification = {
  id: string
  name: string
  email: string
  role: string
  documents: string
  documentUrl: string | null
  notes: string | null
  status: "pending" | "approved" | "rejected"
  submittedDate: string
}

export default function VerificationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        const response = await fetch("/api/admin/verifications", { cache: "no-store" })
        const payload = await response.json()
        const rows = Array.isArray(payload?.verifications) ? payload.verifications : []

        const mapped = rows.map((row: any) => ({
          id: String(row.id || ""),
          name: String(row.user?.name || "Unknown"),
          email: String(row.user?.email || ""),
          role: String(row.user?.role || ""),
          documents: row.documentUrl ? "Yes" : "No",
          documentUrl: row.documentUrl || null,
          notes: row.notes || null,
          status: (row.status || "pending").toLowerCase() as "pending" | "approved" | "rejected",
          submittedDate: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "",
        }))

        setVerifications(mapped)
      } catch {
        setVerifications([])
      }
    }

    loadVerifications()
    const intervalId = window.setInterval(loadVerifications, 25000)
    return () => window.clearInterval(intervalId)
  }, [])

  const filters = [
    { label: "All", type: "all", count: verifications.length },
    { label: "Pending", type: "pending", count: verifications.filter(v => v.status === "pending").length },
    { label: "Approved", type: "approved", count: verifications.filter(v => v.status === "approved").length },
    { label: "Rejected", type: "rejected", count: verifications.filter(v => v.status === "rejected").length },
  ]

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.email.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.includes(searchTerm)
    const matchesFilter = activeFilter === "all" || v.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "approved": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "pending": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
      case "rejected": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "pending": return "Pending"
      case "approved": return "Approved"
      case "rejected": return "Rejected"
      default: return status
    }
  }

  const stats = [
    { label: "Total Submissions", value: verifications.length, icon: UserCheck, color: "from-blue-50 to-blue-100" },
    { label: "Approved", value: verifications.filter(v => v.status === "approved").length, icon: CheckCircle, color: "from-emerald-50 to-emerald-100" },
    { label: "Pending Review", value: verifications.filter(v => v.status === "pending").length, icon: Clock, color: "from-yellow-50 to-yellow-100" },
    { label: "Rejected", value: verifications.filter(v => v.status === "rejected").length, icon: AlertCircle, color: "from-red-50 to-red-100" },
  ]

  const handleApprove = (id: string) => {
    (async () => {
      try {
        const response = await fetch("/api/admin/verifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationId: id, status: "approved" }),
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to approve verification")
        setVerifications(verifications.map(v => v.id === id ? { ...v, status: "approved" } : v))
        setShowModal(false)
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to approve verification")
      }
    })()
  }

  const handleReject = (id: string) => {
    (async () => {
      try {
        const response = await fetch("/api/admin/verifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationId: id, status: "rejected" }),
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to reject verification")
        setVerifications(verifications.map(v => v.id === id ? { ...v, status: "rejected" } : v))
        setShowModal(false)
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to reject verification")
      }
    })()
  }

  const handleExportVerifications = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalVerifications: verifications.length,
      verifications: verifications.map(v => ({
        id: v.id,
        name: v.name,
        email: v.email,
        role: v.role,
        documents: v.documents,
        status: v.status,
        submittedDate: v.submittedDate,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verifications-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Verifications Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve user verification requests</p>
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
            placeholder="Search verifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button 
          onClick={handleExportVerifications}
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

      {/* Verifications Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Documents</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{verification.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{verification.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{verification.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{verification.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{verification.documents}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(verification.status)}`}>
                      {getStatusLabel(verification.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setSelectedVerification(verification); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVerifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No verification requests available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="font-semibold">{selectedVerification.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-semibold">{selectedVerification.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-semibold text-blue-600">{selectedVerification.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="font-semibold">{selectedVerification.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedVerification.status)}`}>
                    {getStatusLabel(selectedVerification.status)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Documents:</span>
                  <div className="text-right">
                    <p className="font-semibold">{selectedVerification.documents}</p>
                    {selectedVerification.documentUrl && (
                      <a 
                        href={selectedVerification.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                </div>
                {selectedVerification.notes && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">Notes:</span>
                    <span className="font-semibold text-right max-w-xs">{selectedVerification.notes}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent" 
                  onClick={() => handleReject(selectedVerification.id)}
                >
                  Reject
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(selectedVerification.id)}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
