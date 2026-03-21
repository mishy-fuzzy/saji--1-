"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Edit, Camera, Star, Award, TrendingUp, MapPin, Phone, Mail, Globe, Award as AwardIcon,
  FileText, Calendar, CheckCircle2, AlertCircle
} from "lucide-react"
import Image from "next/image"

export default function ShopkeeperProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "Hotpoint Kenya",
    email: "shop@hotpointkenya.com",
    phone: "+254712345678",
    location: "Nairobi, Kenya",
    website: "www.hotpointkenya.com",
    bio: "Leading supplier of quality home appliances and electronics",
    avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
    joinDate: "Jan 15, 2022",
    verified: true,
    rating: 4.8,
    reviews: 156,
    totalSales: "KES 2.5M",
    activeProducts: 124,
  })

  const [editForm, setEditForm] = useState(profile)

  const handleSave = () => {
    setProfile(editForm)
    setIsEditing(false)
    alert("Profile updated successfully!")
  }

  const stats = [
    { label: "Rating", value: profile.rating, icon: Star, color: "from-yellow-500 to-yellow-600" },
    { label: "Reviews", value: profile.reviews, icon: FileText, color: "from-blue-500 to-blue-600" },
    { label: "Total Sales", value: profile.totalSales, icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
    { label: "Products", value: profile.activeProducts, icon: AwardIcon, color: "from-purple-500 to-purple-600" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Shop Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your shop information and credentials</p>
        </div>

        {/* Profile Card */}
        <Card className="p-8 border-0 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            {/* Profile Picture */}
            <div className="relative">
              <Image
                src={profile.avatar || "/placeholder.svg"}
                alt={profile.name}
                width={120}
                height={120}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-amber-600"
              />
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 border-4 border-white dark:border-gray-900">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                {profile.verified && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold">
                    Verified Seller
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 text-lg">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{profile.rating}/5</span>
                <span className="text-gray-600 dark:text-gray-400">({profile.reviews} reviews)</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.bio}</p>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-amber-600 hover:bg-amber-700 gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className={`p-4 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Edit Form */}
        {isEditing && (
          <Card className="p-8 border-0 shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile Information</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Shop Name</label>
                  <Input 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
                  <Input 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    type="email"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Phone</label>
                  <Input 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    type="tel"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Location</label>
                  <Input 
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Website</label>
                <Input 
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.website}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Account Status</span>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Verification Status</span>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Member Since</span>
                <span className="font-semibold text-gray-900 dark:text-white">{profile.joinDate}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="w-full bg-transparent">
                  View Verification Details
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Badges and Achievements */}
        <Card className="p-6 border-0 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Badges & Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Top Rated</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rating 4.8+</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Verified</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Identity Verified</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Fast Seller</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Quick Responses</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <AwardIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Trusted</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">156 reviews</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
