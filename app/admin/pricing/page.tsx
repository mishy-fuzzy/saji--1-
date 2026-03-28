"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Edit,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PricingService = {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  commission: number;
  tier: string;
  status: "Active" | "Inactive";
  providerName?: string;
};

export default function PricingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [pricing, setPricing] = useState<PricingService[]>([]);
  const [selectedService, setSelectedService] = useState<PricingService | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceCommission, setNewServiceCommission] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPricing = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/pricing", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
        throw new Error(payload?.error || "Failed to load pricing");
      }
      setPricing(payload.data as PricingService[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pricing");
      setPricing([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  const handleExportPricing = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalServices: pricing.length,
      pricing,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pricing-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteService = async (serviceId: string) => {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/pricing?id=${encodeURIComponent(serviceId)}`,
        {
          method: "DELETE",
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to delete service");
      }
      setPricing((prev) => prev.filter((item) => item.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedService) return;
    const basePrice = Number.parseInt(editPrice, 10);
    const commission = Number.parseFloat(editCommission);

    if (
      !Number.isFinite(basePrice) ||
      basePrice < 1 ||
      !Number.isFinite(commission)
    ) {
      setError("Enter valid base price and commission");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedService.id,
          basePrice,
          commission,
          name: selectedService.name,
          category: selectedService.category,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to update service");
      }

      setPricing((prev) =>
        prev.map((item) =>
          item.id === selectedService.id ? payload.data : item,
        ),
      );
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddService = async () => {
    const basePrice = Number.parseInt(newServicePrice, 10);
    const commission = Number.parseFloat(newServiceCommission);

    if (
      !newServiceName.trim() ||
      !newServiceCategory.trim() ||
      !Number.isFinite(basePrice) ||
      basePrice < 1 ||
      !Number.isFinite(commission)
    ) {
      setError("Fill all fields with valid values");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName.trim(),
          category: newServiceCategory.trim(),
          basePrice,
          commission,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to add service");
      }

      setPricing((prev) => [payload.data, ...prev]);
      setNewServiceName("");
      setNewServiceCategory("");
      setNewServicePrice("");
      setNewServiceCommission("");
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filters = useMemo(
    () => [
      { label: "All", type: "All", count: pricing.length },
      {
        label: "Active",
        type: "Active",
        count: pricing.filter((p) => p.status === "Active").length,
      },
      {
        label: "Inactive",
        type: "Inactive",
        count: pricing.filter((p) => p.status === "Inactive").length,
      },
    ],
    [pricing],
  );

  const filteredPricing = useMemo(
    () =>
      pricing.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
          activeFilter === "All" || p.status === activeFilter;
        return matchesSearch && matchesFilter;
      }),
    [pricing, searchTerm, activeFilter],
  );

  const stats = useMemo(() => {
    const avgCommission =
      pricing.length > 0
        ? pricing.reduce((sum, p) => sum + p.commission, 0) / pricing.length
        : 0;
    const totalValue = pricing.reduce((sum, p) => sum + p.basePrice, 0);
    return [
      {
        label: "Total Services",
        value: pricing.length,
        icon: DollarSign,
        color: "from-blue-50 to-blue-100",
      },
      {
        label: "Active Services",
        value: pricing.filter((p) => p.status === "Active").length,
        icon: TrendingUp,
        color: "from-emerald-50 to-emerald-100",
      },
      {
        label: "Avg Commission",
        value: `${avgCommission.toFixed(1)}%`,
        icon: DollarSign,
        color: "from-yellow-50 to-yellow-100",
      },
      {
        label: "Total Value",
        value: `KES ${(totalValue / 1000).toFixed(0)}K`,
        icon: TrendingUp,
        color: "from-orange-50 to-orange-100",
      },
    ];
  }, [pricing]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Pricing & Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage service pricing and commission rates
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          disabled={isSubmitting}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Service</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className={`p-4 border-0 shadow-lg bg-gradient-to-br ${stat.color} dark:from-gray-800 dark:to-gray-800`}
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

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:flex-1 max-w-md relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadPricing}
            variant="outline"
            className="bg-transparent"
            disabled={isLoading || isSubmitting}
          >
            Refresh
          </Button>
          <Button
            onClick={handleExportPricing}
            className="bg-green-600 hover:bg-green-700 gap-2"
            disabled={isLoading || pricing.length === 0}
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

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

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Base Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Commission
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Tier
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-sm text-gray-500">
                    Loading services...
                  </td>
                </tr>
              )}
              {!isLoading && filteredPricing.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-sm text-gray-500">
                    No services found.
                  </td>
                </tr>
              )}
              {filteredPricing.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {service.category}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    KES {service.basePrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {service.commission}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {service.tier}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        service.status === "Active"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setEditPrice(service.basePrice.toString());
                        setEditCommission(service.commission.toString());
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Pricing</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Service Name
                  </label>
                  <p className="font-semibold mt-1">{selectedService.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Base Price (KES)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              placeholder="Service Name"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Category"
              value={newServiceCategory}
              onChange={(e) => setNewServiceCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Base Price (KES)"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Commission (%)"
              value={newServiceCommission}
              onChange={(e) => setNewServiceCommission(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleAddService}
                disabled={isSubmitting}
              >
                Add Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
