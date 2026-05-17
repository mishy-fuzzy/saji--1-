"use client"
import React from 'react'
import { Skeleton } from './skeleton'

export default function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden border-0 shadow-sm ${className}`}>
      <div className="relative overflow-hidden h-48 bg-muted">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2 rounded" />
        <Skeleton className="h-3 w-1/2 mb-3 rounded" />
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </div>
  )
}
