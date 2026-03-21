"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BookingModalProps {
  service: any
  package: any
}

export function BookingModal({ service, package: pkg }: BookingModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    location: "",
    description: "",
    quantity: "1",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Step 1: Schedule */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">When do you need this?</h3>

          <div className="space-y-2">
            <Label>Preferred Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="pl-10 h-11 rounded-lg border-2 border-border focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                className="pl-10 h-11 rounded-lg border-2 border-border focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Select value={formData.quantity} onValueChange={(value) => handleChange("quantity", value)}>
              <SelectTrigger className="h-11 rounded-lg border-2 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Unit</SelectItem>
                <SelectItem value="2">2 Units</SelectItem>
                <SelectItem value="3">3 Units</SelectItem>
                <SelectItem value="4">4 Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Where should we go?</h3>

          <div className="space-y-2">
            <Label>Service Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Enter your address"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="pl-10 h-11 rounded-lg border-2 border-border focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              placeholder="Tell us more about your needs..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="rounded-lg border-2 border-border focus-visible:border-primary min-h-24"
            />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Review Your Booking</h3>

          <Card className="p-4 space-y-3 bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-semibold text-foreground">{pkg.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="font-semibold text-foreground">
                  {formData.date} at {formData.time}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold text-foreground">{formData.location}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-semibold text-foreground text-sm">{formData.description || "No additional details"}</p>
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20 border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total Price</span>
              <span className="text-2xl font-bold text-primary">
                KES {(pkg.price * Number.parseInt(formData.quantity)).toLocaleString()}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
          className="flex-1 border-2 bg-transparent rounded-lg"
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={handleNext}
            className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            Proceed to Payment
          </Button>
        )}
      </div>
    </div>
  )
}
