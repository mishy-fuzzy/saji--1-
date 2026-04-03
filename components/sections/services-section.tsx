"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowRight } from "lucide-react"
import { useLocalization } from "@/lib/hooks/useLocalization"

const categoryColors = {
  skilled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  "semi-skilled": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  "non-skilled": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
}

export function ServicesSection() {
  const { t } = useLocalization()

  return (
    <section id="services" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Popular Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse our most requested services with verified providers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[].map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48 bg-muted">
                <img
                  src={service.image || "/placeholder.svg"}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge
                  className={`absolute top-4 right-4 ${categoryColors[service.category as keyof typeof categoryColors]}`}
                >
                  {service.category}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-foreground mb-1">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.provider}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                  <span className="font-semibold text-foreground">{service.rating}</span>
                  <span className="text-sm text-muted-foreground">({service.reviews} reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-auto mb-4">
                  <span className="text-2xl font-bold text-primary">KES {service.basePrice.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Base price</span>
                </div>

                {/* CTA Button */}
                <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all duration-300 group-hover:gap-3">
                  {t("service.viewDetails")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
