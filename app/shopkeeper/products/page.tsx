"use client";

import React from "react";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  Grid,
  List,
  X,
  Upload,
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
import Link from "next/link";
import Image from "next/image";

export default function ShopkeeperProductsPage() {
  const { user } = useAuthContext();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: "",
  });
  const categories = [
    "all",
    "Electronics",
    "Appliances",
    "Hardware",
    "Furniture",
  ];
  const [productsList, setProductsList] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const loadProducts = async () => {
      try {
        const response = await fetch(
          `/api/shopkeeper/products?providerId=${encodeURIComponent(user.id)}`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();
        setProductsList(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setProductsList([]);
      }
    };

    loadProducts();
    const intervalId = window.setInterval(loadProducts, 20000);
    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const filteredProducts = productsList.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNew: boolean = false,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        if (isNew) {
          setNewProductForm({ ...newProductForm, image: result });
        } else {
          setEditForm({ ...editForm, image: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || "",
      image: product.image,
    });
    setImagePreview(product.image);
    setShowEditModal(true);
  };

  const handleSaveProduct = () => {
    if (!editForm.name || !editForm.price || !editForm.stock) {
      alert("Please fill in all required fields");
      return;
    }

    (async () => {
      try {
        const response = await fetch(
          `/api/shopkeeper/products/${editingProduct.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: editForm.name,
              price: parseInt(editForm.price),
              stock: parseInt(editForm.stock),
              category: editForm.category,
              description: editForm.description,
              image: editForm.image,
            }),
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to update product");

        setProductsList(
          productsList.map((p) =>
            String(p.id) === String(editingProduct.id)
              ? {
                  ...p,
                  name: editForm.name,
                  price: parseInt(editForm.price),
                  stock: parseInt(editForm.stock),
                  category: editForm.category,
                  description: editForm.description,
                  image: editForm.image,
                }
              : p,
          ),
        );

        setShowEditModal(false);
        setImagePreview("");
        alert("Product updated successfully!");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to update product",
        );
      }
    })();
  };

  const handleAddProduct = () => {
    if (
      !newProductForm.name ||
      !newProductForm.price ||
      !newProductForm.stock ||
      !newProductForm.image
    ) {
      alert("Please fill in all required fields including product image");
      return;
    }

    (async () => {
      try {
        if (!user?.id) throw new Error("Please login as shopkeeper");
        const response = await fetch("/api/shopkeeper/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: user.id,
            name: newProductForm.name,
            price: parseInt(newProductForm.price),
            stock: parseInt(newProductForm.stock),
            category: newProductForm.category,
            description: newProductForm.description,
            image: newProductForm.image,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.data)
          throw new Error(payload?.error || "Failed to add product");

        const row = payload.data;
        setProductsList([
          {
            id: row.id,
            name: row.name,
            price: Number(row.basePrice || 0),
            stock: parseInt(newProductForm.stock),
            category: row.category,
            description: row.description || "",
            image: row.image || "/placeholder.svg",
            sold: 0,
            views: 0,
            status: "active",
          },
          ...productsList,
        ]);

        setShowAddModal(false);
        setImagePreview("");
        setNewProductForm({
          name: "",
          price: "",
          stock: "",
          category: "",
          description: "",
          image: "",
        });
        alert("Product added successfully!");
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to add product");
      }
    })();
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      (async () => {
        try {
          const response = await fetch(
            `/api/shopkeeper/products/${productId}`,
            { method: "DELETE" },
          );
          const payload = await response.json();
          if (!response.ok || !payload?.ok)
            throw new Error(payload?.error || "Failed to delete product");
          setProductsList(
            productsList.filter((p) => String(p.id) !== String(productId)),
          );
          alert("Product deleted successfully!");
        } catch (error) {
          alert(
            error instanceof Error ? error.message : "Failed to delete product",
          );
        }
      })();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "low_stock":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "out_of_stock":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-800 dark:to-orange-800 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">My Products</h1>
              <p className="text-amber-100 text-sm">
                Manage your complete product catalog
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-amber-700 hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{productsList.length}</p>
              <p className="text-xs text-amber-100">Total Products</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">
                {productsList.filter((p) => p.status === "active").length}
              </p>
              <p className="text-xs text-amber-100">Active</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">
                {productsList.filter((p) => p.stock < 5).length}
              </p>
              <p className="text-xs text-amber-100">Low Stock</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">
                {productsList.reduce((acc, p) => acc + p.sold, 0)}
              </p>
              <p className="text-xs text-amber-100">Total Sold</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        {/* Filters */}
        <Card className="p-4 mb-6 shadow-lg border-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
              <div className="flex border border-input rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-amber-600 text-white" : "bg-background hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-amber-600 text-white" : "bg-background hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all border-0"
              >
                <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-square">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                  />
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(product.status)}`}
                  >
                    {getStatusText(product.status)}
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                    {product.sold} sold
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(product.price)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${product.stock > 5 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {product.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {product.sold} sold
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 bg-transparent"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-transparent text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-4 hover:shadow-lg transition-all border-0"
              >
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.description}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(product.status)}`}
                      >
                        {getStatusText(product.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="font-bold text-amber-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Stock: {product.stock}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Sold: {product.sold}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Views: {product.views}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                        className="bg-transparent"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-transparent text-red-600"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No products found
            </p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  id="new-image-input"
                />
                <label htmlFor="new-image-input" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="relative w-full h-48 mb-3">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <Input
                value={newProductForm.name}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (KES) *
                </label>
                <Input
                  type="number"
                  value={newProductForm.price}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Quantity *
                </label>
                <Input
                  type="number"
                  value={newProductForm.stock}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      stock: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newProductForm.category}
                onChange={(e) =>
                  setNewProductForm({
                    ...newProductForm,
                    category: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Appliances">Appliances</option>
                <option value="Hardware">Hardware</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={newProductForm.description}
                onChange={(e) =>
                  setNewProductForm({
                    ...newProductForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your product"
                className="w-full px-3 py-2 border border-input rounded-md resize-none h-24 bg-background"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setImagePreview("");
                  setNewProductForm({
                    name: "",
                    price: "",
                    stock: "",
                    category: "",
                    description: "",
                    image: "",
                  });
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  id="edit-image-input"
                />
                <label htmlFor="edit-image-input" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="relative w-full h-48 mb-3">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to change image
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name
              </label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (KES)
                </label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Quantity
                </label>
                <Input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stock: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Appliances">Appliances</option>
                <option value="Hardware">Hardware</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Describe your product"
                className="w-full px-3 py-2 border border-input rounded-md resize-none h-24 bg-background"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setImagePreview("");
                }}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
