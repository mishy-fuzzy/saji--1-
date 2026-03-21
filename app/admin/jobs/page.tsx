"use client"

import { useState } from "react"
import {
  Search, Download, Trash2, Settings, Filter, Eye, MoreVertical,
  Calendar, MapPin, DollarSign, TrendingUp, Clock, CheckCircle, Pause, AlertCircle, Plus, Briefcase
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const jobsData = [
  { id: "JB-2401", title: "Web Development", client: "Tech Corp", budget: 150000, status: "Active", progress: 75, deadline: "Feb 15, 2026", applicants: 8, assigned: "John Dev", category: "Development" },
  { id: "JB-2402", title: "Mobile App Design", client: "StartUp Inc", budget: 200000, status: "Active", progress: 45, deadline: "Mar 01, 2026", applicants: 12, assigned: "Alice Designer", category: "Design" },
  { id: "JB-2403", title: "UI/UX Redesign", client: "Fashion Co", budget: 120000, status: "Paused", progress: 30, deadline: "Feb 28, 2026", applicants: 5, assigned: "Unassigned", category: "Design" },
  { id: "JB-2404", title: "Backend API", client: "Finance Ltd", budget: 180000, status: "Completed", progress: 100, deadline: "Jan 30, 2026", applicants: 6, assigned: "James Backend", category: "Development" },
  { id: "JB-2405", title: "Content Writing", client: "Media Group", budget: 50000, status: "Active", progress: 60, deadline: "Feb 10, 2026", applicants: 15, assigned: "Sarah Writer", category: "Content" },
  { id: "JB-2406", title: "SEO Optimization", client: "E-commerce Hub", budget: 75000, status: "Pending", progress: 0, deadline: "Feb 25, 2026", applicants: 9, assigned: "Unassigned", category: "Marketing" },
]

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [jobs, setJobs] = useState(jobsData)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [newJobTitle, setNewJobTitle] = useState("")
  const [newJobClient, setNewJobClient] = useState("")
  const [newJobBudget, setNewJobBudget] = useState("")
  const [newJobDesc, setNewJobDesc] = useState("")

  const filters = [
    { label: "All", type: "All", count: jobs.length },
    { label: "Active", type: "Active", count: jobs.filter(j => j.status === "Active").length },
    { label: "Paused", type: "Paused", count: jobs.filter(j => j.status === "Paused").length },
    { label: "Pending", type: "Pending", count: jobs.filter(j => j.status === "Pending").length },
    { label: "Completed", type: "Completed", count: jobs.filter(j => j.status === "Completed").length },
  ]

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === "All" || job.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Active": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "Paused": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
      case "Pending": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      case "Completed": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  }

  const handleArchiveJob = (jobId: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: "Archived" } : j))
    setShowJobModal(false)
  }

  const handleEditJob = () => {
    if (selectedJob) {
      setJobs(jobs.map(j => j.id === selectedJob.id ? selectedJob : j))
      setShowJobModal(false)
    }
  }

  const handleCreateJob = () => {
    if (newJobTitle && newJobClient && newJobBudget) {
      const newJob = {
        id: `JB-${Math.floor(Math.random() * 10000)}`,
        title: newJobTitle,
        client: newJobClient,
        budget: parseInt(newJobBudget),
        status: "Pending",
        progress: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        applicants: 0,
        assigned: "Unassigned",
        category: "General"
      }
      setJobs([...jobs, newJob])
      setNewJobTitle("")
      setNewJobClient("")
      setNewJobBudget("")
      setNewJobDesc("")
      setShowCreateJob(false)
    }
  }

  const handleExportJobs = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalJobs: jobs.length,
      jobs: jobs.map(j => ({
        id: j.id,
        title: j.title,
        client: j.client,
        budget: j.budget,
        status: j.status,
        progress: j.progress,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = [
    { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "from-blue-50 to-blue-100" },
    { label: "Active", value: jobs.filter(j => j.status === "Active").length, icon: CheckCircle, color: "from-emerald-50 to-emerald-100" },
    { label: "In Progress", value: jobs.filter(j => j.progress > 0 && j.progress < 100).length, icon: Clock, color: "from-yellow-50 to-yellow-100" },
    { label: "Total Value", value: `KES ${(jobs.reduce((sum, j) => sum + j.budget, 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: "from-purple-50 to-purple-100" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Jobs Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all platform jobs and assignments</p>
        </div>
        <Button onClick={() => setShowCreateJob(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={18} />
          New Job
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
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportJobs}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" className="bg-transparent gap-2">
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
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{job.client}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedJob(job)
                  setShowJobModal(true)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group relative"
              >
                <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-10 hidden group-hover:block">
                  <button onClick={() => { setSelectedJob(job); setShowJobModal(true); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">View Details</button>
                  <button onClick={() => { setSelectedJob(job); setShowJobModal(true); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
                  <button onClick={() => handleArchiveJob(job.id)} className="block w-full text-left px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700">Archive</button>
                </div>
              </button>
            </div>

            {/* Job Details */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Budget</span>
                <span className="font-semibold text-gray-900 dark:text-white">KES {job.budget.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                <span className="font-semibold text-gray-900 dark:text-white">{job.deadline}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Assigned to</span>
                <span className={`font-semibold ${job.assigned === "Unassigned" ? "text-orange-600" : "text-emerald-600"}`}>
                  {job.assigned}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-xs font-bold text-blue-600">{job.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                  {job.applicants} applicants
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedJob(job)
                  setShowJobModal(true)
                }}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
              >
                <Eye size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Job Detail Modal */}
      <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Job ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedJob.id}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedJob.status}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">KES {selectedJob.budget.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedJob.progress}%</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent"
                  onClick={() => handleArchiveJob(selectedJob.id)}
                >
                  Archive
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleEditJob}
                >
                  Edit Job
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Job Modal */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input 
              placeholder="Job Title" 
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              placeholder="Client Name" 
              value={newJobClient}
              onChange={(e) => setNewJobClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              placeholder="Budget (KES)" 
              value={newJobBudget}
              onChange={(e) => setNewJobBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <textarea 
              placeholder="Job Description" 
              rows={4} 
              value={newJobDesc}
              onChange={(e) => setNewJobDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreateJob(false)}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCreateJob}>Create Job</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
