"use client"

import { useEffect, useState } from "react"
import { 
  TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, Users,
  Plus, Eye, MoreVertical, Calendar, Download, Zap, AlertCircle,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Filter, Bell, ChevronRight, Star, Award, BarChart3
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"

export default function ShopkeeperDashboard() {
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [timeRange, setTimeRange] = useState("7d")
  const [shopkeeperCustomersCount, setShopkeeperCustomersCount] = useState(0)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: ""
  })

  // KPI Data
  const kpis = [
    {
      label: "Total Revenue",
      value: "KES 245,320",
      change: 12.5,
      trend: "up",
      icon: DollarSign,
      color: "from-emerald-600 to-emerald-700"
    },
    {
      label: "Orders Today",
      value: "24",
      change: 8.2,
      trend: "up",
      icon: ShoppingCart,
      color: "from-blue-600 to-blue-700"
    },
    {
      label: "Active Products",
      value: "156",
      change: 2.1,
      trend: "down",
      icon: Package,
      color: "from-purple-600 to-purple-700"
    },
    {
      label: "Total Customers",
      value: String(shopkeeperCustomersCount),
      change: 15.3,
      trend: "up",
      icon: Users,
      color: "from-orange-600 to-orange-700"
    }
  ]

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/shopkeeper/users", {
          cache: "no-store",
          headers: {
            "x-user-role": "shopkeeper",
          },
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return
        }

        const users = payload.data as Array<{ role?: string }>
        setShopkeeperCustomersCount(
          users.filter((u) => String(u.role || "").toLowerCase() === "customer").length,
        )
      } catch {
        // Keep dashboard usable even if users API is temporarily unavailable.
      }
    }

    fetchUsers()
  }, [])

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", items: 3, amount: "KES 2,500", status: "completed", time: "2 hours ago" },
    { id: "ORD-002", customer: "Jane Smith", items: 1, amount: "KES 1,200", status: "processing", time: "1 hour ago" },
    { id: "ORD-003", customer: "Mike Johnson", items: 5, amount: "KES 5,800", status: "pending", time: "30 mins ago" },
    { id: "ORD-004", customer: "Sarah Williams", items: 2, amount: "KES 3,400", status: "completed", time: "1 hour ago" },
  ]

  const topProducts = [
    { id: 1, name: "Smartphone X1", sales: 234, revenue: "KES 58,500" },
    { id: 2, name: "Wireless Headphones", sales: 189, revenue: "KES 37,800" },
    { id: 3, name: "USB-C Cable", sales: 412, revenue: "KES 20,600" },
    { id: 4, name: "Phone Stand", sales: 156, revenue: "KES 9,360" },
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      completed: <CheckCircle2 className="w-4 h-4" />,
      processing: <Clock className="w-4 h-4" />,
      pending: <AlertCircle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your shop performance</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button 
              onClick={() => setShowAddProductModal(true)}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            const isPositive = kpi.trend === "up"
            return (
              <Card key={idx} className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${isPositive ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" : "text-red-600 bg-red-100 dark:bg-red-900/30"}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                <Link href="/shopkeeper/orders">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{order.id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer} • {order.items} items</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900 dark:text-white">{order.amount}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{order.time}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Products</h2>
              <Link href="/shopkeeper/products">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                  </div>
                  <div className="ml-11">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.sales} sales • {product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Processing Orders</p>
                <p className="text-4xl font-bold">12</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
            <Link href="/shopkeeper/orders?status=processing">
              <Button className="w-full bg-white hover:bg-blue-50 text-blue-600 font-semibold mt-4">
                Process Orders
              </Button>
            </Link>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Low Stock Items</p>
                <p className="text-4xl font-bold">8</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-200" />
            </div>
            <Link href="/shopkeeper/products?filter=low-stock">
              <Button className="w-full bg-white hover:bg-amber-50 text-amber-600 font-semibold mt-4">
                Restock Now
              </Button>
            </Link>
          </Card>

          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold">KES 18,540</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-200" />
            </div>
            <Link href="/shopkeeper/analytics">
              <Button className="w-full bg-white hover:bg-emerald-50 text-emerald-600 font-semibold mt-4">
                View Analytics
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Add Product Modal */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name</label>
              <Input 
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input 
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="KES"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <Input 
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  placeholder="Quantity"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Appliances">Appliances</option>
                <option value="Hardware">Hardware</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Product description"
                className="w-full px-3 py-2 border border-input rounded-md resize-none h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  alert("Product added successfully!")
                  setShowAddProductModal(false)
                  setNewProduct({ name: "", price: "", category: "", stock: "", description: "" })
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
