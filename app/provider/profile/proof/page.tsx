"use client";

import { ArrowLeft, Upload, Trash2, Edit2, Eye, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProofItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  image: string;
  description: string;
};

export default function ProofOfWorkPage() {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingProof, setEditingProof] = useState<ProofItem | null>(null);
  const [previewProof, setPreviewProof] = useState<ProofItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProofs = async () => {
    try {
      const response = await fetch("/api/provider/content", {
        cache: "no-store",
      });
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      const mapped: ProofItem[] = rows.map(
        (row: {
          id: string;
          caption?: string;
          createdAt?: string;
          status?: string;
          thumbnail?: string;
          media?: string[];
        }) => ({
          id: String(row.id),
          title: String(row.caption || "Untitled work"),
          description: String(row.caption || ""),
          date: row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "-",
          status:
            String(row.status || "published").toLowerCase() === "published"
              ? "approved"
              : "pending",
          image: String(
            row.thumbnail ||
              (Array.isArray(row.media) && row.media[0]) ||
              "/placeholder.svg",
          ),
        }),
      );

      setProofs(mapped);
    } catch {
      setProofs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProofs();
  }, []);

  const handleAddWork = () => {
    setEditingProof(null);
    setNewTitle("");
    setNewDescription("");
    setNewImage("");
    setShowUpload(true);
  };

  const handleEditWork = (proof: ProofItem) => {
    setEditingProof(proof);
    setNewTitle(proof.title);
    setNewDescription(proof.description);
    setNewImage(proof.image);
    setShowUpload(true);
  };

  const handleSaveWork = async () => {
    if (!newTitle.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSaving(true);

    try {
      if (editingProof) {
        const response = await fetch(
          `/api/provider/content/${encodeURIComponent(editingProof.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              caption: newTitle,
              thumbnail: newImage || "/placeholder.svg",
              media: newImage ? [newImage] : [],
              status: "published",
            }),
          },
        );

        if (!response.ok) {
          alert("Failed to update work");
          return;
        }
      } else {
        const response = await fetch("/api/provider/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: newTitle,
            type: "image",
            media: newImage ? [newImage] : [],
            thumbnail: newImage || "/placeholder.svg",
            visibility: "public",
          }),
        });

        if (!response.ok) {
          alert("Failed to upload work");
          return;
        }
      }

      setShowUpload(false);
      setNewImage("");
      await loadProofs();
      alert(
        editingProof
          ? "Work updated successfully!"
          : "Work uploaded successfully!",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = (proof: ProofItem) => {
    setPreviewProof(proof);
    setShowPreview(true);
  };

  const removeProof = async (id: string) => {
    if (confirm("Are you sure you want to delete this work?")) {
      const response = await fetch(
        `/api/provider/content/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setProofs(proofs.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete work");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/provider/profile"
              className="lg:hidden hover:bg-blue-500/50 p-2 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Proof of Work</h1>
          </div>
          <Button
            onClick={handleAddWork}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Work
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-600 dark:text-gray-400">
            Loading proof of work...
          </div>
        ) : proofs.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              No Work Added Yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Upload samples of your work to showcase your skills
            </p>
            <Button
              onClick={handleAddWork}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Your First Work
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={proof.image || "/placeholder.svg"}
                    alt={proof.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <button
                      onClick={() => handlePreview(proof)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Eye className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                    {proof.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {proof.date}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {proof.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        proof.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {proof.status === "approved"
                        ? "✓ Approved"
                        : "Pending Review"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditWork(proof)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => removeProof(proof.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProof ? "Edit Work" : "Add New Work"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingProof && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Choose Image
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Click to upload or drag and drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewImage(String(reader.result || ""));
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-transparent"
                >
                  Choose Files
                </Button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Kitchen Renovation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your work..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL (optional)
              </label>
              <Input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUpload(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveWork}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : editingProof ? "Update" : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewProof?.title}</DialogTitle>
          </DialogHeader>

          {previewProof && (
            <div className="space-y-4">
              <img
                src={previewProof.image || "/placeholder.svg"}
                alt={previewProof.title}
                className="w-full rounded-lg"
              />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </p>
                <p className="text-gray-900 dark:text-white">
                  {previewProof.description}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {previewProof.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {previewProof.status}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowPreview(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
