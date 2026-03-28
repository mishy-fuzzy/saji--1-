"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  Eye,
  MoreVertical,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  Briefcase,
  RefreshCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { useToast } from "@/hooks/use-toast";

type JobItem = {
  id: string;
  title: string;
  client: string;
  budget: number;
  status: string;
  progress: number;
  deadline: string;
  applicants: number;
  assigned: string;
  category: string;
};

function statusColorClass(status: string): string {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
  if (normalized === "active" || normalized === "assigned") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  if (normalized === "cancelled" || normalized === "archived") {
    return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

export default function JobsPage() {
  const { formatCurrency } = useLocalization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastePayload, setPastePayload] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [newJobBudget, setNewJobBudget] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/jobs");
      const result = await resp.json();
      if (result.ok) {
        setJobs(
          Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.jobs)
              ? result.jobs
              : [],
        );
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Fetch failed",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filters = [
    { label: "All", type: "All", count: jobs.length },
    {
      label: "Active",
      type: "Active",
      count: jobs.filter(
        (j) => j.status === "Active" || j.status === "Assigned",
      ).length,
    },
    {
      label: "Pending",
      type: "Pending",
      count: jobs.filter((j) => j.status === "Pending").length,
    },
    {
      label: "Completed",
      type: "Completed",
      count: jobs.filter((j) => j.status === "Completed").length,
    },
  ];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "All" || job.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // ... rest of the status logic

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      const resp = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });
      const result = await resp.json();
      if (result.ok) {
        toast({
          title: "Success",
          description: `Job status updated to ${newStatus}`,
        });
        fetchJobs();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const handleCreateJob = async () => {
    if (!newJobTitle.trim() || !newJobDesc.trim() || !newJobBudget.trim()) {
      toast({
        title: "Missing fields",
        description: "Title, description, and budget are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const resp = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newJobTitle.trim(),
          description: newJobDesc.trim(),
          price: newJobBudget.trim(),
          location: newJobClient.trim(),
        }),
      });

      const result = await resp.json();
      if (!resp.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to create job");
      }

      toast({
        title: "Success",
        description: "Job listing created successfully.",
      });
      setShowCreateJob(false);
      setNewJobTitle("");
      setNewJobClient("");
      setNewJobBudget("");
      setNewJobDesc("");
      fetchJobs();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create job",
        variant: "destructive",
      });
    }
  };

  const handleArchiveJob = async (jobId: string) => {
    try {
      const resp = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: "cancelled" }),
      });
      const result = await resp.json();
      if (!resp.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to archive job");
      }

      toast({
        title: "Archived",
        description: "Job archived successfully.",
      });
      setShowJobModal(false);
      fetchJobs();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to archive job",
        variant: "destructive",
      });
    }
  };

  const handleEditJob = () => {
    toast({
      title: "Edit not available",
      description:
        "Use job status actions for now. Full edit fields will be added next.",
    });
  };

  const parsePastedJobs = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return [] as Array<Record<string, string | number>>;

    try {
      const parsed = JSON.parse(trimmed);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      return rows
        .map((row: any) => ({
          title: String(row?.title || "").trim(),
          description: String(row?.description || "").trim(),
          location: String(row?.location || row?.client || "").trim(),
          price: Number(
            String(row?.price ?? row?.budget ?? 0).replace(/,/g, ""),
          ),
        }))
        .filter(
          (row) =>
            row.title &&
            row.description &&
            Number.isFinite(row.price) &&
            row.price > 0,
        );
    } catch {
      return trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, location, budget, ...descriptionParts] = line
            .split("|")
            .map((part) => part.trim());
          const description = descriptionParts.join(" | ").trim();
          return {
            title: title || "",
            description,
            location: location || "",
            price: Number(String(budget || "0").replace(/,/g, "")),
          };
        })
        .filter(
          (row) =>
            row.title &&
            row.description &&
            Number.isFinite(row.price) &&
            row.price > 0,
        );
    }
  };

  const handlePasteJobs = async () => {
    const rows = parsePastedJobs(pastePayload);
    if (rows.length === 0) {
      toast({
        title: "Nothing to import",
        description:
          "Paste JSON or lines in this format: Title | Location | Budget | Description",
        variant: "destructive",
      });
      return;
    }

    setIsPasting(true);
    try {
      const results = await Promise.allSettled(
        rows.map((row) =>
          fetch("/api/admin/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          }),
        ),
      );

      let success = 0;
      let failed = 0;

      for (const item of results) {
        if (item.status !== "fulfilled") {
          failed += 1;
          continue;
        }

        const payload = await item.value.json();
        if (item.value.ok && payload?.ok) success += 1;
        else failed += 1;
      }

      toast({
        title: "Paste jobs completed",
        description: `${success} created, ${failed} failed.`,
        variant: failed > 0 ? "destructive" : undefined,
      });

      if (success > 0) {
        setShowPasteModal(false);
        setPastePayload("");
        fetchJobs();
      }
    } finally {
      setIsPasting(false);
    }
  };

  const handleExportJobs = () => {
    // ... existing export logic
  };

  const stats = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: Briefcase,
      color: "from-blue-50 to-blue-100",
    },
    {
      label: "Active",
      value: jobs.filter(
        (j) => j.status === "Active" || j.status === "Assigned",
      ).length,
      icon: CheckCircle,
      color: "from-emerald-50 to-emerald-100",
    },
    {
      label: "In Progress",
      value: jobs.filter((j) => j.progress > 0 && j.progress < 100).length,
      icon: Clock,
      color: "from-yellow-50 to-yellow-100",
    },
    {
      label: "Total Value",
      value: formatCurrency(jobs.reduce((sum, j) => sum + j.budget, 0)),
      icon: DollarSign,
      color: "from-purple-50 to-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Jobs Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all platform jobs and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPasteModal(true)}
            className="gap-2 bg-transparent"
          >
            Paste Jobs
          </Button>
          <Button
            variant="outline"
            onClick={fetchJobs}
            size="icon"
            className="h-10 w-10"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => setShowCreateJob(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus size={18} />
            New Job
          </Button>
        </div>
      </div>
      {/* ... Rest of components using live jobs array ... */}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className={`p-4 border-0 shadow-lg bg-linear-to-br ${stat.color} dark:from-gray-800 dark:to-gray-800`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:flex-1 max-w-md relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
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
          <Button
            onClick={() => alert("Open filter panel for jobs")}
            variant="outline"
            className="bg-transparent gap-2"
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
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {job.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColorClass(job.status)}`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {job.client}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedJob(job);
                  setShowJobModal(true);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group relative"
              >
                <MoreVertical
                  size={18}
                  className="text-gray-600 dark:text-gray-400"
                />
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-10 hidden group-hover:block">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowJobModal(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowJobModal(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchiveJob(job.id)}
                    className="block w-full text-left px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Archive
                  </button>
                </div>
              </button>
            </div>

            {/* Job Details */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Budget</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  KES {job.budget.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Deadline
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {job.deadline}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Assigned to
                </span>
                <span
                  className={`font-semibold ${job.assigned === "Unassigned" ? "text-orange-600" : "text-emerald-600"}`}
                >
                  {job.assigned}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {job.progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${job.progress}%` }}
                />
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
                  setSelectedJob(job);
                  setShowJobModal(true);
                }}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
              >
                <Eye size={18} />
              </button>
            </div>
          </Card>
        ))}
        {filteredJobs.length === 0 && (
          <Card className="p-8 border-0 shadow-lg text-center text-sm text-gray-500 dark:text-gray-400 lg:col-span-2">
            No jobs available.
          </Card>
        )}
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
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedJob.id}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedJob.status}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    KES {selectedJob.budget.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedJob.progress}%
                  </p>
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
              placeholder="Location / Area"
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
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowCreateJob(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateJob}
              >
                Create Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Jobs Modal */}
      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste Jobs</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paste JSON array/object, or one job per line using:
              <br />
              <span className="font-medium">
                Title | Location | Budget | Description
              </span>
            </p>
            <textarea
              rows={10}
              value={pastePayload}
              onChange={(e) => setPastePayload(e.target.value)}
              placeholder='[{"title":"Pipe Fix","location":"Westlands","price":2500,"description":"Fix leaking sink"}]'
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasteModal(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handlePasteJobs} disabled={isPasting}>
              {isPasting ? "Importing..." : "Import Jobs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
