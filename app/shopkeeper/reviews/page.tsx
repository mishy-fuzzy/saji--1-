"use client"

import { useEffect, useState } from "react"
import { 
  Star, Search, Filter, MessageSquare, ThumbsUp, ThumbsDown, 
  Clock, CheckCircle2, Flag, ChevronDown, TrendingUp, BarChart3
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

type Review = {
  id: number
  customer: string
  avatar: string
  product: string
  rating: number
  text: string
  date: string
  helpful: number
  replied: boolean
  reply: string
  replyDate: string
}

export default function ShopkeeperReviewsPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch("/api/shopkeeper/reviews", { cache: "no-store" })
        const payload = await response.json()
        const rows = Array.isArray(payload?.data?.reviews) ? payload.data.reviews : []
        setReviews(
          rows.map((row: any) => ({
            id: Number(row?.id || 0),
            customer: String(row?.customer || "Customer"),
            avatar: String(row?.avatar || "/placeholder.svg"),
            product: String(row?.product || "Service"),
            rating: Number(row?.rating || 0),
            text: String(row?.text || ""),
            date: String(row?.date || ""),
            helpful: Number(row?.helpful || 0),
            replied: Boolean(row?.replied),
            reply: String(row?.reply || ""),
            replyDate: String(row?.replyDate || ""),
          })),
        )
      } catch {
        setReviews([])
      }
    }

    loadReviews()
  }, [])

  const ratingFilters = [
    { key: "all", label: "All Reviews" },
    { key: "5", label: "5 Stars" },
    { key: "4", label: "4 Stars" },
    { key: "3", label: "3 Stars" },
    { key: "2", label: "2 Stars" },
    { key: "1", label: "1 Star" },
    { key: "unreplied", label: "Needs Reply" },
  ]

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.text.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeFilter === "all") return matchesSearch
    if (activeFilter === "unreplied") return matchesSearch && !review.replied
    return matchesSearch && review.rating === parseInt(activeFilter)
  })

  const totalReviews = reviews.length
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0"
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: totalReviews > 0 ? Math.round((reviews.filter(r => r.rating === star).length / totalReviews) * 100) : 0
  }))
  const unrepliedCount = reviews.filter(r => !r.replied).length

  const handleReply = () => {
    if (!replyText.trim() || !selectedReview) return
    setReviews(reviews.map(r =>
      r.id === selectedReview.id
        ? { ...r, replied: true, reply: replyText, replyDate: "Just now" }
        : r
    ))
    setShowReplyModal(false)
    setReplyText("")
    setSelectedReview(null)
  }

  const renderStars = (rating: number, size: string = "w-4 h-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and respond to customer feedback</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Rating Summary Card */}
          <Card className="p-5 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
                {renderStars(Math.round(parseFloat(avgRating)), "w-4 h-4")}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{totalReviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingDistribution.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-3">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5 border-0 shadow-sm flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Response Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalReviews > 0 ? Math.round(((totalReviews - unrepliedCount) / totalReviews) * 100) : 0}%
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Avg Reply Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reviews.some((r) => r.replied) ? "<24h" : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          {/* Action Card */}
          <Card className="p-5 border-0 shadow-sm bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <MessageSquare className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">{unrepliedCount} reviews need a reply</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Responding quickly builds trust and increases sales
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-xs h-8"
                  onClick={() => setActiveFilter("unreplied")}
                >
                  Reply to Reviews
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 mb-4 border-0 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reviews by customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {ratingFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter.key
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {filter.label}
                  {filter.key === "unreplied" && unrepliedCount > 0 && (
                    <span className={`ml-1 px-1 py-0.5 rounded text-[10px] ${
                      activeFilter === filter.key ? "bg-white/20" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                    }`}>
                      {unrepliedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-3">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-4 lg:p-5 border-0 shadow-sm">
                {/* Review Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Image
                    src={review.avatar}
                    alt={review.customer}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{review.customer}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.product}</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, "w-3.5 h-3.5")}
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{review.rating}.0</span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{review.text}</p>

                {/* Review Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                      <Flag className="w-3.5 h-3.5" />
                      Report
                    </button>
                  </div>
                  {!review.replied && (
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-xs h-7 gap-1"
                      onClick={() => {
                        setSelectedReview(review)
                        setReplyText("")
                        setShowReplyModal(true)
                      }}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Reply
                    </Button>
                  )}
                </div>

                {/* Reply Section */}
                {review.replied && review.reply && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-amber-300 dark:border-amber-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                        S
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">SAJI Shop</span>
                      <span className="text-[10px] text-gray-400">{review.replyDate}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.reply}</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 border-0 shadow-sm text-center">
              <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No reviews found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </Card>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 py-2">
              {/* Original Review Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Image
                    src={selectedReview.avatar}
                    alt={selectedReview.customer}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReview.customer}</p>
                    {renderStars(selectedReview.rating, "w-3 h-3")}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{selectedReview.text}</p>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Your Reply</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the customer, address their feedback, and be professional..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-gray-400 mt-1">{replyText.length}/500 characters</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Personalize your response, acknowledge their feedback, and offer solutions if there are issues.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowReplyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handleReply}
                  disabled={replyText.length < 10}
                >
                  Post Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
