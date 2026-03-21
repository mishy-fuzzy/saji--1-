"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function SmsManagementPage() {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !message) return

    setIsSending(true)
    setStatus(null)

    try {
      const response = await fetch("/api/notifications/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ type: "success", text: "SMS sent successfully!" })
        setPhone("")
        setMessage("")
      } else {
        throw new Error(data.error || "Failed to send SMS")
      }
    } catch (err: any) {
      setStatus({ type: "error", text: err.message })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS Notifications</h1>
          <p className="text-muted-foreground">Send bulk or individual SMS messages via Africa's Talking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Single SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendSms} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (with country code)</Label>
                <Input
                  id="phone"
                  placeholder="+254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSending}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {message.length} characters (approximately {Math.ceil(message.length / 160)} SMS units)
                </p>
              </div>

              {status && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  status.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {status.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {status.text}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSending}>
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              SMS Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" 
                 onClick={() => setMessage("Hello {name}, your SAJI verification has been approved. You can now start using the platform.")}>
              <p className="font-semibold text-sm">Verification Approved</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{"Hello {name}, your SAJI verification has been approved..."}</p>
            </div>
            
            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                 onClick={() => setMessage("Reminder: You have a scheduled service today at {time}. Please ensure someone is available.")}>
              <p className="font-semibold text-sm">Job Reminder</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{"Reminder: You have a scheduled service today at..."}</p>
            </div>

            <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                 onClick={() => setMessage("Your withdrawal request for KES {amount} has been processed.")}>
              <p className="font-semibold text-sm">Payment Successful</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{"Your withdrawal request for KES {amount} has been..."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}