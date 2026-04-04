"use client"

import { AlertCircle } from "lucide-react"

interface ServiceDetailProps {
  serviceId: string
}

export function ServiceDetail({ serviceId }: ServiceDetailProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Service Details Unavailable</h2>
        <p className="text-muted-foreground">
          Service details are loaded from the database. Please browse our available services or contact support for more information.
        </p>
      </div>
    </div>
  )
}
