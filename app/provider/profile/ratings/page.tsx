"use client"

import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function RatingsPage() {
  const [ratings] = useState([
    { id: 1, customer: "Sarah K.", rating: 5, comment: "Excellent work! Very professional.", date: "2024-02-15" },
    { id: 2, customer: "James M.", rating: 4.5, comment: "Great service, very punctual.", date: "2024-02-10" },
    { id: 3, customer: "Maria R.", rating: 5, comment: "Perfect! Would hire again.", date: "2024-02-05" },
  ])

  const avgRating = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Star Ratings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
        {/* Average Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Based on {ratings.length} reviews</p>
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          {ratings.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900 dark:text-white">{review.customer}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{review.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
