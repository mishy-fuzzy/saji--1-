"use client"

import { useState } from "react"
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard, Building2, 
  Smartphone, ChevronRight, Clock, CheckCircle2, AlertCircle, Download, Filter,
  Plus, Eye, EyeOff, AlertTriangle, X
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProviderWalletPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showBalance, setShowBalance] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState<string | null>("mpesa")
  const [withdrawError, setWithdrawError] = useState("")
  const [walletData, setWalletData] = useState({
    balance: 45600,
    available: 38500,
    pending: 7100,
    escrow: 12000,
    thisMonth: 52300,
    lastMonth: 41200
  })
  const [transactionsList, setTransactionsList] = useState([
    {
      id: 1,
      type: "credit",
      title: "Kitchen Plumbing Repair",
      client: "Sarah Wanjiku",
      amount: 8500,
      date: "Today, 3:45 PM",
      status: "completed"
    },
    {
      id: 2,
      type: "debit",
      title: "Withdrawal to M-Pesa",
      client: "0712****45",
      amount: 15000,
      date: "Yesterday, 11:20 AM",
      status: "completed"
    },
    {
      id: 3,
      type: "credit",
      title: "Electrical Installation",
      client: "John Kamau",
      amount: 15000,
      date: "May 12, 2024",
      status: "pending"
    },
    {
      id: 4,
      type: "credit",
      title: "Emergency Pipe Repair",
      client: "Grace Muthoni",
      amount: 12000,
      date: "May 10, 2024",
      status: "escrow"
    },
    {
      id: 5,
      type: "debit",
      title: "Service Fee",
      client: "Platform",
      amount: 850,
      date: "May 10, 2024",
      status: "completed"
    }
  ])

  const escrowPayments = [
    {
      id: 1,
      job: "Emergency Pipe Repair",
      client: "Grace Muthoni",
      amount: 12000,
      status: "Awaiting Completion",
      dueDate: "May 20, 2024"
    }
  ]

  const withdrawMethods = [
    { id: "mpesa", name: "M-Pesa", icon: Smartphone, details: "0712****45", default: true },
    { id: "bank", name: "Bank Account", icon: Building2, details: "KCB ****7890" },
  ]

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const percentChange = ((walletData.thisMonth - walletData.lastMonth) / walletData.lastMonth * 100).toFixed(1)

  const handleWithdraw = () => {
    setWithdrawError("")
    const amount = parseFloat(withdrawAmount)
    
    if (!withdrawAmount || isNaN(amount)) {
      setWithdrawError("Please enter a valid amount")
      return
    }
    
    if (amount < 100) {
      setWithdrawError("Minimum withdrawal is KES 100")
      return
    }
    
    if (amount > walletData.available) {
      setWithdrawError("Insufficient available balance")
      return
    }
    
    if (!withdrawMethod) {
      setWithdrawError("Please select a withdrawal method")
      return
    }
    
    // Process withdrawal - deduct from available and add transaction
    const methodName = withdrawMethods.find(m => m.id === withdrawMethod)?.name || "M-Pesa"
    
    setWalletData(prev => ({
      ...prev,
      balance: prev.balance - amount,
      available: prev.available - amount,
      thisMonth: prev.thisMonth - amount
    }))

    const newTransaction = {
      id: transactionsList.length + 1,
      type: "debit",
      title: `Withdrawal to ${methodName}`,
      client: withdrawMethod === "mpesa" ? "0712****45" : "KCB ****7890",
      amount: amount,
      date: new Date().toLocaleString(),
      status: "completed"
    }
    
    setTransactionsList([newTransaction, ...transactionsList])
    
    setShowWithdraw(false)
    setWithdrawAmount("")
    alert(`Withdrawal of KES ${amount.toLocaleString()} initiated!\nMethod: ${methodName}\nYou will receive the funds within 24 hours.`)
  }

  const handleDownloadStatement = () => {
    // Generate CSV statement with proper formatting
    const headers = ["Date", "Description", "Amount", "Status", "Client"]
    const rows = transactionsList.map(t => [
      t.date,
      t.title,
      `${t.type === "credit" ? "+" : "-"} KES ${t.amount.toLocaleString()}`,
      t.status,
      t.client
    ])

    const csvContent = [
      [`Transaction Statement - ${new Date().toLocaleDateString()}`],
      [],
      headers,
      ...rows,
      [],
      ["Total Credits", transactionsList.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0).toLocaleString()],
      ["Total Debits", transactionsList.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0).toLocaleString()],
    ]

    const csv = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(",")
    ).join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", `wallet-statement-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert("Statement downloaded successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-900 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Total Balance</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {showBalance ? formatCurrency(walletData.balance) : "KES ****"}
                </h1>
                <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-100 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                +{percentChange}%
              </div>
              <p className="text-xs text-emerald-200">vs last month</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">Available</p>
              <p className="text-lg font-bold">{showBalance ? formatCurrency(walletData.available) : "****"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">Pending</p>
              <p className="text-lg font-bold">{showBalance ? formatCurrency(walletData.pending) : "****"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">In Escrow</p>
              <p className="text-lg font-bold">{showBalance ? formatCurrency(walletData.escrow) : "****"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={() => setShowWithdraw(true)}
              className="flex-1 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-12"
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Withdraw
            </Button>
            <Button variant="outline" className="flex-1 border-2 border-white/30 text-white hover:bg-white/10 font-semibold h-12 bg-transparent" onClick={() => handleDownloadStatement()}>
              <Download className="w-5 h-5 mr-2" />
              Statement
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Tabs */}
        <Card className="p-2 mb-4 shadow-lg border-0">
          <div className="flex gap-1">
            {[
              { key: "overview", label: "Overview" },
              { key: "transactions", label: "Transactions" },
              { key: "escrow", label: "Escrow" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.key
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Monthly Earnings */}
            <Card className="p-5 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">This Month</h3>
                <span className="text-xs text-muted-foreground">May 2024</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">Earned</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(walletData.thisMonth)}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Jobs Completed</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">12</p>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-5 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                <Button variant="ghost" size="sm" className="text-emerald-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {withdrawMethods.map((method) => {
                  const IconComponent = method.icon
                  return (
                    <div key={method.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.details}</p>
                      </div>
                      {method.default && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Transactions Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDownloadStatement}
                className="gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("transactions")}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              {transactionsList.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "credit" 
                      ? "bg-emerald-100 dark:bg-emerald-900/30" 
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    {tx.type === "credit" 
                      ? <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      : <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === "credit" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <span className={`text-xs ${
                      tx.status === "completed" ? "text-green-600" : 
                      tx.status === "pending" ? "text-amber-600" : "text-blue-600"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-3">
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">All</Button>
                  <Button size="sm" variant="ghost">Income</Button>
                  <Button size="sm" variant="ghost">Expenses</Button>
                </div>
                <Button size="sm" variant="outline">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>
              </div>
            </Card>

            {transactionsList.map((tx) => (
              <Card key={tx.id} className="p-4 border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    tx.type === "credit" 
                      ? "bg-emerald-100 dark:bg-emerald-900/30" 
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    {tx.type === "credit" 
                      ? <ArrowDownLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      : <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{tx.title}</p>
                    <p className="text-sm text-muted-foreground">{tx.client}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      tx.type === "credit" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs mt-1 ${
                      tx.status === "completed" ? "text-green-600" : 
                      tx.status === "pending" ? "text-amber-600" : "text-blue-600"
                    }`}>
                      {tx.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "escrow" && (
          <div className="space-y-4">
            <Card className="p-5 border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">About Escrow Payments</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Funds are held securely until the job is marked as complete by both parties. 
                    This protects you and ensures payment for your work.
                  </p>
                </div>
              </div>
            </Card>

            {escrowPayments.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-sm">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No Active Escrow</h3>
                <p className="text-sm text-muted-foreground">Funds will appear here when clients pay for jobs</p>
              </Card>
            ) : (
              escrowPayments.map((payment) => (
                <Card key={payment.id} className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{payment.job}</h4>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Client: {payment.client}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Release Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.dueDate}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(walletData.available)}</p>
            </div>

            <div>
              <Label>Amount (KES)</Label>
              <Input 
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Withdraw To</Label>
              <div className="space-y-2 mt-1.5">
                {withdrawMethods.map((method) => {
                  const IconComponent = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setWithdrawMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        withdrawMethod === method.id 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                          : "border-border hover:border-emerald-300"
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.details}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {withdrawError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
              disabled={!withdrawAmount || !withdrawMethod}
              onClick={handleWithdraw}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
