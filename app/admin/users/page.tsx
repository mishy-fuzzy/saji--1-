"use client"

import { useState, Suspense } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Search, Download, Trash2, Settings, Filter, ChevronUp, ChevronDown, Eye, MoreVertical, PhoneIncoming as Incoming, CheckCircle2, AlertCircle, Clock, TrendingUp, Mail, Phone, Edit } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import jsPDF from "jspdf"
import "jspdf-autotable"

const initialUsers = [
  { id: "JP-270349", name: "Sarah K.", email: "sarah@email.com", phone: "+254 712 345 678", role: "Customer", status: "Active", earnings: 812000, joined: "Jan 15, 2026", orders: 12, disputes: 0, type: "active" },
  { id: "JP-270005", name: "Mark L.", email: "mark@email.com", phone: "+254 722 456 789", role: "Provider", status: "Pending", earnings: 456000, joined: "Jan 18, 2026", orders: 8, disputes: 1, type: "incoming" },
  { id: "JP-270336", name: "Sarah S.", email: "sarah.s@email.com", phone: "+254 732 567 890", role: "Provider", status: "Active", earnings: 1034000, joined: "Jan 12, 2026", orders: 24, disputes: 0, type: "active" },
  { id: "JP-270288", name: "David N.", email: "david@email.com", phone: "+254 742 678 901", role: "Customer", status: "Completed", earnings: 125500, joined: "Dec 28, 2025", orders: 5, disputes: 0, type: "completed" },
  { id: "JP-270058", name: "John M.", email: "john@email.com", phone: "+254 752 789 012", role: "Provider", status: "Active", earnings: 682000, joined: "Jan 20, 2026", orders: 18, disputes: 0, type: "active" },
  { id: "JP-270060", name: "Alice T.", email: "alice@email.com", phone: "+254 762 890 123", role: "Customer", status: "Disputed", earnings: 682000, joined: "Jan 22, 2026", orders: 7, disputes: 2, type: "disputed" },
]

function UsersContent() {
  const { currency, convertPrice } = useLocalization()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [users, setUsers] = useState(initialUsers)
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isEditingUser, setIsEditingUser] = useState(false)

  const filters = [
    { label: "All", type: "All", count: users.length },
    { label: "Incoming (New)", type: "incoming", count: users.filter(u => u.type === "incoming").length },
    { label: "Active", type: "active", count: users.filter(u => u.type === "active").length },
    { label: "Completed", type: "completed", count: users.filter(u => u.type === "completed").length },
    { label: "Disputed", type: "disputed", count: users.filter(u => u.type === "disputed").length },
  ]

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = activeFilter === "All" || user.type === activeFilter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a]
      let bValue = b[sortBy as keyof typeof b]
      
      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()
      
      if (sortOrder === "asc") return aValue > bValue ? 1 : -1
      return aValue < bValue ? 1 : -1
    })

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      
      // Ensure filteredUsers is an array
      const usersToExport = Array.isArray(filteredUsers) ? filteredUsers : []
      
      // Header
      doc.setFontSize(16)
      doc.setTextColor(30, 30, 30)
      doc.text("Users Report", 14, 20)
      
      // Filter info
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Filter: ${activeFilter} | Generated: ${new Date().toLocaleDateString()}`, 14, 30)
      
      // Table data
      const tableData = usersToExport.map((user: any) => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        `KES ${user.earnings.toLocaleString()}`,
        user.joined,
        user.orders.toString(),
      ])

      // Table
      doc.autoTable({
        head: [["ID", "Name", "Email", "Role", "Status", "Earnings", "Joined", "Orders"]],
        body: tableData,
        startY: 40,
        theme: "grid",
        headStyles: { 
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 28 },
          7: { cellWidth: 15 }
        }
      })

      // Footer
      const finalY = doc.lastAutoTable?.finalY || 100
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Total Users: ${usersToExport.length}`, 14, finalY + 10)

      doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("[v0] PDF export error:", error)
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId))
  }

  const handleSuspendUser = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
        : u
    ))
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleToggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Active": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "Pending": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
      case "Completed": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      case "Disputed": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "incoming": return <Incoming className="w-5 h-5 text-blue-600" />
      case "active": return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case "completed": return <Clock className="w-5 h-5 text-purple-600" />
      case "disputed": return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Users Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform users and their activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.filter(u => u.status === "Active").length}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Disputed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.filter(u => u.type === "disputed").length}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">KES {(users.reduce((sum, u) => sum + u.earnings, 0) / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleExportPDF}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <Button
            variant="outline"
            className="bg-transparent gap-2"
            onClick={() => setActiveFilter((prev) => (prev === "All" ? "incoming" : "All"))}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
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
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeFilter === filter.type 
                ? "bg-blue-500" 
                : "bg-gray-200 dark:bg-gray-700"
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={() => {
                      if (selectedUsers.length === filteredUsers.length) {
                        setSelectedUsers([])
                      } else {
                        setSelectedUsers(filteredUsers.map(u => u.id))
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => handleToggleSort("id")}>
                  <div className="flex items-center gap-2">
                    ID {sortBy === "id" && (sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => handleToggleSort("name")}>
                  <div className="flex items-center gap-2">
                    User {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Earnings</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Orders</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.split(" ")[0][0]}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                          {getTypeIcon(user.type)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {user.earnings.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.orders}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400" title="View">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => { 
                            setSelectedUser(user); 
                            setIsEditingUser(true);
                            setShowUserModal(true); 
                          }} 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-purple-600 dark:text-purple-400" 
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleSuspendUser(user.id)} 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-orange-600 dark:text-orange-400" 
                          title="Suspend"
                        >
                          <AlertCircle size={18} />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 dark:text-red-400" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Showing {filteredUsers.length} of {users.length} users</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">← Previous</button>
            <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-blue-600 text-white font-semibold">1</button>
            <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">2</button>
            <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Next →</button>
          </div>
        </div>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* User Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                  {selectedUser.name.split(" ")[0][0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.role}</p>
                  <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedUser.id}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedUser.joined}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">KES {selectedUser.earnings.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Orders / Disputes</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedUser.orders} / {selectedUser.disputes}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleSuspendUser(selectedUser.id)}>Suspend</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setIsEditingUser(true)}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <UsersContent />
    </Suspense>
  )
}
