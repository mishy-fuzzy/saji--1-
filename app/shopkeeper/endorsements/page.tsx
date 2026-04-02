"use client"

import { useEffect, useState } from "react"
import { 
  Award, Search, Check, X, Clock, Star, MapPin, Phone, ChevronRight, 
  MessageSquare, ThumbsUp, Eye, Calendar
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

export default function ShopkeeperEndorsementsPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEndorseModal, setShowEndorseModal] = useState(false)
  const [selectedSpecialist, setSelectedSpecialist] = useState<any | null>(null)
  const [endorsementText, setEndorsementText] = useState("")
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [myEndorsements, setMyEndorsements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEndorsementData = async () => {
      try {
        const response = await fetch("/api/shopkeeper/endorsements", {
          cache: "no-store",
        })
        const payload = await response.json()
        if (payload?.ok && payload?.data) {
          setPendingRequests(payload.data.pendingRequests || [])
          setMyEndorsements(payload.data.myEndorsements || [])
        }
      } catch (err) {
        console.error("Failed to load endorsements:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadEndorsementData()
  }, [])

  const stats = {
    totalEndorsements: myEndorsements.length,
    pendingRequests: pendingRequests.length,
    totalViews: myEndorsements.reduce((sum, e) => sum + (e.views || 0), 0),
    thisMonth: myEndorsements.length
  }

  const handleEndorse = () => {
    // Would submit endorsement here
    setShowEndorseModal(false)
    setEndorsementText("")
    setSelectedSpecialist(null)
    alert("Endorsement submitted successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-800 dark:to-orange-800 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Endorsements</h1>
              <p className="text-amber-100 text-sm">Endorse trusted specialists you know</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalEndorsements}</p>
              <p className="text-xs text-amber-100">Given</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              <p className="text-xs text-amber-100">Pending</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-amber-100">Profile Views</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-xs text-amber-100">This Month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Tabs */}
        <Card className="p-2 mb-4 shadow-lg border-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "pending" ? "bg-white/20" : "bg-amber-100 text-amber-700"
                }`}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("given")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === "given"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              My Endorsements
            </button>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-4 mb-4 border-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search specialists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 mb-4 border-0 shadow-sm bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <ThumbsUp className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Your endorsements matter!</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                When you endorse a specialist, it appears on their profile and helps customers trust them. 
                Only endorse people you've actually worked with and know well.
              </p>
            </div>
          </div>
        </Card>

        {/* Pending Requests */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-sm">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  New endorsement requests from specialists will appear here
                </p>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-5 border-0 shadow-sm">
                  <div className="flex gap-4 mb-4">
                    <Image 
                      src={request.avatar || "/placeholder.svg"} 
                      alt={request.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{request.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.specialty}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{request.requestedAt}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="w-4 h-4 fill-amber-500" />
                          {request.rating}
                        </span>
                        <span className="text-muted-foreground">({request.reviews} reviews)</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {request.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.message}"</p>
                    <p className="text-xs text-muted-foreground mt-2">Known for {request.yearsKnown} years</p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        setSelectedSpecialist(request)
                        setShowEndorseModal(true)
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Write Endorsement
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent">
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Given Endorsements */}
        {activeTab === "given" && (
          <div className="space-y-4">
            {myEndorsements.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-sm">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No endorsements yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start endorsing specialists you know and trust
                </p>
              </Card>
            ) : (
              myEndorsements.map((endorsement) => (
                <Card key={endorsement.id} className="p-5 border-0 shadow-sm">
                  <div className="flex gap-4 mb-3">
                    <Image 
                      src={endorsement.avatar || "/placeholder.svg"} 
                      alt={endorsement.name}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{endorsement.name}</h3>
                      <p className="text-sm text-muted-foreground">{endorsement.specialty}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {endorsement.endorsedAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {endorsement.views} views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <p className="text-sm text-amber-900 dark:text-amber-200">"{endorsement.endorsement}"</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Endorsement Modal */}
      <Dialog open={showEndorseModal} onOpenChange={setShowEndorseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write Endorsement</DialogTitle>
          </DialogHeader>
          {selectedSpecialist && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Image 
                  src={selectedSpecialist.avatar || "/placeholder.svg"} 
                  alt={selectedSpecialist.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSpecialist.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSpecialist.specialty}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Your endorsement:</p>
                <Textarea 
                  value={endorsementText}
                  onChange={(e) => setEndorsementText(e.target.value)}
                  placeholder="Write about your experience with this specialist. How long have you known them? Why do you recommend their work?"
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {endorsementText.length}/500 characters
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Tip:</strong> Mention specific qualities like reliability, quality of work, and how long you've known them.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent"
                  onClick={() => setShowEndorseModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handleEndorse}
                  disabled={endorsementText.length < 50}
                >
                  Submit Endorsement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
