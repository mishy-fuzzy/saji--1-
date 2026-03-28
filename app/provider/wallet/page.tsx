"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ChevronRight,
  Clock,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/lib/auth-context";

type WalletTx = {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
};

export default function ProviderWalletPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [escrowAmount, setEscrowAmount] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [lastMonthEarnings, setLastMonthEarnings] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [transactionsList, setTransactionsList] = useState<WalletTx[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const loadWallet = async () => {
      try {
        const [walletRes, bookingsRes] = await Promise.all([
          fetch("/api/wallet", { cache: "no-store" }),
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
        ]);

        const walletPayload = await walletRes.json();
        const bookingsPayload = await bookingsRes.json();
        const bookings = Array.isArray(bookingsPayload?.data)
          ? bookingsPayload.data
          : [];

        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;

        const pendingStatuses = new Set(["pending"]);
        const escrowStatuses = new Set(["accepted", "assigned", "in-progress"]);
        const completedStatuses = new Set(["completed"]);

        let pending = 0;
        let escrow = 0;
        let thisMonth = 0;
        let prevMonthTotal = 0;
        let completedCount = 0;

        const bookingTx: WalletTx[] = [];

        bookings.forEach((booking: any) => {
          const amount = Number(booking?.amount || 0);
          const status = String(booking?.status || "pending").toLowerCase();
          const createdAt = new Date(booking?.createdAt || Date.now());

          if (pendingStatuses.has(status)) pending += amount;
          if (escrowStatuses.has(status)) escrow += amount;
          if (completedStatuses.has(status)) {
            completedCount += 1;
            bookingTx.push({
              id: `booking-${String(booking?.id || "")}`,
              type: "credit",
              description: `Completed job: ${String(booking?.service?.name || "Service")}`,
              amount,
              date: createdAt.toLocaleDateString(),
              status: "completed",
            });

            if (
              createdAt.getMonth() === month &&
              createdAt.getFullYear() === year
            ) {
              thisMonth += amount;
            }
            if (
              createdAt.getMonth() === prevMonth &&
              createdAt.getFullYear() === prevYear
            ) {
              prevMonthTotal += amount;
            }
          }
        });

        const walletTx = Array.isArray(walletPayload?.data?.transactions)
          ? walletPayload.data.transactions.map((tx: any) => ({
              id: String(tx.id),
              type: String(tx.type || "").toLowerCase(),
              description: String(tx.description || "Wallet transaction"),
              amount: Number(tx.amount || 0),
              date: String(tx.date || ""),
              status: String(tx.status || "pending"),
            }))
          : [];

        setWalletBalance(Number(walletPayload?.data?.balance || 0));
        setPendingAmount(pending);
        setEscrowAmount(escrow);
        setThisMonthEarnings(thisMonth);
        setLastMonthEarnings(prevMonthTotal);
        setJobsCompleted(completedCount);

        const combined = [...bookingTx, ...walletTx];
        setTransactionsList(combined.slice(0, 100));
      } catch {
        setWalletBalance(0);
        setPendingAmount(0);
        setEscrowAmount(0);
        setThisMonthEarnings(0);
        setLastMonthEarnings(0);
        setJobsCompleted(0);
        setTransactionsList([]);
      }
    };

    loadWallet();
  }, [user?.id]);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const percentChange = useMemo(() => {
    if (!lastMonthEarnings) return "0.0";
    const delta =
      ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
    return delta.toFixed(1);
  }, [thisMonthEarnings, lastMonthEarnings]);

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = Number(withdrawAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (amount > walletBalance) {
      setWithdrawError("Insufficient balance");
      return;
    }

    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", amount, method: "wallet" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(payload?.error || "Withdrawal failed");

      setWalletBalance(
        Number(payload?.data?.balance || Math.max(0, walletBalance - amount)),
      );
      setShowWithdraw(false);
      setWithdrawAmount("");
    } catch (error) {
      setWithdrawError(
        error instanceof Error ? error.message : "Withdrawal failed",
      );
    }
  };

  const availableBalance = walletBalance;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      <div className="bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-700 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-900 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Total Balance</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {showBalance ? formatCurrency(walletBalance) : "KES ****"}
                </h1>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  {showBalance ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-100 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                {percentChange}%
              </div>
              <p className="text-xs text-emerald-200">vs last month</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">Available</p>
              <p className="text-lg font-bold">
                {showBalance ? formatCurrency(availableBalance) : "****"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">Pending</p>
              <p className="text-lg font-bold">
                {showBalance ? formatCurrency(pendingAmount) : "****"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-xs text-emerald-100 mb-1">In Escrow</p>
              <p className="text-lg font-bold">
                {showBalance ? formatCurrency(escrowAmount) : "****"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-12"
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Withdraw
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-2 border-white/30 text-white hover:bg-white/10 font-semibold h-12 bg-transparent"
            >
              <Download className="w-5 h-5 mr-2" />
              Statement
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card className="p-2 mb-4 shadow-lg border-0">
          <div className="flex gap-1">
            {["overview", "transactions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab === "overview" ? "Overview" : "Transactions"}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <Card className="p-5 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  This Month
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                    Earned
                  </p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(thisMonthEarnings)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
                    Jobs Completed
                  </p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {jobsCompleted}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Recent Transactions
              </h3>
            </div>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("transactions")}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              {transactionsList.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                  >
                    {tx.amount >= 0 ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {tx.amount >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-3">
            {transactionsList.map((tx) => (
              <Card key={tx.id} className="p-4 border-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.amount >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                  >
                    {tx.amount >= 0 ? (
                      <ArrowDownLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tx.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {tx.amount >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs mt-1 text-muted-foreground">
                      {tx.status === "completed" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {tx.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(availableBalance)}
              </p>
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

            {withdrawError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
              disabled={!withdrawAmount}
              onClick={handleWithdraw}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
