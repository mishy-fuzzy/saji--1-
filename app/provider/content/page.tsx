"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Edit,
  Calendar,
  Search,
  Grid,
  List,
  Video,
  ImageIcon,
  Pin,
  Archive,
  Globe,
  Lock,
  Users,
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
import NextImage from "next/image";

type Post = {
  id: string;
  type: "image" | "video" | "carousel";
  thumbnail: string;
  caption: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  status: "published" | "draft" | "archived";
  visibility: "public" | "private" | "followers";
  isPinned: boolean;
  media: string[];
};

export default function ProviderContentPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft" | "archived"
  >("all");
  const [filterType, setFilterType] = useState<
    "all" | "image" | "video" | "carousel"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState<
    "public" | "followers" | "private"
  >("public");
  const [newPostType, setNewPostType] = useState<
    "image" | "video" | "carousel"
  >("image");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch("/api/provider/content", {
          cache: "no-store",
        });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        setPosts(
          rows.map((row: any) => ({
            id: String(row.id),
            type:
              row.type === "video" || row.type === "carousel"
                ? row.type
                : "image",
            thumbnail: String(row.thumbnail || "/placeholder.svg"),
            caption: String(row.caption || ""),
            createdAt: String(row.createdAt || new Date().toISOString()),
            views: Number(row.views || 0),
            likes: Number(row.likes || 0),
            comments: Number(row.comments || 0),
            shares: Number(row.shares || 0),
            status:
              row.status === "draft" || row.status === "archived"
                ? row.status
                : "published",
            visibility:
              row.visibility === "private" || row.visibility === "followers"
                ? row.visibility
                : "public",
            isPinned: Boolean(row.isPinned),
            media: Array.isArray(row.media)
              ? row.media
                  .map((item: unknown) => String(item || ""))
                  .filter(Boolean)
              : [],
          })),
        );
      } catch {
        setPosts([]);
      }
    };

    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => filterStatus === "all" || post.status === filterStatus)
      .filter((post) => filterType === "all" || post.type === filterType)
      .filter((post) =>
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [posts, filterStatus, filterType, searchQuery]);

  const totals = {
    views: posts.reduce((sum, post) => sum + post.views, 0),
    likes: posts.reduce((sum, post) => sum + post.likes, 0),
    comments: posts.reduce((sum, post) => sum + post.comments, 0),
    shares: posts.reduce((sum, post) => sum + post.shares, 0),
  };

  const sortedPosts = useMemo(() => {
    const rows = [...filteredPosts];
    rows.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows;
  }, [filteredPosts]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `/api/provider/content/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(payload?.error || "Failed to delete post");

      setPosts((prev) => prev.filter((post) => post.id !== id));
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post");
    }
  };

  const patchPost = async (id: string, data: Record<string, unknown>) => {
    const response = await fetch(
      `/api/provider/content/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    const payload = await response.json();
    if (!response.ok || !payload?.ok)
      throw new Error(payload?.error || "Failed to update post");
  };

  const handleTogglePin = async (id: string) => {
    const current = posts.find((post) => post.id === id);
    if (!current) return;
    try {
      await patchPost(id, { isPinned: !current.isPinned });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, isPinned: !post.isPinned } : post,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update post");
    }
  };

  const handleArchive = async (id: string) => {
    const current = posts.find((post) => post.id === id);
    if (!current) return;
    const nextStatus = current.status === "archived" ? "published" : "archived";
    try {
      await patchPost(id, { status: nextStatus });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, status: nextStatus } : post,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update post");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostCaption.trim()) return;

    const mediaByType =
      newPostType === "video"
        ? ["https://samplelib.com/lib/preview/mp4/sample-5s.mp4"]
        : [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
          ];

    try {
      if (editingPostId) {
        await patchPost(editingPostId, {
          type: newPostType,
          caption: newPostCaption,
          visibility: newPostVisibility,
          media: mediaByType,
          thumbnail:
            newPostType === "video"
              ? "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
              : mediaByType[0],
        });

        setPosts((prev) =>
          prev.map((post) =>
            post.id === editingPostId
              ? {
                  ...post,
                  type: newPostType,
                  caption: newPostCaption,
                  visibility: newPostVisibility,
                  media: mediaByType,
                  thumbnail:
                    newPostType === "video"
                      ? "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
                      : mediaByType[0],
                }
              : post,
          ),
        );
      } else {
        const response = await fetch("/api/provider/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newPostType,
            caption: newPostCaption,
            visibility: newPostVisibility,
            media: mediaByType,
            thumbnail:
              newPostType === "video"
                ? "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
                : mediaByType[0],
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.data?.id) {
          throw new Error(payload?.error || "Failed to create post");
        }

        setPosts((prev) => [
          {
            id: String(payload.data.id),
            type: newPostType,
            thumbnail:
              newPostType === "video"
                ? "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop"
                : mediaByType[0],
            caption: newPostCaption,
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            status: "published",
            visibility: newPostVisibility,
            isPinned: false,
            media: mediaByType,
          },
          ...prev,
        ]);
      }

      setShowCreatePost(false);
      setEditingPostId(null);
      setNewPostCaption("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save post");
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setNewPostCaption(post.caption);
    setNewPostType(post.type);
    setNewPostVisibility(post.visibility);
    setShowCreatePost(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
  };

  const getVisibilityIcon = (visibility: string) => {
    if (visibility === "private") return <Lock className="w-3 h-3" />;
    if (visibility === "followers") return <Users className="w-3 h-3" />;
    return <Globe className="w-3 h-3" />;
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            My Content
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your posts
          </p>
        </div>
        <Button
          onClick={() => setShowCreatePost(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Create New Post
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-2xl font-bold">{formatNumber(totals.views)}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{formatNumber(totals.likes)}</p>
          <p className="text-xs text-muted-foreground">Total Likes</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{formatNumber(totals.comments)}</p>
          <p className="text-xs text-muted-foreground">Total Comments</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{formatNumber(totals.shares)}</p>
          <p className="text-xs text-muted-foreground">Total Shares</p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as typeof filterStatus)
              }
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as typeof filterType)
              }
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="carousel">Carousels</option>
            </select>
            <div className="flex border border-input rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {sortedPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No posts found
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first post to start tracking performance
          </p>
          <Button onClick={() => setShowCreatePost(true)}>
            Create New Post
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden group">
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <NextImage
                  src={post.thumbnail || "/placeholder.svg"}
                  alt={post.caption}
                  fill
                  className="object-cover"
                />
                {post.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {post.caption}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.createdAt)}
                  {getVisibilityIcon(post.visibility)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(post.likes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTogglePin(post.id)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${post.isPinned ? "text-yellow-500" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => handleArchive(post.id)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setPostToDelete(post.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <NextImage
                    src={post.thumbnail || "/placeholder.svg"}
                    alt={post.caption}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      {post.shares}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                    {getVisibilityIcon(post.visibility)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-xl">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>Post Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <NextImage
                    src={selectedPost.thumbnail || "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm">{selectedPost.caption}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => postToDelete && handleDelete(postToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPostId ? "Edit Post" : "Create New Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Post Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["image", "video", "carousel"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setNewPostType(type as "image" | "video" | "carousel")
                    }
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      newPostType === type
                        ? "border-primary bg-primary/10"
                        : "border-input hover:border-primary"
                    }`}
                  >
                    {type === "image" && (
                      <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                    )}
                    {type === "video" && (
                      <Video className="w-5 h-5 mx-auto mb-1" />
                    )}
                    {type === "carousel" && (
                      <Grid className="w-5 h-5 mx-auto mb-1" />
                    )}
                    <span className="text-xs font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Caption
              </label>
              <textarea
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                className="w-full min-h-24 p-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Visibility
              </label>
              <select
                value={newPostVisibility}
                onChange={(e) =>
                  setNewPostVisibility(
                    e.target.value as "public" | "followers" | "private",
                  )
                }
                className="w-full p-3 border border-input rounded-lg bg-background"
              >
                <option value="public">Public</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowCreatePost(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreatePost}
                disabled={!newPostCaption.trim()}
              >
                {editingPostId ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
