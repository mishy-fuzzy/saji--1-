"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search, Eye, Printer, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthContext } from "@/lib/auth-context";

type Invoice = {
  id: string;
  bookingId: string;
  client: string;
  clientPhone: string;
  service: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "draft";
  items: { desc: string; qty: number; rate: number }[];
};

export default function InvoicesPage() {
  const { user } = useAuthContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [newInvoice, setNewInvoice] = useState({
    bookingId: "",
    dueDate: "",
    items: [{ desc: "", qty: 1, rate: 0 }],
  });

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/provider/invoices", {
        cache: "no-store",
      });
      const payload = await response.json();
      setInvoices(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setInvoices([]);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        const [invoicesRes, bookingsRes] = await Promise.all([
          fetch("/api/provider/invoices", { cache: "no-store" }),
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
        ]);

        const invoicesPayload = await invoicesRes.json();
        const bookingsPayload = await bookingsRes.json();

        setInvoices(
          Array.isArray(invoicesPayload?.data) ? invoicesPayload.data : [],
        );
        setBookings(
          Array.isArray(bookingsPayload?.data) ? bookingsPayload.data : [],
        );
      } catch {
        setInvoices([]);
        setBookings([]);
      }
    };

    loadData();
  }, [user?.id]);

  const filtered = useMemo(() => {
    return invoices
      .filter(
        (invoice) =>
          filterStatus === "All" ||
          invoice.status === filterStatus.toLowerCase(),
      )
      .filter(
        (invoice) =>
          invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [invoices, filterStatus, searchQuery]);

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    draft: "bg-muted text-muted-foreground",
  };

  const totalRevenue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPending = invoices
    .filter((invoice) => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const totalOverdue = invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const addItem = () => {
    setNewInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { desc: "", qty: 1, rate: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const createInvoice = async () => {
    if (!newInvoice.bookingId) return;

    try {
      const response = await fetch("/api/provider/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: newInvoice.bookingId,
          dueDate: newInvoice.dueDate,
          items: newInvoice.items,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(payload?.error || "Failed to create invoice");

      await loadInvoices();
      setShowCreate(false);
      setNewInvoice({
        bookingId: "",
        dueDate: "",
        items: [{ desc: "", qty: 1, rate: 0 }],
      });
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create invoice",
      );
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Invoices & Receipts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, send, and track invoices for your services
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Collected</p>
          <p className="text-lg font-bold text-emerald-600">
            KES {totalRevenue.toLocaleString()}
          </p>
        </Card>
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-amber-600">
            KES {totalPending.toLocaleString()}
          </p>
        </Card>
        <Card className="p-3 border border-border rounded-xl">
          <p className="text-[11px] text-muted-foreground">Overdue</p>
          <p className="text-lg font-bold text-destructive">
            KES {totalOverdue.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="pl-9 rounded-xl bg-card border-border"
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((invoice) => (
          <Card
            key={invoice.id}
            className="p-4 border border-border rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      INV-{invoice.id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[invoice.status]}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.client} - {invoice.service}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Due: {invoice.dueDate || "Not set"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">
                  KES {invoice.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => setViewInvoice(invoice)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent
          className="max-w-md rounded-xl p-0"
          showCloseButton={false}
        >
          {viewInvoice && (
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    INV-{viewInvoice.id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Issued: {viewInvoice.date}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[viewInvoice.status]}`}
                >
                  {viewInvoice.status.charAt(0).toUpperCase() +
                    viewInvoice.status.slice(1)}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Bill To</p>
                <p className="text-sm font-semibold text-foreground">
                  {viewInvoice.client}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewInvoice.clientPhone}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  ITEMS
                </p>
                {viewInvoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm text-foreground">{item.desc}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      KES {(item.qty * item.rate).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    KES {viewInvoice.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (16%)</span>
                  <span className="text-foreground">
                    KES {viewInvoice.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    KES {viewInvoice.total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewInvoice(null)}
                  className="flex-1 rounded-xl"
                >
                  Close
                </Button>
                <Button className="flex-1 rounded-xl">
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Create Invoice
            </h2>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Booking
              </label>
              <select
                value={newInvoice.bookingId}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    bookingId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Select booking</option>
                {bookings.map((booking: any) => (
                  <option key={booking.id} value={String(booking.id)}>
                    {String(booking?.service?.name || "Service")} -{" "}
                    {String(booking?.customer?.name || "Client")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Due Date
              </label>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className="rounded-lg bg-card border-border"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">
                  Line Items
                </label>
                <button
                  onClick={addItem}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  + Add Item
                </button>
              </div>
              {newInvoice.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item.desc}
                    onChange={(e) => updateItem(index, "desc", e.target.value)}
                    placeholder="Description"
                    className="flex-1 rounded-lg bg-card border-border text-sm"
                  />
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(index, "qty", Number(e.target.value || 1))
                    }
                    className="w-14 rounded-lg bg-card border-border text-sm"
                  />
                  <Input
                    type="number"
                    value={item.rate || ""}
                    onChange={(e) =>
                      updateItem(index, "rate", Number(e.target.value || 0))
                    }
                    placeholder="Rate"
                    className="w-20 rounded-lg bg-card border-border text-sm"
                  />
                  {newInvoice.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1 text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={createInvoice}
                disabled={!newInvoice.bookingId}
                className="flex-1 rounded-xl"
              >
                Create Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
