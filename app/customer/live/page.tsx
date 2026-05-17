"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Radio } from "lucide-react"

type LiveSession = {
  id: string
  kind: "provider" | "workshop"
  title: string
  category: string | null
  viewers: number
  joinFee: number | null
  hostName: string | null
  hostAvatar: string | null
}

function formatJoinFee(joinFee: number | null) {
  if (joinFee === null) return "Unavailable"
  if (joinFee <= 0) return "Free"
  return `KES ${joinFee.toLocaleString()}`
}

function SessionCard({ session }: { session: LiveSession }) {
  const joinLabel = formatJoinFee(session.joinFee)
  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
          <Image
            src={session.hostAvatar || "/placeholder.svg"}
            alt={session.hostName || "Live host"}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{session.title}</p>
            <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px] px-2 py-0.5">
              LIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {session.hostName || "Provider"}
            {session.category ? ` - ${session.category}` : ""}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" /> {session.viewers} watching
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <p className="text-sm font-semibold text-foreground">{joinLabel}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/customer/home">Open Live</Link>
        </Button>
      </div>
    </Card>
  )
}

function LoadingCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function CustomerLivePage() {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  const router = useRouter()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || ""
    const text = await response.text()
    if (!contentType.includes("application/json")) {
      throw new Error(`Unexpected response (${response.status}). ${text.slice(0, 120)}`)
    }

    try {
      return JSON.parse(text)
    } catch {
      throw new Error("Invalid JSON response")
    }
  }

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || user?.role !== "customer") {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router, user?.role])

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const response = await fetch("/api/live-sessions?status=live&limit=50", {
          cache: "no-store",
        })
        const payload = await parseJsonResponse(response)
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          setFetchError(payload?.error || `Request failed (${response.status})`)
          setSessions([])
          return
        }

        const mapped = payload.data.map((session: any) => ({
          id: String(session?.id || ""),
          kind: session?.kind === "workshop" ? "workshop" : "provider",
          title: String(session?.title || "Live Session"),
          category: session?.category ? String(session.category) : null,
          viewers: Number.isFinite(session?.viewers) ? Number(session.viewers) : 0,
          joinFee: typeof session?.joinFee === "number" ? session.joinFee : null,
          hostName: session?.hostName ? String(session.hostName) : null,
          hostAvatar: session?.hostAvatar ? String(session.hostAvatar) : null,
        })) as LiveSession[]

        setFetchError(null)
        setSessions(mapped)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load live sessions"
        setFetchError(message)
        setSessions([])
      } finally {
        setIsLoadingSessions(false)
      }
    }

    if (isAuthenticated && user?.role === "customer") {
      fetchSessions()
      const intervalId = window.setInterval(fetchSessions, 30000)
      return () => window.clearInterval(intervalId)
    }
  }, [isAuthenticated, user?.role])

  const liveProviders = useMemo(
    () => sessions.filter((session) => session.kind === "provider"),
    [sessions],
  )
  const liveWorkshops = useMemo(
    () => sessions.filter((session) => session.kind === "workshop"),
    [sessions],
  )

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || user?.role !== "customer") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Radio className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Now</h1>
            <p className="text-sm text-muted-foreground">
              See providers and workshops that are live right now.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Live Providers</h2>
            <Badge className="bg-red-500 hover:bg-red-500 text-white">LIVE</Badge>
          </div>
          {fetchError ? (
            <Card className="p-4 text-sm text-red-600 bg-red-50 border border-red-200">
              {fetchError}
            </Card>
          ) : null}
          {isLoadingSessions ? (
            <LoadingCards />
          ) : liveProviders.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No providers are live yet. Check back in a few minutes.
            </Card>
          ) : (
            <div className="space-y-3">
              {liveProviders.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Live Workshops</h2>
            <Badge className="bg-red-500 hover:bg-red-500 text-white">LIVE</Badge>
          </div>
          {isLoadingSessions ? (
            <LoadingCards />
          ) : liveWorkshops.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No workshops are live yet. Check back in a few minutes.
            </Card>
          ) : (
            <div className="space-y-3">
              {liveWorkshops.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
