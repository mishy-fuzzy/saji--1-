"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus, Eye, EyeOff, CreditCard, TrendingUp, Minus, Download, ArrowUpRight, ArrowDownLeft, Wallet, Receipt
} from "lucide-react"

interface Transaction {
  id: string; type: "payment" | "refund" | "withdrawal" | "deposit"
  description: string; amount: number; date: string; status: "completed" | "pending"
}

export function CustomerWalletPage() {
  const { currency } = useLocalization()
  const { user } = useAuthContext()
  const [showBalance, setShowBalance] = useState(true)
  const [activeTab, setActiveTab] = useState("transactions")
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [newMethodType, setNewMethodType] = useState("")
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ mpesaPhone: "", cardNumber: "", cardName: "", expiryDate: "", cvv: "", paypalEmail: "" })

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const totalSpent = useMemo(() => {
    return transactions
      .filter((txn) => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
  }, [transactions])

  const paymentMethods = [
    { id: 1, type: "mpesa", name: "M-Pesa", number: "***5678", primary: true },
    { id: 2, type: "card", name: "Visa", number: "***9012", primary: false },
    { id: 3, type: "paypal", name: "PayPal", number: "***@gmail.com", primary: false },
  ]

  const loadWallet = async () => {
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
      setTransactions(items)
    } catch (error) {
      console.error("Failed to load wallet", error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadWallet()
    }
  }, [user?.id])

  const handleAddMoney = async () => {
    const amount = Number.parseFloat(addMoneyAmount)
    if (!(amount > 0)) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit",
          amount,
          method: newMethodType || "mpesa",
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to add funds")
      }

      await loadWallet()
      alert(`Successfully added ${currency} ${amount.toLocaleString()}!`)
      setShowAddMoney(false)
      setAddMoneyAmount("")
      setNewMethodType("")
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

  const handleAddPaymentMethod = () => {
    let isValid = false
    if (newMethodType === "mpesa") isValid = paymentForm.mpesaPhone.length >= 10
    else if (newMethodType === "card") isValid = paymentForm.cardNumber.length === 16 && paymentForm.cvv.length === 3
    else if (newMethodType === "paypal") isValid = paymentForm.paypalEmail.includes("@")
    if (isValid) {
      alert("Payment method added!"); setShowAddMethod(false)
      setPaymentForm({ mpesaPhone: "", cardNumber: "", cardName: "", expiryDate: "", cvv: "", paypalEmail: "" }); setNewMethodType("")
    } else { alert("Please enter valid information") }
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
                <p className="text-xl font-bold text-foreground">12</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-primary" /></div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6">
          {["transactions", "methods"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          ))}
        </div>

        {/* Transactions */}
        {activeTab === "transactions" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
              <Button size="sm" variant="ghost" onClick={handleDownloadStatement} className="gap-1.5 text-xs h-8"><Download className="w-3.5 h-3.5" />Export</Button>
            </div>
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
        )}

        {/* Payment Methods */}
        {activeTab === "methods" && (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="p-4 border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method.type === "mpesa" ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-blue-100 dark:bg-blue-900/20"}`}>
                    <CreditCard className={`w-4 h-4 ${method.type === "mpesa" ? "text-emerald-600" : "text-blue-600"}`} />
                  </div>
                  <div className="flex-1"><p className="font-semibold text-sm text-foreground">{method.name}</p><p className="text-xs text-muted-foreground">{method.number}</p></div>
                  {method.primary && <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg">Primary</span>}
                </div>
              </Card>
            ))}
            <Button className="w-full rounded-xl mt-2 gap-2" onClick={() => setShowAddMethod(true)}><Plus className="w-4 h-4" />Add Payment Method</Button>
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add Money</DialogTitle></DialogHeader>
          {!newMethodType ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Select payment method:</p>
              <div className="grid grid-cols-3 gap-2">
                {["M-Pesa", "Card", "PayPal"].map((method) => (
                  <button key={method} onClick={() => setNewMethodType(method.toLowerCase())} className="p-4 border-2 border-border hover:border-primary rounded-xl transition-all hover:bg-primary/5 text-center">
                    <p className="text-sm font-semibold">{method}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" onClick={handleAddMoney} disabled={isSubmitting}>Add</Button>
                <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={() => { setShowAddMoney(false); setAddMoneyAmount(""); setNewMethodType("") }}>Cancel</Button>
              </div>
            </div>
          )}
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

      {/* Add Payment Method Modal */}
      <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              {[{ id: "mpesa", label: "M-Pesa" }, { id: "card", label: "Card" }, { id: "paypal", label: "PayPal" }].map((m) => (
                <button key={m.id} onClick={() => setNewMethodType(m.id)} className={`p-3 rounded-xl border-2 transition-all text-center ${newMethodType === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <p className="text-xs font-semibold">{m.label}</p>
                </button>
              ))}
            </div>
            {newMethodType === "mpesa" && <div><label className="text-sm font-medium mb-1.5 block">Phone Number</label><Input placeholder="254712345678" value={paymentForm.mpesaPhone} onChange={(e) => setPaymentForm({ ...paymentForm, mpesaPhone: e.target.value })} className="rounded-xl" /></div>}
            {newMethodType === "card" && (
              <div className="space-y-3">
                <div><label className="text-sm font-medium mb-1.5 block">Card Holder</label><Input placeholder="Name" value={paymentForm.cardName} onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })} className="rounded-xl" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Card Number</label><Input placeholder="4532 1234 5678 9010" value={paymentForm.cardNumber} onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\s/g, "") })} maxLength={16} className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-sm font-medium mb-1.5 block">Expiry</label><Input placeholder="MM/YY" value={paymentForm.expiryDate} onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })} className="rounded-xl" /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">CVV</label><Input placeholder="123" value={paymentForm.cvv} onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })} maxLength={3} className="rounded-xl" /></div>
                </div>
              </div>
            )}
            {newMethodType === "paypal" && <div><label className="text-sm font-medium mb-1.5 block">PayPal Email</label><Input type="email" placeholder="email@example.com" value={paymentForm.paypalEmail} onChange={(e) => setPaymentForm({ ...paymentForm, paypalEmail: e.target.value })} className="rounded-xl" /></div>}
            {newMethodType && (
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-xl" onClick={handleAddPaymentMethod}>Add</Button>
                <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={() => { setShowAddMethod(false); setNewMethodType("") }}>Cancel</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
