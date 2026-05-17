"use client";

import React from "react";

import { useCallback, useEffect, useState } from "react";
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

type ShopkeeperProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  sold: number;
  views: number;
  category: string;
  status: "active" | "low_stock" | "out_of_stock";
  description: string;
};

function normalizeProduct(row: any): ShopkeeperProduct {
  const stock = Math.max(0, Number(row?.stock || 0));
  const sold = Math.max(0, Number(row?.sold || 0));
  const views = Math.max(0, Number(row?.views || 0));
  const rawStatus = String(row?.status || "").toLowerCase();
  const status: ShopkeeperProduct["status"] =
    rawStatus === "out_of_stock"
      ? "out_of_stock"
      : rawStatus === "low_stock"
        ? "low_stock"
        : "active";

  return {
    id: String(row?.id || ""),
    name: String(row?.name || "Product"),
    image: String(row?.image || "/placeholder.svg"),
    price: Math.max(0, Number(row?.price || 0)),
    stock,
    sold,
    views,
    category: String(row?.category || "General"),
    status,
    description: String(row?.description || ""),
  };
}

export default function ShopkeeperProductsPage() {
  const { user } = useAuthContext();
  const viewMode: "grid" | "list" = "list";
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
    category: "General",
    description: "",
    image: "",
  });
  const [registerCategories, setRegisterCategories] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "General",
    description: "",
    image: "",
  });
  const [productsList, setProductsList] = useState<ShopkeeperProduct[]>([]);
  const categories = [
    "all",
    ...Array.from(
      new Set([
        ...registerCategories,
        ...productsList
          .map((product) => String(product?.category || "").trim())
          .filter(Boolean),
      ]),
    ),
  ];

  const loadProducts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/shopkeeper/products", {
        cache: "no-store",
      });
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setProductsList(rows.map((row: unknown) => normalizeProduct(row)));
    } catch {
      setProductsList([]);
    }
  }, [user?.id]);

  const loadRegisterOptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/shopkeeper/register-options", {
        cache: "no-store",
      });
      const payload = await response.json();
      setRegisterCategories(
        response.ok && payload?.ok && Array.isArray(payload?.data?.categories)
          ? payload.data.categories
              .map((item: unknown) => String(item).trim())
              .filter(Boolean)
          : [],
      );
    } catch {
      setRegisterCategories([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    loadProducts();
    loadRegisterOptions();

    const intervalId = window.setInterval(loadProducts, 20000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, loadProducts, loadRegisterOptions]);

  const filteredProducts = productsList.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
  const getStatusFromStock = (stock: number): ShopkeeperProduct["status"] => {
    if (stock <= 0) return "out_of_stock";
    if (stock <= 5) return "low_stock";
    return "active";
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNew: boolean = false,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Upload file to R2 via presign API and store returned public URL
      (async () => {
        try {
          const presignResp = await fetch('/api/r2/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          });

          const presignJson = await presignResp.json();
          if (!presignResp.ok || !presignJson?.uploadUrl) {
            throw new Error(presignJson?.message || 'Failed to get presigned url');
          }

          // PUT to R2 upload URL
          const putResp = await fetch(presignJson.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });

          if (!putResp.ok) {
            throw new Error('Failed to upload image to R2');
          }

          const publicUrl = presignJson.publicUrl || '';
          setImagePreview(publicUrl);
          if (isNew) {
            setNewProductForm({ ...newProductForm, image: publicUrl });
          } else {
            setEditForm({ ...editForm, image: publicUrl });
          }
        } catch (err) {
          console.error('image_upload_error', err);
          alert(err instanceof Error ? err.message : 'Image upload failed');
        }
      })();
    }
  };

  const handleEditProduct = (product: ShopkeeperProduct) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "General",
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
      const previousProducts = productsList;
      const nextCategory = editForm.category.trim() || "General";
      const nextStock = Number.parseInt(editForm.stock, 10);
      const nextPrice = Number.parseInt(editForm.price, 10);
      const optimisticProduct: ShopkeeperProduct = {
        id: String(editingProduct.id),
        name: editForm.name.trim(),
        image: editForm.image || editingProduct.image || "/placeholder.svg",
        price: Number.isFinite(nextPrice) ? nextPrice : 0,
        stock: Number.isFinite(nextStock) ? nextStock : 0,
        sold: Number(editingProduct.sold || 0),
        views: Number(editingProduct.views || 0),
        category: nextCategory,
        status: getStatusFromStock(Number.isFinite(nextStock) ? nextStock : 0),
        description: editForm.description || "",
      };

      setProductsList((prev) =>
        prev.map((item) =>
          item.id === optimisticProduct.id ? optimisticProduct : item,
        ),
      );
      setShowEditModal(false);
      setImagePreview("");
      setEditingProduct(null);

      try {
        if (!editingProduct?.id) throw new Error("Select a product first");

        const response = await fetch(
          `/api/shopkeeper/products/${editingProduct.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: optimisticProduct.name,
              price: optimisticProduct.price,
              stock: optimisticProduct.stock,
              category: optimisticProduct.category,
              description: optimisticProduct.description,
              image: optimisticProduct.image,
            }),
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to update product");

        if (!payload?.data?.id) {
          throw new Error("Missing updated product data");
        }

        const updatedProduct = normalizeProduct(payload.data);
        setProductsList((prev) =>
          prev.map((item) =>
            item.id === updatedProduct.id ? updatedProduct : item,
          ),
        );
        alert("Product updated successfully!");
        void loadProducts();
      } catch (error) {
        setProductsList(previousProducts);
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
      !newProductForm.stock
    ) {
      alert("Please fill in all required fields");
      return;
    }

    (async () => {
      const tempId = `temp-${Date.now()}`;
      const nextCategory = newProductForm.category.trim() || "General";
      const nextStock = Number.parseInt(newProductForm.stock, 10);
      const nextPrice = Number.parseInt(newProductForm.price, 10);
      const optimisticProduct: ShopkeeperProduct = {
        id: tempId,
        name: newProductForm.name.trim(),
        image: newProductForm.image || "/placeholder.svg",
        price: Number.isFinite(nextPrice) ? nextPrice : 0,
        stock: Number.isFinite(nextStock) ? nextStock : 0,
        sold: 0,
        views: 0,
        category: nextCategory,
        status: getStatusFromStock(Number.isFinite(nextStock) ? nextStock : 0),
        description: newProductForm.description || "",
      };

      setProductsList((prev) => [optimisticProduct, ...prev]);
      setShowAddModal(false);
      setImagePreview("");
      setNewProductForm({
        name: "",
        price: "",
        stock: "",
        category: "General",
        description: "",
        image: "",
      });

      try {
        const response = await fetch("/api/shopkeeper/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: optimisticProduct.name,
            price: optimisticProduct.price,
            stock: optimisticProduct.stock,
            category: optimisticProduct.category,
            description: optimisticProduct.description,
            image: optimisticProduct.image,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok)
          throw new Error(payload?.error || "Failed to add product");

        if (!payload?.data?.id) {
          throw new Error("Missing new product data");
        }

        const createdProduct = normalizeProduct(payload.data);
        setProductsList((prev) => [
          createdProduct,
          ...prev.filter((item) => item.id !== tempId),
        ]);
        alert("Product added successfully!");
        void loadProducts();
      } catch (error) {
        setProductsList((prev) => prev.filter((item) => item.id !== tempId));
        alert(error instanceof Error ? error.message : "Failed to add product");
      }
    })();
  };

  const handleDeleteProduct = (productId: string) => {
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
          await loadProducts();
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
                {productsList.filter((p) => p.stock <= 5).length}
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
          <div className="overflow-hidden rounded-xl border border-input bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Sold
                  </th>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Views
                  </th>
                  <th className="px-4 py-3 text-left font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {product.sold}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {product.views}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(product.status)}`}
                      >
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <div className="w-full h-48 mb-3 flex items-center justify-center bg-white/30 rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
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
              <Input value="General" readOnly />
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
                    category: "General",
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
                    <div className="w-full h-48 mb-3 flex items-center justify-center bg-white/30 rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
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
              <Input value="General" readOnly />
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
