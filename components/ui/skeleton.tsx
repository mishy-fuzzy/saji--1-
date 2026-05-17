"use client"
import React from 'react'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** number of lines for text skeletons */
  lines?: number
}

export function Skeleton({ className = '', style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`bg-muted/30 dark:bg-muted/20 animate-pulse ${className}`}
      style={style}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <div key={i} className="h-3 bg-muted/30 dark:bg-muted/20 rounded w-full" />
      ))}
    </div>
  )
}
export default Skeleton
