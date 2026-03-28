"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  Eye,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Dispute = {
  id: string;
  user: string;
  job: string;
  amount: number;
  reason: string;
  status: "Open" | "In Review" | "Resolved";
  severity: "High" | "Medium" | "Low";
  date: string;
};

export default function DisputesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const normalizeStatus = (status: string): Dispute["status"] => {
      const value = String(status || "open").toLowerCase();
      if (value === "resolved") return "Resolved";
      if (value === "under_review" || value === "in review") return "In Review";
      return "Open";
    };

    const loadDisputes = async () => {
      try {
        const response = await fetch("/api/disputes", { cache: "no-store" });
        const payload = await response.json();
        const rows = Array.isArray(payload?.disputes) ? payload.disputes : [];

        setDisputes(
          rows.map((row: any) => ({
            id: String(row.id || ""),
            user: row.createdBy?.name || "User",
            job: row.job?.title || "Job",
            amount: Number(row.job?.price || 0),
            reason: row.reason || "No reason",
            status: normalizeStatus(row.status),
            severity: "Medium" as const,
            date: row.createdAt
              ? new Date(row.createdAt).toLocaleDateString()
              : "",
          })),
        );
      } catch {
        setDisputes([]);
      }
    };

    loadDisputes();
    const intervalId = window.setInterval(loadDisputes, 25000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filters = [
    { label: "All", type: "All", count: disputes.length },
    {
      label: "Open",
      type: "Open",
      count: disputes.filter((d) => d.status === "Open").length,
    },
    {
      label: "In Review",
      type: "In Review",
      count: disputes.filter((d) => d.status === "In Review").length,
    },
    {
      label: "Resolved",
      type: "Resolved",
      count: disputes.filter((d) => d.status === "Resolved").length,
    },
  ];

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.includes(searchTerm.toUpperCase());
    const matchesFilter = activeFilter === "All" || d.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "In Review":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "Resolved":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-red-600 dark:text-red-400";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "Low":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleResolveDispute = (disputeId: string) => {
    (async () => {
      try {
        const response = await fetch(`/api/disputes/${disputeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to resolve dispute");
        setDisputes(
          disputes.map((d) =>
            d.id === disputeId ? { ...d, status: "Resolved" } : d,
          ),
        );
        setShowModal(false);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to resolve dispute",
        );
      }
    })();
  };

  const handleRejectDispute = (disputeId: string) => {
    (async () => {
      try {
        const response = await fetch(`/api/disputes/${disputeId}`, {
          method: "DELETE",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to reject dispute");
        setDisputes(disputes.filter((d) => d.id !== disputeId));
        setShowModal(false);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to reject dispute",
        );
      }
    })();
  };

  const handleExportDisputes = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalDisputes: disputes.length,
      disputes: disputes.map((d) => ({
        id: d.id,
        user: d.user,
        job: d.job,
        amount: d.amount,
        reason: d.reason,
        status: d.status,
        severity: d.severity,
        date: d.date,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disputes-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Total Disputes",
      value: disputes.length,
      icon: AlertTriangle,
      color: "from-red-50 to-red-100",
    },
    {
      label: "Open Cases",
      value: disputes.filter((d) => d.status === "Open").length,
      icon: Clock,
      color: "from-yellow-50 to-yellow-100",
    },
    {
      label: "Under Review",
      value: disputes.filter((d) => d.status === "In Review").length,
      icon: MessageSquare,
      color: "from-blue-50 to-blue-100",
    },
    {
      label: "Total at Stake",
      value: `KES ${(disputes.reduce((sum, d) => sum + d.amount, 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: "from-purple-50 to-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Disputes Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Handle and resolve platform disputes
        </p>
      </div>

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
            placeholder="Search disputes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button
          onClick={handleExportDisputes}
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
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Disputes Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Job
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Severity
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDisputes.map((dispute) => (
                <tr
                  key={dispute.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {dispute.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {dispute.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {dispute.job}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    KES {dispute.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {dispute.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}
                    >
                      {dispute.status}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-semibold ${getSeverityColor(dispute.severity)}`}
                  >
                    {dispute.severity}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDisputes.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No dispute records available.
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
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="font-semibold">{selectedDispute.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="font-semibold">{selectedDispute.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Amount at Stake:
                  </span>
                  <span className="font-semibold">
                    KES {selectedDispute.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reason:</span>
                  <span className="font-semibold">
                    {selectedDispute.reason}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => handleRejectDispute(selectedDispute.id)}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleResolveDispute(selectedDispute.id)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
