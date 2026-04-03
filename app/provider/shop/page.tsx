"use client"

import { useState } from "react"
import { Store, Package, Plus, Upload, Camera, Search, Edit2, Trash2, Eye, EyeOff, Tag, TrendingUp, ShoppingBag, X, Check, AlertCircle, Barcode, Truck, CreditCard, Shield, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Product = {
  id: number; name: string; description: string; category: string
  price: number; maxRetailPrice: number; costPrice: number; quantity: number
  unit: string; sellingMode: "retail" | "wholesale" | "both"
  sourceStock: "saji" | "local"; isActive: boolean; sales: number
  margin: number; demand: "high" | "medium" | "low"
}

type ShopDetails = {
  registered: boolean; name: string; description: string; category: string
  location: string; phone: string; permitNumber: string; kraPin: string
}

const PRODUCT_CATEGORIES = [
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

export default function ShopPage() {
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    registered: false, name: "", description: "", category: "Hardware",
    location: "", phone: "", permitNumber: "", kraPin: ""
  })
  const [showRegister, setShowRegister] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "settings">("products")
  const [postType, setPostType] = useState<"product" | "service" | "bulk">("product")
  const [searchQuery, setSearchQuery] = useState("")

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Farm-Fresh Sukuma", description: "Fresh organically grown sukuma wiki from local farms", category: "Fresh Produce", price: 30, maxRetailPrice: 35, costPrice: 17, quantity: 75, unit: "Bundles", sellingMode: "retail", sourceStock: "saji", isActive: true, sales: 234, margin: 27, demand: "high" },
    { id: 2, name: "PVC Pipe 1/2 inch", description: "High quality PVC plumbing pipe, 6m length", category: "Plumbing Supplies", price: 450, maxRetailPrice: 500, costPrice: 320, quantity: 120, unit: "Pieces", sellingMode: "both", sourceStock: "saji", isActive: true, sales: 89, margin: 29, demand: "medium" },
    { id: 3, name: "Electrical Wire 2.5mm", description: "Single core copper electrical wire per meter", category: "Electrical Supplies", price: 35, maxRetailPrice: 40, costPrice: 22, quantity: 500, unit: "Meters", sellingMode: "retail", sourceStock: "local", isActive: true, sales: 156, margin: 31, demand: "high" },
    { id: 4, name: "Cement (Bamburi)", description: "Portland cement 50kg bag", category: "Building Materials", price: 750, maxRetailPrice: 800, costPrice: 580, quantity: 45, unit: "Bags", sellingMode: "wholesale", sourceStock: "saji", isActive: true, sales: 67, margin: 22, demand: "medium" },
  ])

  const [newProduct, setNewProduct] = useState({
    name: "", description: "", category: "Fresh Produce", price: "",
    costPrice: "", quantity: "", unit: "Pieces", sellingMode: "retail" as "retail" | "wholesale" | "both",
    sourceStock: "saji" as "saji" | "local",
  })

  const handleRegister = () => {
    setShopDetails(prev => ({ ...prev, registered: true }))
    setShowRegister(false)
  }

  const addProduct = () => {
    const price = Number(newProduct.price)
    const cost = Number(newProduct.costPrice)
    const margin = Math.round(((price - cost) / price) * 100)
    const p: Product = {
      id: Date.now(), name: newProduct.name, description: newProduct.description,
      category: newProduct.category, price, maxRetailPrice: Math.round(price * 1.15),
      costPrice: cost, quantity: Number(newProduct.quantity), unit: newProduct.unit,
      sellingMode: newProduct.sellingMode, sourceStock: newProduct.sourceStock,
      isActive: true, sales: 0, margin, demand: "medium",
    }
    setProducts(prev => [p, ...prev])
    setShowAddProduct(false)
    setNewProduct({ name: "", description: "", category: "Fresh Produce", price: "", costPrice: "", quantity: "", unit: "Pieces", sellingMode: "retail", sourceStock: "saji" })
  }

  const toggleProduct = (id: number) => setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))
  const deleteProduct = (id: number) => setProducts(prev => prev.filter(p => p.id !== id))

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const totalRevenue = products.reduce((a, p) => a + p.sales * p.price, 0)

  const demandColors = { high: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", medium: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400", low: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" }

  // Not registered - show upgrade CTA
  if (!shopDetails.registered) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <div className="text-center pt-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <Store className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Upgrade to Shop Owner</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start selling products alongside your services. Register your shop and reach thousands of verified buyers on SAJI.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: ShoppingBag, title: "Sell Products", desc: "List products with smart pricing and margin intelligence" },
            { icon: Truck, title: "Source Stock", desc: "Access SAJI Wholesale Network for competitive prices" },
            { icon: Shield, title: "Protected Sales", desc: "Escrow payments and verified buyers for safe transactions" },
          ].map((b, i) => (
            <Card key={i} className="p-4 border border-border rounded-xl text-center">
              <b.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground text-sm mb-1">{b.title}</h3>
              <p className="text-[11px] text-muted-foreground">{b.desc}</p>
            </Card>
          ))}
        </div>

        <Button onClick={() => setShowRegister(true)} className="w-full py-5 text-base font-bold rounded-xl">
          <Store className="w-5 h-5 mr-2" />Register My Shop
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Protected payments - Escrow safety - Verified buyers</p>

        {/* Registration Dialog */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Register Your Shop</h2>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Shop Name</label>
                <Input value={shopDetails.name} onChange={(e) => setShopDetails(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Njeri's Hardware & Supplies" className="rounded-lg bg-card border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Description</label>
                <Textarea value={shopDetails.description} onChange={(e) => setShopDetails(p => ({ ...p, description: e.target.value }))} placeholder="What does your shop sell?" className="rounded-lg bg-card border-border min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Category</label>
                  <select value={shopDetails.category} onChange={(e) => setShopDetails(p => ({ ...p, category: e.target.value }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
                    <option>Hardware</option><option>Electronics</option><option>Groceries</option><option>Fresh Produce</option><option>Building Materials</option><option>General Store</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
                  <Input value={shopDetails.phone} onChange={(e) => setShopDetails(p => ({ ...p, phone: e.target.value }))} placeholder="+254..." className="rounded-lg bg-card border-border" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Shop Location</label>
                <Input value={shopDetails.location} onChange={(e) => setShopDetails(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Tom Mboya St, Nairobi CBD" className="rounded-lg bg-card border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Business Permit No.</label>
                  <Input value={shopDetails.permitNumber} onChange={(e) => setShopDetails(p => ({ ...p, permitNumber: e.target.value }))} placeholder="Optional" className="rounded-lg bg-card border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">KRA PIN</label>
                  <Input value={shopDetails.kraPin} onChange={(e) => setShopDetails(p => ({ ...p, kraPin: e.target.value }))} placeholder="Optional" className="rounded-lg bg-card border-border" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowRegister(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleRegister} disabled={!shopDetails.name.trim() || !shopDetails.location.trim()} className="flex-1 rounded-xl">Register Shop</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Registered - show shop management
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{shopDetails.name || "My Shop"}</h1>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your products and orders</p>
        </div>
        <Button onClick={() => setShowAddProduct(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <Package className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{products.length}</p>
          <p className="text-[10px] text-muted-foreground">Products</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <ShoppingBag className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{products.reduce((a, p) => a + p.sales, 0)}</p>
          <p className="text-[10px] text-muted-foreground">Total Sales</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">KES {(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-muted-foreground">Revenue</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <Tag className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{Math.round(products.reduce((a, p) => a + p.margin, 0) / products.length)}%</p>
          <p className="text-[10px] text-muted-foreground">Avg Margin</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[
          { id: "products" as const, label: "Products" },
          { id: "orders" as const, label: "Orders" },
          { id: "settings" as const, label: "Shop Settings" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="pl-9 rounded-xl bg-card border-border" />
          </div>

          {/* Product List */}
          <div className="space-y-2">
            {filtered.map(product => (
              <Card key={product.id} className={`p-4 border rounded-xl transition-all ${product.isActive ? "border-border" : "border-border opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${demandColors[product.demand]}`}>
                        {product.demand.charAt(0).toUpperCase() + product.demand.slice(1)} Demand
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{product.category}</span>
                      <span className="text-muted-foreground">{product.quantity} {product.unit}</span>
                      <span className="text-muted-foreground">Margin: {product.margin}%</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{product.sellingMode}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${product.sourceStock === "saji" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        {product.sourceStock === "saji" ? "SAJI Network" : "Local"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-foreground">KES {product.price}</p>
                    <p className="text-[10px] text-muted-foreground">Max: KES {product.maxRetailPrice}</p>
                    <p className="text-[10px] text-muted-foreground">{product.sales} sold</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <button onClick={() => toggleProduct(product.id)} className="p-1 rounded hover:bg-muted transition-colors">
                        {product.isActive ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <button className="p-1 rounded hover:bg-muted transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteProduct(product.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <Card className="p-8 border border-border rounded-xl text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No orders yet</h3>
          <p className="text-sm text-muted-foreground">Orders from buyers will appear here once your products are live.</p>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="p-4 border border-border rounded-xl space-y-4">
          <h3 className="font-semibold text-foreground">Shop Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Shop Name</label>
              <Input value={shopDetails.name} onChange={(e) => setShopDetails(p => ({ ...p, name: e.target.value }))} className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Location</label>
              <Input value={shopDetails.location} onChange={(e) => setShopDetails(p => ({ ...p, location: e.target.value }))} className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
              <Input value={shopDetails.phone} onChange={(e) => setShopDetails(p => ({ ...p, phone: e.target.value }))} className="rounded-lg bg-card border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Category</label>
              <Input value={shopDetails.category} readOnly className="rounded-lg bg-card border-border" />
            </div>
          </div>
          <Button className="rounded-xl"><Check className="w-4 h-4 mr-1" />Save Changes</Button>
        </Card>
      )}

      {/* Add Product Dialog - matching the SAJI design */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto p-0" showCloseButton={false}>
          <div className="p-5 space-y-4">
            <h2 className="text-lg font-bold text-foreground">What are you posting today?</h2>

            {/* Post Type Toggle */}
            <div className="flex gap-2">
              {[
                { id: "product" as const, label: "Product", icon: Package },
                { id: "service" as const, label: "Service", icon: Tag },
                { id: "bulk" as const, label: "Bulk Supply", icon: Truck },
              ].map(t => (
                <button key={t.id} onClick={() => setPostType(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${postType === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Dynamic form that adapts as needed</p>

            {/* Upload area */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm text-muted-foreground font-medium">Upload or Scan</p>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Title</label>
              <Input value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Farm-Fresh Sukuma" className="rounded-lg bg-card border-border" />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Category</label>
              <select value={newProduct.category} onChange={(e) => setNewProduct(p => ({ ...p, category: e.target.value }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Cost Price (KES)</label>
                <Input type="number" value={newProduct.costPrice} onChange={(e) => setNewProduct(p => ({ ...p, costPrice: e.target.value }))} placeholder="0" className="rounded-lg bg-card border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Selling Price (KES)</label>
                <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="0" className="rounded-lg bg-card border-border" />
              </div>
            </div>

            {/* Margin Intelligence */}
            {Number(newProduct.price) > 0 && Number(newProduct.costPrice) > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Suggested: <span className="font-semibold text-foreground">KES {Math.round(Number(newProduct.costPrice) * 1.3)}</span> (30% markup)
                </p>
                <p className="text-xs text-muted-foreground">
                  Margin Intelligence: <span className="font-semibold text-foreground">{Math.round(((Number(newProduct.price) - Number(newProduct.costPrice)) / Number(newProduct.price)) * 100)}%</span>
                  {" "} Demand: <span className="font-semibold text-foreground">High</span>
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
                <Input type="number" value={newProduct.quantity} onChange={(e) => setNewProduct(p => ({ ...p, quantity: e.target.value }))} placeholder="0" className="rounded-lg bg-card border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Unit</label>
                <select value={newProduct.unit} onChange={(e) => setNewProduct(p => ({ ...p, unit: e.target.value }))} className="w-full h-9 rounded-lg bg-card border border-border text-sm text-foreground px-2">
                  <option>Pieces</option><option>Bundles</option><option>Bags</option><option>Meters</option><option>Kg</option><option>Litres</option>
                </select>
              </div>
            </div>

            {/* Selling Mode */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Selling Mode</label>
              <div className="flex gap-2">
                {(["retail", "wholesale", "both"] as const).map(m => (
                  <button key={m} onClick={() => setNewProduct(p => ({ ...p, sellingMode: m }))} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${newProduct.sellingMode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Stock */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Source Stock</label>
              <div className="flex gap-2">
                <button onClick={() => setNewProduct(p => ({ ...p, sourceStock: "saji" }))} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${newProduct.sourceStock === "saji" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  SAJI Wholesale Network
                </button>
                <button onClick={() => setNewProduct(p => ({ ...p, sourceStock: "local" }))} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${newProduct.sourceStock === "local" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  Local Distributors
                </button>
              </div>
              <button className="w-full mt-2 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" />Request Credit
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Description</label>
              <Textarea value={newProduct.description} onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Describe your product..." className="rounded-lg bg-card border-border min-h-[60px]" />
            </div>

            <Button onClick={addProduct} disabled={!newProduct.name.trim() || !newProduct.price} className="w-full py-4 text-sm font-bold rounded-xl">
              CONFIRM & GO LIVE
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">Protected payments - Escrow safety - Verified buyers</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
