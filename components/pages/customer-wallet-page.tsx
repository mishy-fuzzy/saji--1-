"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus, Eye, EyeOff, TrendingUp, Minus, Download, ArrowUpRight, ArrowDownLeft, Wallet, Receipt
} from "lucide-react"

interface Transaction {
  id: string; type: "payment" | "refund" | "withdrawal" | "deposit"
  description: string; amount: number; date: string; status: "completed" | "pending"
}

export function CustomerWalletPage() {
  const { currency } = useLocalization()
  const { user } = useAuthContext()
  const [showBalance, setShowBalance] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCheckoutRequestId, setPendingCheckoutRequestId] = useState<string | null>(null)
  const [stkStatusMessage, setStkStatusMessage] = useState("")

  const [balance, setBalance] = useState(0)
  const [totalServices, setTotalServices] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const totalSpent = useMemo(() => {
    return transactions
      .filter((txn) => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
  }, [transactions])

  const loadWallet = useCallback(async () => {
    setIsLoadingWallet(true)
    try {
      const response = await fetch("/api/wallet", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to load wallet")
      }

      const items = Array.isArray(payload?.data?.transactions)
        ? payload.data.transactions.map((tx: any) => ({
            id: String(tx.id),
            type: tx.type,
            description: String(tx.description || "Wallet transaction"),
            amount: Number(tx.amount || 0),
            date: String(tx.date || "Just now"),
            status: tx.status === "completed" ? "completed" : "pending",
          }))
        : []

      setBalance(Number(payload?.data?.balance || 0))
  setTotalServices(Number(payload?.data?.totalServices || 0))
      setTransactions(items)
    } catch (error) {
      console.error("Failed to load wallet", error)
    } finally {
      setIsLoadingWallet(false)
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadWallet()
    }
  }, [user?.id])

  useEffect(() => {
    if (showAddMoney && !mpesaPhone && user?.phone) {
      setMpesaPhone(String(user.phone))
    }
  }, [showAddMoney, mpesaPhone, user?.phone])

  useEffect(() => {
    if (!pendingCheckoutRequestId) return

    let attempts = 0
    const maxAttempts = 30
    let active = true

    const pollStkStatus = async () => {
      if (!active) return
      attempts += 1

      try {
        const response = await fetch(
          `/api/wallet/stk-status?checkoutRequestId=${encodeURIComponent(pendingCheckoutRequestId)}`,
          { cache: "no-store" },
        )
        const payload = await response.json()

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Unable to verify STK status")
        }

        const status = String(payload?.data?.status || "pending")
        if (status === "completed") {
          setPendingCheckoutRequestId(null)
          setStkStatusMessage("Wallet funded successfully.")
          await loadWallet()
          alert("Payment confirmed. Your wallet has been updated.")
          return
        }

        if (status === "failed") {
          setPendingCheckoutRequestId(null)
          setStkStatusMessage("STK payment failed or was cancelled.")
          await loadWallet()
          alert("M-Pesa payment failed or was cancelled.")
          return
        }

        if (attempts >= maxAttempts) {
          setPendingCheckoutRequestId(null)
          setStkStatusMessage("Payment is still pending. We will update your wallet once M-Pesa confirms.")
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          const message = error instanceof Error ? error.message : "Unable to verify STK status"
          setPendingCheckoutRequestId(null)
          setStkStatusMessage(message)
        }
      }
    }

    pollStkStatus()
    const intervalId = window.setInterval(pollStkStatus, 3000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [pendingCheckoutRequestId, loadWallet])

  const handleAddMoney = async () => {
    const amount = Number.parseFloat(addMoneyAmount)
    if (!(amount > 0)) return

    if (!mpesaPhone.trim()) {
      alert("Enter your M-Pesa phone number to receive the STK prompt.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit",
          amount,
          method: "mpesa",
          phone: mpesaPhone,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to add funds")
      }

      await loadWallet()
      const checkoutRequestId = payload?.data?.checkoutRequestId ? String(payload.data.checkoutRequestId) : null
      setPendingCheckoutRequestId(checkoutRequestId)
      setStkStatusMessage(
        checkoutRequestId
          ? "STK prompt sent. Waiting for your M-Pesa confirmation..."
          : "STK push sent. Waiting for confirmation...",
      )
      alert(`STK prompt sent to ${mpesaPhone}. Authorize ${currency} ${amount.toLocaleString()} on your phone to complete funding.`)
      setShowAddMoney(false)
      setAddMoneyAmount("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add funds"
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (!(amount > 0)) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", amount, method: "mpesa" }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to withdraw")
      }

      await loadWallet()
      alert(`Withdrawal of ${currency} ${amount.toLocaleString()} completed!`)
      setShowWithdraw(false)
      setWithdrawAmount("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to withdraw"
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadStatement = () => {
    const headers = ["Date", "Type", "Description", "Amount", "Status"]
    const rows = transactions.map(tx => [tx.date, tx.type, tx.description, `${currency} ${Math.abs(tx.amount).toLocaleString()}`, tx.status])
    const csv = [["Transaction Statement"], [`Balance: ${currency} ${balance.toLocaleString()}`], [], headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `wallet-statement-${new Date().toISOString().split('T')[0]}.csv`; link.click()
  }

  const txnConfig: Record<string, { icon: any; iconBg: string; iconColor: string }> = {
    payment: { icon: ArrowUpRight, iconBg: "bg-red-100 dark:bg-red-900/20", iconColor: "text-red-600 dark:text-red-400" },
    refund: { icon: ArrowDownLeft, iconBg: "bg-emerald-100 dark:bg-emerald-900/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
    withdrawal: { icon: ArrowUpRight, iconBg: "bg-amber-100 dark:bg-amber-900/20", iconColor: "text-amber-600 dark:text-amber-400" },
    deposit: { icon: ArrowDownLeft, iconBg: "bg-blue-100 dark:bg-blue-900/20", iconColor: "text-blue-600 dark:text-blue-400" },
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Wallet className="w-5 h-5 text-primary" />
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Wallet</h1>
        </div>

        {/* Balance Card */}
        <Card className="overflow-hidden border-0 shadow-lg mb-6 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium opacity-80">Total Balance</p>
              <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight">
              {showBalance ? `${currency} ${balance.toLocaleString()}` : `${currency} ****`}
            </h2>
            <div className="flex gap-3">
              <Button className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg rounded-xl h-10" onClick={() => setShowAddMoney(true)}>
                <Plus className="w-4 h-4" /> Add Money
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 bg-transparent rounded-xl h-10" onClick={() => setShowWithdraw(true)}>
                <Minus className="w-4 h-4" /> Withdraw
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Spent</p>
                <p className="text-xl font-bold text-foreground">{currency} {totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary" /></div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Services</p>
                <p className="text-xl font-bold text-foreground">{totalServices}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-primary" /></div>
            </div>
          </Card>
        </div>

        {/* Transactions */}
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
              <Button size="sm" variant="ghost" onClick={handleDownloadStatement} className="gap-1.5 text-xs h-8"><Download className="w-3.5 h-3.5" />Export</Button>
            </div>
            {(pendingCheckoutRequestId || stkStatusMessage) && (
              <Card className="p-3.5 border-0 shadow-sm bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                <p className="text-sm font-medium">{stkStatusMessage || "Waiting for M-Pesa confirmation..."}</p>
              </Card>
            )}
            {isLoadingWallet ? (
              <Card className="p-3.5 border-0 shadow-sm">Loading wallet transactions...</Card>
            ) : transactions.length === 0 ? (
              <Card className="p-3.5 border-0 shadow-sm">No transactions yet.</Card>
            ) : transactions.map((txn) => {
              const config = txnConfig[txn.type]
              const Icon = config.icon
              return (
                <Card key={txn.id} className="p-3.5 border-0 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{txn.date}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${txn.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"}`}>{txn.status}</span>
                      </div>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${txn.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {txn.amount > 0 ? "+" : ""}{currency} {Math.abs(txn.amount).toLocaleString()}
                    </p>
                  </div>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Add Money Modal */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add Money</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <div className="flex gap-2"><span className="flex items-center px-3 bg-muted rounded-xl text-sm text-muted-foreground">{currency}</span><Input type="number" placeholder="0" value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value)} className="rounded-xl" /></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button key={amt} onClick={() => setAddMoneyAmount(amt.toString())} className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">{currency} {amt.toLocaleString()}</button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">M-Pesa Phone Number</label>
              <Input
                placeholder="254712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-2">
                You will receive an STK prompt on this number to authorize payment.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-xl"
                onClick={handleAddMoney}
                disabled={isSubmitting || !mpesaPhone.trim()}
              >
                Send STK Prompt
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={() => { setShowAddMoney(false); setAddMoneyAmount("") }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Withdraw Money</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <div className="flex gap-2"><span className="flex items-center px-3 bg-muted rounded-xl text-sm text-muted-foreground">{currency}</span><Input type="number" placeholder="0" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="rounded-xl" /></div>
            </div>
            <p className="text-xs text-muted-foreground">Available: {currency} {balance.toLocaleString()}</p>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl" onClick={handleWithdraw} disabled={isSubmitting}>Withdraw</Button>
              <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={() => { setShowWithdraw(false); setWithdrawAmount("") }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
