"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import Link from "next/link"

import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/lib/auth-context"

type ShopkeeperOrder = {
  id: string
  customer: string
  items: number
  amount: number
  status: string
  time: string
  createdAt: string
  product: string
}

type ShopkeeperProduct = {
  id: string
  name: string
  sales: number
  revenue: number
}

type ShopkeeperCustomer = {
  id: string
  name: string
  email: string
  phone: string
  joined: string
  orders: number
  status: string
}

function formatMoney(value: number) {
  return `KES ${value.toLocaleString()}`
}

const DEFAULT_PRODUCT_CATEGORIES = [
  "Fresh Produce",
  "Groceries",
  "Hardware",
  "Electronics",
  "Plumbing Supplies",
  "Electrical Supplies",
  "Building Materials",
  "Tools",
  "Household",
  "Fashion",
  "Beauty & Cosmetics",
  "Health & Wellness",
  "Other",
]

export default function ShopkeeperDashboard() {
  const { user, isLoading } = useAuthContext()
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [timeRange, setTimeRange] = useState("7d")
  const [shopkeeperCustomersCount, setShopkeeperCustomersCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [ordersTodayCount, setOrdersTodayCount] = useState(0)
  const [activeProductsCount, setActiveProductsCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState<ShopkeeperOrder[]>([])
  const [topProducts, setTopProducts] = useState<ShopkeeperProduct[]>([])
  const [recentCustomers, setRecentCustomers] = useState<ShopkeeperCustomer[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: "",
  })

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadDashboard = async () => {
      try {
        const [usersResponse, earningsResponse, ordersResponse, productsResponse] = await Promise.all([
          fetch("/api/shopkeeper/users", {
            cache: "no-store",
            headers: { "x-user-role": "shopkeeper" },
          }),
          fetch("/api/shopkeeper/earnings", { cache: "no-store" }),
          fetch(`/api/shopkeeper/orders?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
          fetch(`/api/shopkeeper/products?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
        ])

        const [usersPayload, earningsPayload, ordersPayload, productsPayload] = await Promise.all([
          usersResponse.json(),
          earningsResponse.json(),
          ordersResponse.json(),
          productsResponse.json(),
        ])

        if (cancelled) return

        if (usersResponse.ok && usersPayload?.ok && Array.isArray(usersPayload?.data)) {
          const users = usersPayload.data as Array<{
            id: string
            name?: string | null
            email?: string
            phone?: string | null
            role?: string
            joined?: string
            orders?: number
            status?: string
          }>
          setShopkeeperCustomersCount(
            users.filter((item) => String(item.role || "").toLowerCase() === "customer").length,
          )
          const mappedCustomers = users
            .filter((item) => String(item.role || "").toLowerCase() === "customer")
            .map((item) => ({
              id: String(item.id || ""),
              name: String(item.name || "Customer"),
              email: String(item.email || ""),
              phone: String(item.phone || "-"),
              joined: String(item.joined || ""),
              orders: Number(item.orders || 0),
              status: String(item.status || "Active"),
            }))
          setRecentCustomers(mappedCustomers.slice(0, 6))
        }

        if (earningsResponse.ok && earningsPayload?.ok) {
          setTotalRevenue(Number(earningsPayload?.data?.totalEarnings || 0))
          setThisMonthRevenue(Number(earningsPayload?.data?.thisMonth || 0))
        }

        const orders = ordersResponse.ok && ordersPayload?.ok && Array.isArray(ordersPayload?.data)
          ? (ordersPayload.data as Array<{
              id: string
              customer: string
              amount: number
              status: string
              date: string
              createdAt?: string
              product: string
            }>)
          : []

        const products = productsResponse.ok && productsPayload?.ok && Array.isArray(productsPayload?.data)
          ? (productsPayload.data as Array<{
              id: string
              name: string
              price: number
              status: string
              category: string
            }>)
          : []

        const sortedOrders = orders
          .slice()
          .sort((left, right) => {
            const leftDate = new Date(String(left.createdAt || left.date)).getTime()
            const rightDate = new Date(String(right.createdAt || right.date)).getTime()
            return rightDate - leftDate
          })

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const todayOrders = sortedOrders.filter((order) => {
          const createdAt = order.createdAt ? new Date(order.createdAt) : null
          return Boolean(createdAt && createdAt >= todayStart)
        })

        setOrdersTodayCount(todayOrders.length)
        setTodayRevenue(todayOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0))
        setRecentOrders(
          sortedOrders.slice(0, 5).map((order) => ({
            id: order.id,
            customer: order.customer,
            items: 1,
            amount: Number(order.amount || 0),
            status: order.status,
            time: order.createdAt ? new Date(order.createdAt).toLocaleString() : order.date,
            createdAt: String(order.createdAt || ""),
            product: order.product,
          })),
        )

        const productPerformance = new Map<string, { sales: number; revenue: number }>()
        orders.forEach((order) => {
          const current = productPerformance.get(order.product) || { sales: 0, revenue: 0 }
          current.sales += 1
          current.revenue += Number(order.amount || 0)
          productPerformance.set(order.product, current)
        })

        setTopProducts(
          products
            .map((product) => ({
              id: product.id,
              name: product.name,
              sales: productPerformance.get(product.name)?.sales || 0,
              revenue: productPerformance.get(product.name)?.revenue || 0,
            }))
            .sort((left, right) => right.sales - left.sales || right.revenue - left.revenue)
            .slice(0, 5),
        )
        setActiveProductsCount(products.length)
        setCategoryOptions(
          Array.from(
            new Set(
              [
                ...DEFAULT_PRODUCT_CATEGORIES,
                ...products
                  .map((product) => String(product?.category || "").trim())
                  .filter(Boolean),
              ],
            ),
          ),
        )
      } catch {
        if (!cancelled) {
          setRecentOrders([])
          setTopProducts([])
          setRecentCustomers([])
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const kpis = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatMoney(totalRevenue),
        change: 0,
        trend: totalRevenue > 0 ? "up" : "down",
        icon: DollarSign,
        color: "from-emerald-600 to-emerald-700",
      },
      {
        label: "Orders Today",
        value: String(ordersTodayCount),
        change: 0,
        trend: ordersTodayCount > 0 ? "up" : "down",
        icon: ShoppingCart,
        color: "from-blue-600 to-blue-700",
      },
      {
        label: "Active Products",
        value: String(activeProductsCount),
        change: 0,
        trend: activeProductsCount > 0 ? "up" : "down",
        icon: Package,
        color: "from-purple-600 to-purple-700",
      },
      {
        label: "Total Customers",
        value: String(shopkeeperCustomersCount),
        change: 0,
        trend: shopkeeperCustomersCount > 0 ? "up" : "down",
        icon: Users,
        color: "from-orange-600 to-orange-700",
      },
    ],
    [activeProductsCount, ordersTodayCount, shopkeeperCustomersCount, totalRevenue],
  )

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      completed: <CheckCircle2 className="w-4 h-4" />,
      processing: <Clock className="w-4 h-4" />,
      pending: <AlertCircle className="w-4 h-4" />,
    }
    return icons[status as keyof typeof icons]
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back! Here&apos;s your shop performance</p>
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
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${
                      isPositive
                        ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
                        : "text-red-600 bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{order.id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customer} • {order.items} item
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900 dark:text-white">{formatMoney(order.amount)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{order.time}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent orders available.</p>
                )}
              </div>
            </Card>
          </div>

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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.sales} sales • {formatMoney(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No top product data available.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 border-0 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers who have interacted with your shop</p>
            </div>
            <Link href="/shopkeeper/orders">
              <Button variant="outline" size="sm" className="bg-transparent">
                View Orders
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/shopkeeper/messages?customer=${encodeURIComponent(customer.id)}`}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{customer.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{customer.email}</p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {customer.orders} orders • {customer.joined || "Joined recently"}
                  </p>
                </div>

                <div className="ml-4 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  {customer.status}
                </div>
              </Link>
            ))}

            {recentCustomers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No customers found yet.</p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Processing Orders</p>
                <p className="text-4xl font-bold">{ordersTodayCount}</p>
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
                <p className="text-4xl font-bold">0</p>
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
                <p className="text-emerald-100 text-sm font-medium mb-1">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold">{formatMoney(todayRevenue)}</p>
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
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="KES"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <Input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="Quantity"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="">Select category</option>
                {(categoryOptions.length > 0 ? categoryOptions : DEFAULT_PRODUCT_CATEGORIES).map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
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
