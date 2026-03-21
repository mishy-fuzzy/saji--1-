"use client"

import { useState } from "react"
import {
  Home,
  Briefcase,
  MessageCircle,
  Wallet,
  User,
  Star,
  Shield,
  Award,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Edit,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"

export default function ProviderProfilePage() {
  const router = useRouter()
  const { logout } = useAuthContext()
  const [provider] = useState({
    name: "Mike R.",
    rating: 4.7,
    reviews: 200,
    providerSince: "January 2025",
    completedJobs: 12,
  })

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const menuItems = [
    { icon: User, title: "My Account", href: "/provider/profile/account" },
    { icon: Award, title: "Work Area & Skills", href: "/provider/profile/skills" },
    { icon: Shield, title: "Verification", href: "/provider/profile/verification" },
    { icon: FileText, title: "Proof of Work", badge: "2 New", href: "/provider/profile/proof" },
    { icon: Wallet, title: "Payment Methods", href: "/provider/profile/payments" },
    { icon: Star, title: "Star Rating", href: "/provider/profile/ratings" },
    { icon: MessageCircle, title: "Help & Support", href: "/provider/profile/help" },
    { icon: Settings, title: "Settings", href: "/provider/profile/settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium">Profile</span>
          <Bell className="w-5 h-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-2xl">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border dark:border-gray-700">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{provider.name}</h2>
          <div className="flex justify-center gap-1 my-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {provider.rating} • {provider.providerSince}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Completed jobs {provider.completedJobs}</p>
          {/* Edit Profile Button */}
          <Link
            href="/provider/profile/edit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {/* Menu Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 divide-y dark:divide-gray-700">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <Link
                key={idx}
                href={item.href}
                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                    {item.badge && (
                      <span className="ml-2 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                </div>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left text-red-600 dark:text-red-400"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around py-3 max-w-2xl mx-auto lg:hidden">
        <Link
          href="/provider"
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          href="/provider/jobs"
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <Briefcase className="w-6 h-6" />
          <span className="text-xs">Jobs</span>
        </Link>
        <Link
          href="/provider/messages"
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs">Messages</span>
        </Link>
        <Link
          href="/provider/wallet"
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs">Wallet</span>
        </Link>
        <Link href="/provider/profile" className="flex flex-col items-center gap-1 text-blue-600">
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  )
}
