"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ArrowRight, BarChart3, Users, Zap, Lock, CheckCircle, 
  Menu, X, Briefcase, TrendingUp, Globe, Shield
} from "lucide-react"

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards and comprehensive reporting for data-driven decisions",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Multi-Role Management",
      description: "Seamlessly manage administrators, agents, and secretaries across your organization",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Lightning-fast transaction processing and dispute resolution",
      color: "from-blue-600 to-indigo-600"
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Bank-level encryption and comprehensive security measures for peace of mind",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Track KPIs, agent productivity, and financial metrics in real-time",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "Global Ready",
      description: "Multi-currency support and international payment processing capabilities",
      color: "from-pink-500 to-red-500"
    }
  ]

  const platforms = [
    {
      name: "Admin Portal",
      role: "Leadership",
      icon: "👨‍💼",
      description: "Full platform oversight, team management, and strategic analytics"
    },
    {
      name: "Agent Portal",
      role: "Operations",
      icon: "🎯",
      description: "Dispute resolution, performance tracking, and commission management"
    },
    {
      name: "Secretary Portal",
      role: "Finance",
      icon: "📊",
      description: "Invoice management, payment processing, and financial reconciliation"
    }
  ]

  const benefits = [
    { stat: "94%", desc: "Time Saved" },
    { stat: "3M+", desc: "Transactions/Month" },
    { stat: "99.9%", desc: "Uptime SLA" },
    { stat: "24/7", desc: "Support" }
  ]

  const useCases = [
    { title: "E-Commerce Disputes", icon: "🛍️" },
    { title: "Payment Processing", icon: "💳" },
    { title: "Vendor Management", icon: "🤝" },
    { title: "Financial Audit", icon: "📋" },
    { title: "Commission Tracking", icon: "💰" },
    { title: "Compliance Reports", icon: "✅" }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <Link href="/">
              <span className="font-bold text-lg text-foreground">SAJI </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
              <a href="#platforms" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Platforms</a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Benefits</a>
            </div>

            <div className="hidden md:flex gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-medium">
                  Get Access <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-3">
              <a href="#features" className="block py-2 text-foreground font-medium">Features</a>
              <a href="#platforms" className="block py-2 text-foreground font-medium">Platforms</a>
              <a href="#benefits" className="block py-2 text-foreground font-medium">Benefits</a>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">Sign In</Button>
                </Link>
                <Link href="/auth/signup" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-primary to-blue-600">Get Access</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 dark:from-primary/10 dark:via-transparent dark:to-blue-900/10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-primary/20 rounded-full text-primary dark:text-blue-300 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Enterprise Platform
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
                Platform for
                <span className="block bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent"> Enterprise Operations</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                Unified management system for administrators, agents, and finance teams. Streamline disputes, payments, and operations with advanced analytics and security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/team-login">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-semibold gap-2 w-full sm:w-auto">
                    Request Access <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-transparent font-semibold w-full sm:w-auto">
                  View Demo
                </Button>
              </div>

              {/* Trust Badge */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 border-2 border-background" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Trusted by leading organizations</p>
                  <p className="text-sm text-muted-foreground">Enterprise-grade security & compliance</p>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: "Dispute Management", value: "Real-time", icon: "⚡" },
                { label: "Payment Processing", value: "99.9% SLA", icon: "💳" },
                { label: "Performance Metrics", value: "Live Analytics", icon: "📊" },
                { label: "Security", value: "Enterprise Grade", icon: "🔒" }
              ].map((item, i) => (
                <Card key={i} className="p-6 bg-card/50 border border-border hover:border-primary/50 hover:shadow-lg transition-all backdrop-blur">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
                  {item.stat}
                </p>
                <p className="text-muted-foreground font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Powerful Features Built for You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage complex business operations efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Card key={i} className="p-8 border border-border hover:border-primary/50 hover:shadow-lg transition-all group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Three Powerful Portals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Role-based access for different teams within your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {platforms.map((platform, i) => (
              <Card key={i} className="p-8 border border-border hover:border-primary hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="text-5xl mb-4">{platform.icon}</div>
                  <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-4">
                    <p className="text-sm font-semibold text-primary">{platform.role}</p>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{platform.name}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{platform.description}</p>
                  
                  <div className="space-y-2">
                    {i === 0 && [
                      "Agent Management",
                      "Performance Analytics",
                      "System Configuration"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                    {i === 1 && [
                      "Dispute Resolution",
                      "Commission Tracking",
                      "Performance Metrics"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                    {i === 2 && [
                      "Invoice Management",
                      "Payment Processing",
                      "Reconciliation"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built for Every Use Case
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From startups to enterprises, handle any business scenario
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {useCases.map((useCase, i) => (
              <Card key={i} className="p-6 border border-border hover:border-primary hover:shadow-lg transition-all text-center group cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{useCase.icon}</div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{useCase.title}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/90 to-blue-600/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join leading organizations that trust our platform for mission-critical operations
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="font-semibold gap-2">
              Get Started Today <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-foreground">Enterprise Hub</span>
              </div>
              <p className="text-sm text-muted-foreground">Enterprise platform for modern operations</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Product</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">Features</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Security</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Pricing</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Company</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">About</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Blog</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Contact</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Legal</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="hover:text-foreground cursor-pointer transition-colors">Privacy</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Terms</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Compliance</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Enterprise Hub. All rights reserved. | Enterprise-grade platform for modern operations.</p>
          </div>
        </div>
      </footer> */}
    </div>
  )
}
