"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Star, Search, MapPin, Filter } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface Service {
  id: number
  name: string
  category: "skilled" | "semi-skilled" | "non-skilled"
  provider: string
  rating: number
  reviews: number
  basePrice: number
  location: string
  image: string
  verified: boolean
  description: string
}

const mockServices: Service[] = [
  {
    id: 1,
    name: "Professional Electrical Installation",
    category: "skilled",
    provider: "John Electrical Services",
    rating: 4.9,
    reviews: 128,
    basePrice: 5000,
    location: "Nairobi",
    image: "/electrical-installation.png",
    verified: true,
    description: "Expert electrical installation for homes and offices",
  },
  {
    id: 2,
    name: "Emergency Plumbing Repairs",
    category: "semi-skilled",
    provider: "Pipe Master",
    rating: 4.8,
    reviews: 95,
    basePrice: 2000,
    location: "Westlands",
    image: "/plumbing-repair.jpg",
    verified: true,
    description: "Quick and reliable plumbing solutions",
  },
  {
    id: 3,
    name: "Residential House Cleaning",
    category: "non-skilled",
    provider: "Clean Sweep Team",
    rating: 4.7,
    reviews: 203,
    basePrice: 1500,
    location: "Kiambu",
    image: "/home-cleaning-tools.png",
    verified: true,
    description: "Thorough and professional cleaning services",
  },
  {
    id: 4,
    name: "Custom Software Development",
    category: "skilled",
    provider: "Dev Labs",
    rating: 5.0,
    reviews: 67,
    basePrice: 50000,
    location: "Nairobi CBD",
    image: "/software-development-collaboration.png",
    verified: true,
    description: "Bespoke software solutions for your business",
  },
  {
    id: 5,
    name: "Appliance Repair Service",
    category: "semi-skilled",
    provider: "Tech Repairs",
    rating: 4.6,
    reviews: 156,
    basePrice: 3000,
    location: "Parklands",
    image: "/appliance-repair-scene.png",
    verified: true,
    description: "Professional appliance repair and maintenance",
  },
  {
    id: 6,
    name: "House Moving & Transport",
    category: "non-skilled",
    provider: "Move Easy",
    rating: 4.8,
    reviews: 234,
    basePrice: 8000,
    location: "Nairobi",
    image: "/house-moving.jpg",
    verified: true,
    description: "Professional house moving and relocation",
  },
]

const categoryColors = {
  skilled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  "semi-skilled": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  "non-skilled": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
}

export function ServiceBrowser() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [sortBy, setSortBy] = useState("rating")
  const [filteredServices, setFilteredServices] = useState(mockServices)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterServices(query, selectedCategory, priceRange, sortBy)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    filterServices(searchQuery, category, priceRange, sortBy)
  }

  const handlePriceChange = (range: number[]) => {
    setPriceRange(range)
    filterServices(searchQuery, selectedCategory, range, sortBy)
  }

  const handleSort = (sort: string) => {
    setSortBy(sort)
    filterServices(searchQuery, selectedCategory, priceRange, sort)
  }

  const filterServices = (query: string, category: string, prices: number[], sort: string) => {
    let filtered = mockServices.filter((service) => {
      const matchesQuery =
        query === "" ||
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.provider.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())

      const matchesCategory = category === "all" || service.category === category
      const matchesPrice = service.basePrice >= prices[0] && service.basePrice <= prices[1]

      return matchesQuery && matchesCategory && matchesPrice
    })

    // Apply sorting
    if (sort === "price-low") {
      filtered = filtered.sort((a, b) => a.basePrice - b.basePrice)
    } else if (sort === "price-high") {
      filtered = filtered.sort((a, b) => b.basePrice - a.basePrice)
    } else if (sort === "rating") {
      filtered = filtered.sort((a, b) => b.rating - a.rating)
    } else if (sort === "reviews") {
      filtered = filtered.sort((a, b) => b.reviews - a.reviews)
    }

    setFilteredServices(filtered)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Browse Services</h1>
        <p className="text-muted-foreground">Find and book verified service providers</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search services, providers, or keywords..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 h-12 rounded-xl border-2 border-border focus-visible:border-primary text-base"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Filters</h3>

            {/* Category Filter */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-foreground">Service Type</label>
              <div className="space-y-2">
                {["all", "skilled", "semi-skilled", "non-skilled"].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={selectedCategory === cat}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">{cat === "all" ? "All Services" : cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-foreground">Price Range</label>
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                min={0}
                max={50000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>KES {priceRange[0].toLocaleString()}</span>
                <span>KES {priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sort by</label>
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="border-2 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Results Count */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredServices.length}</span> results found
            </p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2 rounded-lg border-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="mt-6 space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Service Type</label>
                    <div className="space-y-2">
                      {["all", "skilled", "semi-skilled", "non-skilled"].map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={selectedCategory === cat}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm text-foreground capitalize">
                            {cat === "all" ? "All Services" : cat}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Price Range</label>
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceChange}
                      min={0}
                      max={50000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>KES {priceRange[0].toLocaleString()}</span>
                      <span>KES {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Sort by</label>
                    <Select value={sortBy} onValueChange={handleSort}>
                      <SelectTrigger className="border-2 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="reviews">Most Reviews</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Service Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden h-48 bg-muted">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className={categoryColors[service.category]}>{service.category}</Badge>
                      {service.verified && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">{service.name}</h3>

                    {/* Provider Info */}
                    <p className="text-sm text-muted-foreground mb-3">{service.provider}</p>

                    {/* Location */}
                    <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {service.location}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-4 h-4 fill-secondary text-secondary" />
                      <span className="font-semibold text-foreground text-sm">{service.rating}</span>
                      <span className="text-xs text-muted-foreground">({service.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-auto mb-4">
                      <span className="text-2xl font-bold text-primary">KES {service.basePrice.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">base price</span>
                    </div>

                    {/* CTA Button */}
                    <Button className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-semibold">
                      View & Book
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No services found matching your criteria.</p>
              <Button
                variant="outline"
                className="border-2 bg-transparent rounded-lg"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setPriceRange([0, 50000])
                  filterServices("", "all", [0, 50000], "rating")
                }}
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
