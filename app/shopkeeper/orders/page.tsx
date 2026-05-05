"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  Printer,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/lib/auth-context";
import Image from "next/image";
import Link from "next/link";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function ShopkeeperOrdersPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const loadOrders = async () => {
      try {
        const response = await fetch(
          `/api/shopkeeper/orders?providerId=${encodeURIComponent(user.id)}`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();
        setOrdersList(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setOrdersList([]);
      }
    };

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 20000);
    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const tabs = [
    { key: "all", label: "All Orders", icon: Package },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "processing", label: "Processing", icon: TrendingUp },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
    { key: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery);
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300",
      processing:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
      shipped:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300",
      delivered:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300",
      cancelled:
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      processing: <TrendingUp className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle2 className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons];
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    (async () => {
      try {
        const response = await fetch(
          `/api/shopkeeper/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to update order status");

        setOrdersList(
          ordersList.map((order) =>
            String(order.id) === String(orderId)
              ? { ...order, status: newStatus }
              : order,
          ),
        );
        alert(`Order ${orderId} status updated to ${newStatus}`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to update order status",
        );
      }
    })();
  };

  const handlePrint = (order: any) => {
    const invoiceNumber = String(order?.id || "");
    const customer = String(order?.customer || "Customer");
    const product = String(order?.product || "Product");
    const phone = String(order?.phone || "-");
    const location = String(order?.location || "Not specified");
    const date = String(order?.date || new Date().toLocaleString());
    const status = String(order?.status || "pending");
    const quantity = Number(order?.quantity || 0);
    const amount = Number(order?.amount || 0);
    const quantityLabel = quantity > 0 ? String(quantity) : "N/A";
    const unitPrice = quantity > 0 ? Math.round(amount / quantity) : amount;

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${escapeHtml(invoiceNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .title { font-size: 24px; font-weight: 700; }
      .meta { color: #4b5563; font-size: 13px; }
      .section { margin-top: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
      th { background: #f3f4f6; }
      .total { margin-top: 12px; text-align: right; font-weight: 700; font-size: 16px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">SAJI Invoice</div>
        <div class="meta">Order ${escapeHtml(invoiceNumber)}</div>
      </div>
      <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
    </div>

    <div class="section meta">
      <div><strong>Customer:</strong> ${escapeHtml(customer)}</div>
      <div><strong>Phone:</strong> ${escapeHtml(phone)}</div>
      <div><strong>Location:</strong> ${escapeHtml(location)}</div>
      <div><strong>Order Date:</strong> ${escapeHtml(date)}</div>
      <div><strong>Status:</strong> ${escapeHtml(status)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(product)}</td>
          <td>${escapeHtml(quantityLabel)}</td>
          <td>KES ${unitPrice.toLocaleString()}</td>
          <td>KES ${amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total">Total: KES ${amount.toLocaleString()}</div>
  </body>
</html>`;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!printWindow) {
      alert("Unable to open print window. Please allow pop-ups.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = (order: any) => {
    const row = {
      orderId: String(order?.id || ""),
      customer: String(order?.customer || ""),
      phone: String(order?.phone || ""),
      product: String(order?.product || ""),
      quantity: String(order?.quantity || ""),
      status: String(order?.status || "pending"),
      location: String(order?.location || ""),
      date: String(order?.date || ""),
      amountKES: Number(order?.amount || 0),
      paymentMethod: String(order?.paymentMethod || ""),
    };

    const csv = [
      "orderId,customer,phone,product,quantity,status,location,date,amountKES,paymentMethod",
      [
        row.orderId,
        row.customer,
        row.phone,
        row.product,
        row.quantity,
        row.status,
        row.location,
        row.date,
        String(row.amountKES),
        row.paymentMethod,
      ]
        .map((item) => `"${String(item).replace(/\"/g, '""')}"`)
        .join(","),
    ].join("\n");

    downloadTextFile(csv, `invoice-${row.orderId || "order"}.csv`, "text/csv;charset=utf-8");
  };

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export.");
      return;
    }

    const headers = [
      "orderId",
      "customer",
      "phone",
      "product",
      "quantity",
      "status",
      "location",
      "date",
      "amountKES",
      "paymentMethod",
    ];

    const lines = filteredOrders.map((order) =>
      [
        order.id,
        order.customer,
        order.phone,
        order.product,
        order.quantity ?? "",
        order.status,
        order.location ?? "",
        order.date,
        order.amount,
        order.paymentMethod ?? "",
      ]
        .map((item) => `"${String(item ?? "").replace(/\"/g, '""')}"`)
        .join(","),
    );

    const csv = [headers.join(","), ...lines].join("\n");
    downloadTextFile(
      csv,
      `shopkeeper-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
    );
  };

  const orderStats = [
    {
      label: "Total Orders",
      value: ordersList.length,
      icon: Package,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Pending",
      value: ordersList.filter((o) => o.status === "pending").length,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      label: "In Transit",
      value: ordersList.filter((o) => o.status === "shipped").length,
      icon: Truck,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Total Revenue",
      value: `KES ${ordersList.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}`,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-800 dark:to-orange-800 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Order Management</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {orderStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-100">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className="w-6 h-6 text-amber-200 opacity-60" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        {/* Search and Filters */}
        <Card className="p-4 mb-6 shadow-lg border-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={handleExportOrders}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "all"
                ? ordersList.length
                : ordersList.filter((o) => o.status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
                  activeTab === tab.key
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-amber-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key
                      ? "bg-white/20"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        <div className="space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="p-4 hover:shadow-lg transition-all border-0 cursor-pointer"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={order.productImage || "/placeholder.svg"}
                      alt={order.product}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {order.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.product}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </div>
                    </div>

                    {/* Customer and Address Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Image
                          src={order.avatar || "/placeholder.svg"}
                          alt={order.customer}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{order.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{order.date}</span>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Amount
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                          KES {order.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="bg-transparent"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "processing")
                              }
                            >
                              Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "shipped")
                              }
                            >
                              Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "delivered")
                              }
                            >
                              Mark Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePrint(order)}
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(order)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleStatusChange(order.id, "cancelled")
                              }
                            >
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No orders found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Status
                </h3>
                <div
                  className={`px-4 py-2 rounded-lg border ${getStatusColor(selectedOrder.status)}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.status)}
                    <span className="font-medium">
                      {selectedOrder.status.charAt(0).toUpperCase() +
                        selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Customer
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.customer}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Phone
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.phone}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.email}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Payment Method
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.paymentMethod || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Delivery Address
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-900 dark:text-white">
                    {selectedOrder.location || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Product Details
                </h3>
                <div className="flex gap-4">
                  <Image
                    src={selectedOrder.productImage || "/placeholder.svg"}
                    alt={selectedOrder.product}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.product}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity: {selectedOrder.quantity || "Not specified"}
                    </p>
                    <p className="text-lg font-bold text-amber-600 mt-2">
                      KES {selectedOrder.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Notes
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                  className="flex-1 bg-transparent"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handlePrint(selectedOrder)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
