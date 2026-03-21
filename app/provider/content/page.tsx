"use client"

import { useState } from "react"
import { 
  Eye, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, 
  TrendingUp, BarChart3, Calendar, Filter, Search, Grid, List,
  Play, ImageIcon, Video, ChevronDown, ArrowUpRight, ArrowDownRight,
  Pin, Archive, Globe, Lock, Users, Clock
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import NextImage from "next/image"

interface Post {
  id: string
  type: "image" | "video" | "carousel"
  thumbnail: string
  caption: string
  createdAt: string
  views: number
  viewsChange: number
  likes: number
  likesChange: number
  comments: number
  shares: number
  status: "published" | "draft" | "archived"
  visibility: "public" | "private" | "followers"
  isPinned: boolean
  media: string[]
}

export default function ProviderContentPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "archived">("all")
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "carousel">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostCaption, setNewPostCaption] = useState("")
  const [newPostVisibility, setNewPostVisibility] = useState<"public" | "followers" | "private">("public")
  const [newPostType, setNewPostType] = useState<"image" | "video" | "carousel">("image")

  // Mock data for posts
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      caption: "Just completed this amazing kitchen renovation! Modern design with premium finishes.",
      createdAt: "2026-01-20T10:30:00",
      views: 2450,
      viewsChange: 12,
      likes: 189,
      likesChange: 8,
      comments: 24,
      shares: 15,
      status: "published",
      visibility: "public",
      isPinned: true,
      media: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"
      ]
    },
    {
      id: "2",
      type: "video",
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      caption: "Watch how we transformed this bathroom in just 3 days! Full renovation timelapse.",
      createdAt: "2026-01-18T14:20:00",
      views: 5670,
      viewsChange: 25,
      likes: 342,
      likesChange: 15,
      comments: 56,
      shares: 89,
      status: "published",
      visibility: "public",
      isPinned: false,
      media: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"]
    },
    {
      id: "3",
      type: "carousel",
      thumbnail: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      caption: "Before and after: Living room makeover. Swipe to see the transformation!",
      createdAt: "2026-01-15T09:00:00",
      views: 1890,
      viewsChange: -5,
      likes: 156,
      likesChange: -2,
      comments: 18,
      shares: 12,
      status: "published",
      visibility: "followers",
      isPinned: false,
      media: [
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop"
      ]
    },
    {
      id: "4",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
      caption: "Electrical panel upgrade - safety first! Professional installation.",
      createdAt: "2026-01-10T16:45:00",
      views: 890,
      viewsChange: 3,
      likes: 67,
      likesChange: 1,
      comments: 8,
      shares: 4,
      status: "published",
      visibility: "public",
      isPinned: false,
      media: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop"]
    },
    {
      id: "5",
      type: "video",
      thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
      caption: "Draft: New construction project walkthrough",
      createdAt: "2026-01-22T08:00:00",
      views: 0,
      viewsChange: 0,
      likes: 0,
      likesChange: 0,
      comments: 0,
      shares: 0,
      status: "draft",
      visibility: "private",
      isPinned: false,
      media: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop"]
    },
    {
      id: "6",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      caption: "Archived: Old plumbing work showcase",
      createdAt: "2025-12-01T12:00:00",
      views: 450,
      viewsChange: 0,
      likes: 34,
      likesChange: 0,
      comments: 5,
      shares: 2,
      status: "archived",
      visibility: "private",
      isPinned: false,
      media: ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop"]
    }
  ])

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesStatus = filterStatus === "all" || post.status === filterStatus
    const matchesType = filterType === "all" || post.type === filterType
    const matchesSearch = post.caption.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  // Calculate totals
  const totals = {
    views: posts.reduce((sum, p) => sum + p.views, 0),
    likes: posts.reduce((sum, p) => sum + p.likes, 0),
    comments: posts.reduce((sum, p) => sum + p.comments, 0),
    shares: posts.reduce((sum, p) => sum + p.shares, 0)
  }

  const handleDelete = (id: string) => {
    setPosts(posts.filter(p => p.id !== id))
    setShowDeleteConfirm(false)
    setPostToDelete(null)
  }

  const handleTogglePin = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p))
  }

  const handleArchive = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status: p.status === "archived" ? "published" : "archived" } : p))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />
      case "carousel": return <Grid className="w-4 h-4" />
      default: return <ImageIcon className="w-4 h-4" />
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public": return <Globe className="w-3 h-3" />
      case "followers": return <Users className="w-3 h-3" />
      default: return <Lock className="w-3 h-3" />
    }
  }

  const handleCreatePost = () => {
    if (newPostCaption.trim()) {
      const newPost: Post = {
        id: (posts.length + 1).toString(),
        type: newPostType,
        thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
        caption: newPostCaption,
        createdAt: new Date().toISOString(),
        views: 0,
        viewsChange: 0,
        likes: 0,
        likesChange: 0,
        comments: 0,
        shares: 0,
        status: "published",
        visibility: newPostVisibility,
        isPinned: false,
        media: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"]
      }
      setPosts([newPost, ...posts])
      setShowCreatePost(false)
      setNewPostCaption("")
      alert("Post created successfully!")
    }
  }

  // Sort posts - pinned posts first
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1
    }
    return 0
  })

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Content</h1>
          <p className="text-muted-foreground mt-1">Manage and track your posts</p>
        </div>
        <Button 
          onClick={() => setShowCreatePost(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Create New Post
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totals.views)}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totals.likes)}</p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totals.comments)}</p>
              <p className="text-xs text-muted-foreground">Total Comments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totals.shares)}</p>
              <p className="text-xs text-muted-foreground">Total Shares</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>

            {/* Type Filter */}
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="carousel">Carousels</option>
            </select>

            {/* View Mode Toggle */}
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

      {/* Posts Grid/List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new post</p>
          <Button>Create New Post</Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden group">
              {/* Thumbnail */}
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
                
                {/* Type Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                  {getTypeIcon(post.type)}
                  <span className="capitalize">{post.type}</span>
                </div>

                {/* Pinned Badge */}
                {post.isPinned && (
                  <div className="absolute top-2 right-2 p-1.5 bg-yellow-500 rounded-full">
                    <Pin className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Status Badge */}
                {post.status !== "published" && (
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                    post.status === "draft" ? "bg-yellow-500 text-white" : "bg-gray-500 text-white"
                  }`}>
                    {post.status === "draft" ? "Draft" : "Archived"}
                  </div>
                )}

                {/* Play Button for Videos */}
                {post.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1 text-white">
                    <Eye className="w-5 h-5" />
                    <span className="font-semibold">{formatNumber(post.views)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">{formatNumber(post.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">{post.comments}</span>
                  </div>
                </div>
              </div>

              {/* Post Info */}
              <div className="p-4">
                <p className="text-sm text-foreground line-clamp-2 mb-2">{post.caption}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                    {getVisibilityIcon(post.visibility)}
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative group/menu">
                    <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <div className="absolute right-0 bottom-full mb-1 w-40 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                      <button 
                        onClick={() => setSelectedPost(post)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" /> View Analytics
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                        <Edit className="w-4 h-4" /> Edit Post
                      </button>
                      <button 
                        onClick={() => handleTogglePin(post.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Pin className="w-4 h-4" /> {post.isPinned ? "Unpin" : "Pin to Top"}
                      </button>
                      <button 
                        onClick={() => handleArchive(post.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Archive className="w-4 h-4" /> {post.status === "archived" ? "Restore" : "Archive"}
                      </button>
                      <button 
                        onClick={() => { setPostToDelete(post.id); setShowDeleteConfirm(true) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <Card key={post.id} className="p-4">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div 
                  className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <NextImage 
                    src={post.thumbnail || "/placeholder.svg"} 
                    alt={post.caption} 
                    fill 
                    className="object-cover"
                  />
                  {post.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {post.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        post.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        post.status === "draft" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(post.views)}</span>
                      {post.viewsChange !== 0 && (
                        <span className={`flex items-center text-xs ${post.viewsChange > 0 ? "text-green-500" : "text-red-500"}`}>
                          {post.viewsChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(post.viewsChange)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(post.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares}</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getTypeIcon(post.type)} {post.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getVisibilityIcon(post.visibility)} {post.visibility}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPost(post)}>
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setPostToDelete(post.id); setShowDeleteConfirm(true) }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Details / Analytics Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>Post Analytics</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <NextImage 
                      src={selectedPost.media[0] || "/placeholder.svg"} 
                      alt="" 
                      fill 
                      className="object-cover"
                    />
                    {selectedPost.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-gray-900 fill-gray-900 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{selectedPost.caption}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(selectedPost.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getVisibilityIcon(selectedPost.visibility)} {selectedPost.visibility}
                    </span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Performance</h3>
                  
                  {/* Views */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Views</span>
                      <span className={`flex items-center text-sm ${selectedPost.viewsChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {selectedPost.viewsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(selectedPost.viewsChange)}% from last week
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{formatNumber(selectedPost.views)}</p>
                  </div>

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                      <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{formatNumber(selectedPost.likes)}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <MessageCircle className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{selectedPost.comments}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                      <Share2 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{selectedPost.shares}</p>
                      <p className="text-xs text-muted-foreground">Shares</p>
                    </div>
                  </div>

                  {/* Engagement Rate */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Engagement Rate</span>
                      <span className="text-sm font-medium text-green-500">Good</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedPost.views > 0 ? ((selectedPost.likes + selectedPost.comments + selectedPost.shares) / selectedPost.views * 100).toFixed(1) : 0}%
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                        style={{ width: `${Math.min(((selectedPost.likes + selectedPost.comments + selectedPost.shares) / (selectedPost.views || 1) * 100) * 5, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleTogglePin(selectedPost.id)}>
                      <Pin className="w-4 h-4 mr-2" />
                      {selectedPost.isPinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 bg-transparent"
                      onClick={() => { setSelectedPost(null); setPostToDelete(selectedPost.id); setShowDeleteConfirm(true) }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone. This will permanently delete your post and all associated analytics data.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowDeleteConfirm(false)}>
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

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Post Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Post Type</label>
              <div className="grid grid-cols-3 gap-2">
                {["image", "video", "carousel"].map(type => (
                  <button
                    key={type}
                    onClick={() => setNewPostType(type as any)}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      newPostType === type 
                        ? "border-primary bg-primary/10" 
                        : "border-input hover:border-primary"
                    }`}
                  >
                    {type === "image" && <ImageIcon className="w-5 h-5 mx-auto mb-1" />}
                    {type === "video" && <Video className="w-5 h-5 mx-auto mb-1" />}
                    {type === "carousel" && <Grid className="w-5 h-5 mx-auto mb-1" />}
                    <span className="text-xs font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Caption</label>
              <textarea
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                className="w-full min-h-24 p-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Visibility</label>
              <select
                value={newPostVisibility}
                onChange={(e) => setNewPostVisibility(e.target.value as any)}
                className="w-full p-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="public">Public</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePost(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePost}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Create Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
