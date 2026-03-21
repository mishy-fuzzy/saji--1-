"use client"

import { useState } from "react"
import { Clock, Calendar, ChevronLeft, ChevronRight, MapPin, AlertCircle, Check, Plane, Plus, X, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type TimeSlot = { start: string; end: string; enabled: boolean }
type BlockedDate = { date: string; reason: string }
type CalendarEvent = { date: string; title: string; time: string; type: "job" | "blocked" | "break" }

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "calendar" | "blocked">("schedule")
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, TimeSlot>>(
    Object.fromEntries(DAYS.map(day => [
      day,
      { start: day === "Sunday" ? "" : "08:00", end: day === "Sunday" ? "" : "18:00", enabled: day !== "Sunday" }
    ]))
  )
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([
    { date: "2026-03-01", reason: "Public Holiday" },
    { date: "2026-03-15", reason: "Personal Leave" },
  ])
  const [newBlockDate, setNewBlockDate] = useState("")
  const [newBlockReason, setNewBlockReason] = useState("")
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(5)
  const [breakDuration, setBreakDuration] = useState(30)
  const [autoAccept, setAutoAccept] = useState(true)
  const [travelRadius, setTravelRadius] = useState(15)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [saved, setSaved] = useState(false)

  const calendarEvents: CalendarEvent[] = [
    { date: "2026-02-20", title: "Kitchen Repair", time: "09:00-11:00", type: "job" },
    { date: "2026-02-20", title: "Pipe Installation", time: "14:00-16:00", type: "job" },
    { date: "2026-02-22", title: "Bathroom Fix", time: "10:00-12:00", type: "job" },
    { date: "2026-02-25", title: "Electrical Work", time: "08:00-10:00", type: "job" },
    { date: "2026-02-27", title: "Lunch Break", time: "12:00-13:00", type: "break" },
    ...blockedDates.map(b => ({ date: b.date, title: b.reason, time: "All Day", type: "blocked" as const }))
  ]

  const toggleDay = (day: string) => {
    setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const addBlockedDate = () => {
    if (newBlockDate) {
      setBlockedDates(prev => [...prev, { date: newBlockDate, reason: newBlockReason || "Blocked" }])
      setNewBlockDate("")
      setNewBlockReason("")
    }
  }

  const removeBlockedDate = (idx: number) => {
    setBlockedDates(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => (new Date(year, month, 1).getDay() + 6) % 7

  const calendarDays = () => {
    const days = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= days; i++) cells.push(i)
    return cells
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return calendarEvents.filter(e => e.date === dateStr)
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Availability & Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your working hours, blocked dates, and booking preferences</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2 rounded-xl">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[
          { id: "schedule" as const, label: "Weekly Hours", icon: Clock },
          { id: "calendar" as const, label: "Calendar View", icon: Calendar },
          { id: "blocked" as const, label: "Time Off", icon: Plane },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Weekly Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <Card className="p-4 border border-border rounded-xl">
            <h3 className="font-semibold text-foreground mb-4">Working Hours</h3>
            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                      weeklySchedule[day].enabled ? "bg-primary justify-end" : "bg-muted justify-start"
                    }`}
                  >
                    <span className="w-5 h-5 bg-card rounded-full mx-0.5 shadow-sm" />
                  </button>
                  <span className={`w-24 text-sm font-medium ${weeklySchedule[day].enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {day}
                  </span>
                  {weeklySchedule[day].enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={weeklySchedule[day].start}
                        onChange={(e) => updateTime(day, "start", e.target.value)}
                        className="w-32 h-9 rounded-lg text-sm bg-card border-border"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        value={weeklySchedule[day].end}
                        onChange={(e) => updateTime(day, "end", e.target.value)}
                        className="w-32 h-9 rounded-lg text-sm bg-card border-border"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Day off</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-4 border border-border rounded-xl">
            <h3 className="font-semibold text-foreground mb-4">Booking Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Max Jobs Per Day</label>
                <Input type="number" value={maxJobsPerDay} onChange={(e) => setMaxJobsPerDay(Number(e.target.value))} className="rounded-lg bg-card border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Break Between Jobs (min)</label>
                <Input type="number" value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))} className="rounded-lg bg-card border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Travel Radius (km)</label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={travelRadius} onChange={(e) => setTravelRadius(Number(e.target.value))} className="rounded-lg bg-card border-border" />
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Auto-Accept Jobs</label>
                <button
                  onClick={() => setAutoAccept(!autoAccept)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${autoAccept ? "bg-primary justify-end" : "bg-muted justify-start"}`}
                >
                  <span className="w-5 h-5 bg-card rounded-full mx-0.5 shadow-sm" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <Card className="p-4 border border-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}>
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h3 className="font-semibold text-foreground">{MONTHS[currentMonth]} {currentYear}</h3>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}>
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="text-[10px] font-semibold text-muted-foreground uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays().map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const events = getEventsForDate(day)
              const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()
              const hasBlocked = events.some(e => e.type === "blocked")
              return (
                <div
                  key={day}
                  className={`min-h-[72px] p-1 rounded-lg border text-xs transition-all ${
                    isToday ? "border-primary bg-primary/5" : hasBlocked ? "border-destructive/30 bg-destructive/5" : "border-border"
                  }`}
                >
                  <span className={`block text-right text-[11px] font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {events.slice(0, 2).map((ev, i) => (
                      <div key={i} className={`truncate px-1 py-0.5 rounded text-[9px] font-medium ${
                        ev.type === "job" ? "bg-primary/10 text-primary" : ev.type === "blocked" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 2 && <span className="text-[9px] text-muted-foreground px-1">+{events.length - 2} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Jobs</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /><span className="text-xs text-muted-foreground">Blocked</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /><span className="text-xs text-muted-foreground">Break</span></div>
          </div>
        </Card>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === "blocked" && (
        <div className="space-y-4">
          <Card className="p-4 border border-border rounded-xl">
            <h3 className="font-semibold text-foreground mb-3">Add Time Off</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input type="date" value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)} className="rounded-lg bg-card border-border" />
              <Input placeholder="Reason (optional)" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} className="rounded-lg bg-card border-border flex-1" />
              <Button onClick={addBlockedDate} disabled={!newBlockDate} className="rounded-xl"><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
          </Card>
          <Card className="p-4 border border-border rounded-xl">
            <h3 className="font-semibold text-foreground mb-3">Upcoming Time Off</h3>
            {blockedDates.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No blocked dates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedDates.map((bd, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Plane className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{bd.date}</p>
                        <p className="text-xs text-muted-foreground">{bd.reason}</p>
                      </div>
                    </div>
                    <button onClick={() => removeBlockedDate(idx)} className="p-1 hover:bg-destructive/10 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
