"use client"

import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react"
import Link from "next/link"

export default function HelpSupportPage() {
  const faqs = [
    { q: "How do I withdraw my earnings?", a: "Go to Wallet > Withdraw Funds and choose your payment method." },
    { q: "How are disputes handled?", a: "Disputes are handled by our support team within 24-48 hours." },
    { q: "Can I change my service areas?", a: "Yes, go to Profile > Work Area & Skills to update your service areas." },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 text-center hover:border-blue-400 transition">
            <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Live Chat</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Chat with support</p>
          </button>
          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 text-center hover:border-blue-400 transition">
            <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Call Us</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">+254 702 123456</p>
          </button>
          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 text-center hover:border-blue-400 transition">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Email</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">support@saji.com</p>
          </button>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-l-4 border-blue-600 pl-4">
                <p className="font-medium text-gray-900 dark:text-white mb-1">{faq.q}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
