"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Star,
  Tag,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthContext } from "@/lib/auth-context";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  providerId: string;
};

const DEFAULT_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "HVAC",
  "General Maintenance",
  "Cleaning",
  "Landscaping",
];

export default function ServicesCatalogPage() {
  const { user } = useAuthContext();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bookingsByService, setBookingsByService] = useState<
    Record<string, number>
  >({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Plumbing",
    basePrice: "",
    duration: "",
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        const [servicesRes, bookingsRes] = await Promise.all([
          fetch("/api/services", { cache: "no-store" }),
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
        ]);

        const servicesPayload = await servicesRes.json();
        const bookingsPayload = await bookingsRes.json();

        const providerServices = (
          Array.isArray(servicesPayload?.data) ? servicesPayload.data : []
        ).filter(
          (row: any) => String(row?.providerId || "") === String(user.id),
        );

        const bookings = Array.isArray(bookingsPayload?.data)
          ? bookingsPayload.data
          : [];
        const bookingMap = bookings.reduce(
          (acc: Record<string, number>, row: any) => {
            const key = String(row?.serviceId || "");
            if (!key) return acc;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {},
        );

        setServices(
          providerServices.map((row: any) => ({
            id: String(row.id),
            name: String(row.name || "Service"),
            description: String(row.description || ""),
            category: String(row.category || "General"),
            basePrice: Number(row.basePrice || 0),
            providerId: String(row.providerId || ""),
          })),
        );
        setBookingsByService(bookingMap);
      } catch {
        setServices([]);
        setBookingsByService({});
      }
    };

    loadData();
  }, [user?.id]);

  const categories = useMemo(() => {
    const dbCategories = Array.from(
      new Set(services.map((row) => row.category)),
    );
    return Array.from(new Set(["All", ...DEFAULT_CATEGORIES, ...dbCategories]));
  }, [services]);

  const filtered = useMemo(() => {
    return services
      .filter(
        (row) => filterCategory === "All" || row.category === filterCategory,
      )
      .filter((row) =>
        row.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [services, filterCategory, searchQuery]);

  const activeCount = services.length;
  const totalBookings = Object.values(bookingsByService).reduce(
    (sum, value) => sum + value,
    0,
  );
  const avgPrice = services.length
    ? Math.round(
        services.reduce((sum, row) => sum + Number(row.basePrice || 0), 0) /
          services.length,
      )
    : 0;

  const openAddDialog = () => {
    setEditingService(null);
    setForm({
      name: "",
      description: "",
      category: "Plumbing",
      basePrice: "",
      duration: "",
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (service: ServiceRow) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: String(service.basePrice),
      duration: "",
    });
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !user?.id || isSaving) return;

    setIsSaving(true);
    try {
      if (editingService) {
        const response = await fetch(
          `/api/services/${encodeURIComponent(editingService.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              description: form.description,
              category: form.category,
              basePrice: Math.max(0, Math.round(Number(form.basePrice || 0))),
            }),
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to update service");

        setServices((prev) =>
          prev.map((row) =>
            row.id === editingService.id
              ? {
                  ...row,
                  name: form.name,
                  description: form.description,
                  category: form.category,
                  basePrice: Math.max(
                    0,
                    Math.round(Number(form.basePrice || 0)),
                  ),
                }
              : row,
          ),
        );
      } else {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            category: form.category,
            basePrice: Math.max(0, Math.round(Number(form.basePrice || 0))),
            providerId: user.id,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.data) {
          throw new Error(payload?.error || "Failed to create service");
        }

        setServices((prev) => [
          {
            id: String(payload.data.id),
            name: String(payload.data.name || form.name),
            description: String(payload.data.description || form.description),
            category: String(payload.data.category || form.category),
            basePrice: Number(payload.data.basePrice || form.basePrice || 0),
            providerId: String(payload.data.providerId || user.id),
          },
          ...prev,
        ]);
      }

      setShowAddDialog(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(payload?.error || "Failed to delete service");

      setServices((prev) => prev.filter((row) => row.id !== id));
      setBookingsByService((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to delete service",
      );
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Services & Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define what you offer and set your rates
          </p>
        </div>
        <Button onClick={openAddDialog} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-[11px] text-muted-foreground">Active Services</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
          <p className="text-[11px] text-muted-foreground">Total Bookings</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">
            KES {avgPrice.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">Avg Price</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-9 rounded-xl bg-card border-border"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((service) => (
          <Card
            key={service.id}
            className="p-4 border rounded-xl transition-all border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {service.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {service.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    {service.category}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {form.duration || "Varies"}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Layers className="w-3 h-3" />
                    {bookingsByService[service.id] || 0} bookings
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    {(bookingsByService[service.id] || 0) > 0 ? "5.0" : "-"}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="mb-2">
                  {service.basePrice > 0 ? (
                    <span className="text-lg font-bold text-foreground">
                      KES {service.basePrice.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      Get Quote
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditDialog(service)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-xl" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Service Name
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Emergency Pipe Repair"
                className="rounded-lg bg-card border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe what this service includes..."
                className="rounded-lg bg-card border-border min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2"
                >
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Base Price (KES)
                </label>
                <Input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, basePrice: e.target.value }))
                  }
                  placeholder="0"
                  className="rounded-lg bg-card border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Estimated Duration (Optional)
              </label>
              <Input
                value={form.duration}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="e.g. 2-3 hours"
                className="rounded-lg bg-card border-border"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || isSaving}
                className="flex-1 rounded-xl"
              >
                {editingService ? "Update" : "Add Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
