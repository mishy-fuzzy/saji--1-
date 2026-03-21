"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  const { t } = useLocalization()

  return (
    <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Trusted by thousands • Available in your area</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
          Connect with Trusted Service Providers
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
          Find vetted professionals for any service. Secure payments, verified ratings, and peace of mind.
        </p>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-12">
          <Input
            placeholder={t("home.search")}
            className="flex-1 h-14 text-base rounded-xl border-2 border-border focus-visible:border-primary"
          />
          <Button className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-semibold flex items-center gap-2 md:w-auto w-full">
            {t("common.search")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Button size="lg" className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
            {t("home.browseServices")}
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl border-2 bg-transparent">
            {t("home.becomeProvider")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-border/50">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-sm md:text-base text-muted-foreground">Service Providers</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50K+</div>
            <p className="text-sm md:text-base text-muted-foreground">Jobs Completed</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4.8★</div>
            <p className="text-sm md:text-base text-muted-foreground">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  )
}
