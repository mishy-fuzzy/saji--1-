"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface PaymentFormProps {
  paymentMethod: string
  amountKES?: number
  accountReference?: string
  bookingId?: string
  onSubmit: () => void
}

export function PaymentForm({ paymentMethod, amountKES = 1, accountReference = "SAJI-SERVICE", bookingId, onSubmit }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    phone: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVC: "",
    email: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [bankTransferStep, setBankTransferStep] = useState<"details" | "instructions" | "proof">("details")
  const [transferDetails, setTransferDetails] = useState<{ reference: string; instructions: string[]; bank: any } | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsProcessing(true)

    try {
      if (paymentMethod === "mpesa") {
        const response = await fetch("/api/payments/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            amount: amountKES,
            accountReference,
            transactionDesc: "Service payment",
            bookingId: bookingId,
          }),
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "M-Pesa request failed")
        }

        setSuccessMessage("STK push sent. Please check your phone and authorize payment.")
        onSubmit()
        return
      }

      if (paymentMethod === "bank") {
        if (bankTransferStep === "details") {
          const response = await fetch("/api/payments/bank/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: amountKES,
              currency: "KES",
              payerName: formData.accountName || "Customer",
              payerPhone: formData.phone,
              payerEmail: formData.email,
              reference: accountReference,
              bookingId,
            }),
          })

          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error || "Bank transfer initiation failed")
          }

          setTransferDetails({
            reference: payload.data.transferReference,
            instructions: payload.data.instructions,
            bank: payload.data.bank,
          })
          setBankTransferStep("instructions")
          setError(null)
          return
        }

        if (bankTransferStep === "proof") {
          if (!proofFile) {
            throw new Error("Please select a proof of payment image or PDF")
          }

          const uploadFormData = new FormData()
          uploadFormData.append("file", proofFile)
          uploadFormData.append("reference", transferDetails?.reference || "")
          
          const response = await fetch("/api/payments/upload", {
            method: "POST",
            body: uploadFormData,
          })
          
          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error || "Failed to upload proof")
          }

          setSuccessMessage(payload.message)
          onSubmit()
          return
        }
      }

      if (paymentMethod === "card") {
        const response = await fetch("/api/payments/card/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountKES,
            currency: "KES",
            email: formData.email,
            reference: accountReference,
            bookingId,
          }),
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "Card payment initialization failed")
        }

        const intentId = payload?.data?.id || "unknown"
        setSuccessMessage(`Card payment intent created (${intentId}). Connect Stripe Elements checkout to collect and confirm card details.`)
        onSubmit()
        return
      }

      if (paymentMethod === "paypal") {
        const response = await fetch("/api/payments/paypal/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountKES,
            currency: "USD",
            reference: accountReference,
            bookingId,
          }),
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "PayPal order creation failed")
        }

        const approveUrl = payload?.data?.approveUrl as string | null
        if (approveUrl) {
          window.location.href = approveUrl
          return
        }

        const orderId = payload?.data?.id || "unknown"
        setSuccessMessage(`PayPal order created (${orderId}).`)
        onSubmit()
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1200))
      onSubmit()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed"
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="p-3 border border-red-300 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-200">
          {error}
        </Card>
      )}
      {successMessage && (
        <Card className="p-3 border border-green-300 bg-green-50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-200">
          {successMessage}
        </Card>
      )}

      {paymentMethod === "mpesa" && (
        <div className="space-y-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Enter your M-Pesa registered phone number. You'll receive a prompt to authorize the payment.
            </p>
          </Card>

          <div className="space-y-2">
            <Label>M-Pesa Phone Number</Label>
            <Input
              placeholder="+254 700 000 000"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Email (for receipt)</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
            />
          </div>
        </div>
      )}

      {paymentMethod === "card" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cardholder Name</Label>
            <Input
              placeholder="John Doe"
              value={formData.cardName}
              onChange={(e) => handleChange("cardName", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Card Number</Label>
            <Input
              placeholder="4532 1234 5678 9010"
              value={formData.cardNumber}
              onChange={(e) => handleChange("cardNumber", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                placeholder="MM/YY"
                value={formData.cardExpiry}
                onChange={(e) => handleChange("cardExpiry", e.target.value)}
                className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>CVC</Label>
              <Input
                placeholder="123"
                value={formData.cardCVC}
                onChange={(e) => handleChange("cardCVC", e.target.value)}
                className="h-11 rounded-lg border-2 border-border focus-visible:border-primary font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
            />
          </div>
        </div>
      )}

      {paymentMethod === "paypal" && (
        <div className="space-y-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
          </Card>

          <div className="space-y-2">
            <Label>PayPal Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
            />
          </div>
        </div>
      )}

      {paymentMethod === "bank" && (
        <div className="space-y-4">
          {bankTransferStep === "details" && (
            <>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Enter your details to generate bank transfer instructions and reference.
                </p>
              </Card>

              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="Your account name"
                  value={formData.accountName}
                  onChange={(e) => handleChange("accountName", e.target.value)}
                  className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="h-11 rounded-lg border-2 border-border focus-visible:border-primary"
                />
              </div>
            </>
          )}

          {bankTransferStep === "instructions" && transferDetails && (
            <div className="space-y-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">Transfer Instructions</h3>
                <ul className="text-sm space-y-2 text-green-800 dark:text-green-200">
                  {transferDetails.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold">{i + 1}.</span> {inst}
                    </li>
                  ))}
                </ul>
              </Card>
              
              <div className="p-4 border-2 border-dashed rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Bank Reference</div>
                <div className="text-xl font-mono font-bold tracking-wider">{transferDetails.reference}</div>
              </div>

              <Button 
                type="button" 
                className="w-full" 
                variant="outline"
                onClick={() => setBankTransferStep("proof")}
              >
                I have made the transfer
              </Button>
            </div>
          )}

          {bankTransferStep === "proof" && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Please upload a screenshot or PDF of your transaction receipt for verification.
                </p>
              </Card>

              <div className="space-y-2">
                <Label>Upload Receipt</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="h-11 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-2 bg-transparent rounded-lg h-11"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing || (paymentMethod === "bank" && bankTransferStep === "instructions")}
          className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold h-11"
        >
          {isProcessing ? "Processing..." : 
           paymentMethod === "bank" ? 
            (bankTransferStep === "details" ? "Generate Instructions" : bankTransferStep === "instructions" ? "See Steps Above" : "Verify Payment") 
           : "Continue to Confirmation"}
        </Button>
      </div>
    </form>
  )
}
