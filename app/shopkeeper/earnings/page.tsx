"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Wallet,
  Calendar,
  Download,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Building2,
  Globe,
  ChevronRight,
  X,
  ArrowLeft,
  Clock,
} from "lucide-react";

type EarningTransaction = {
  id: string;
  type: "Sale" | "Withdrawal";
  description: string;
  amount: string;
  date: string;
  status: string;
};

type EarningsPayload = {
  currency: string;
  totalEarnings: number;
  thisMonth: number;
  available: number;
  pending: number;
  transactions: EarningTransaction[];
};

const initialData: EarningsPayload = {
  currency: "KES",
  totalEarnings: 0,
  thisMonth: 0,
  available: 0,
  pending: 0,
  transactions: [],
};

export default function ShopkeeperEarningsPage() {
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earningsData, setEarningsData] =
    useState<EarningsPayload>(initialData);

  const paymentMethods = [
    {
      id: "mpesa",
      name: "M-Pesa",
      icon: Smartphone,
      description: "Send to M-Pesa account",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: Building2,
      description: "Direct to your bank account",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: Globe,
      description: "Transfer to PayPal wallet",
    },
  ];

  const money = useMemo(() => {
    const curr = earningsData.currency || "KES";
    return {
      totalEarnings: `${curr} ${earningsData.totalEarnings.toLocaleString()}`,
      thisMonth: `${curr} ${earningsData.thisMonth.toLocaleString()}`,
      available: `${curr} ${earningsData.available.toLocaleString()}`,
      pending: `${curr} ${earningsData.pending.toLocaleString()}`,
    };
  }, [earningsData]);

  const loadEarnings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shopkeeper/earnings", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to load earnings");
      }
      setEarningsData(payload.data as EarningsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
      setEarningsData(initialData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const handleWithdrawClick = () => {
    setShowWithdrawDialog(true);
    setWithdrawStep(1);
    setWithdrawAmount("");
    setSelectedPaymentMethod(null);
    setError("");
    setSuccess("");
  };

  const handleAmountSubmit = () => {
    setError("");
    const amount = Number.parseFloat(withdrawAmount);

    if (!withdrawAmount || Number.isNaN(amount)) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount < 100) {
      setError("Minimum withdrawal amount is KES 100");
      return;
    }

    if (amount > earningsData.available) {
      setError(
        `Amount exceeds available balance of KES ${earningsData.available.toLocaleString()}`,
      );
      return;
    }

    setWithdrawStep(2);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setWithdrawStep(3);
  };

  const handleConfirmWithdrawal = async () => {
    if (!selectedPaymentMethod || !withdrawAmount) {
      setError("Invalid withdrawal details");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const amount = Number.parseFloat(withdrawAmount);
      const method = paymentMethods.find((m) => m.id === selectedPaymentMethod);

      const response = await fetch("/api/shopkeeper/earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: selectedPaymentMethod,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to process withdrawal");
      }

      setSuccess(
        `Successfully initiated withdrawal of KES ${amount.toLocaleString()} to ${method?.name}`,
      );
      await loadEarnings();

      setTimeout(() => {
        setShowWithdrawDialog(false);
        setWithdrawStep(1);
        setWithdrawAmount("");
        setSelectedPaymentMethod(null);
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process withdrawal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowWithdrawDialog(false);
    setWithdrawStep(1);
    setWithdrawAmount("");
    setSelectedPaymentMethod(null);
    setError("");
  };

  const exportTransactions = () => {
    const data = {
      exportDate: new Date().toISOString(),
      currency: earningsData.currency,
      summary: {
        totalEarnings: earningsData.totalEarnings,
        thisMonth: earningsData.thisMonth,
        available: earningsData.available,
        pending: earningsData.pending,
      },
      transactions: earningsData.transactions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopkeeper-earnings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Earnings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your shop earnings and withdrawals
          </p>
        </div>

        {success && (
          <Card className="p-4 mb-6 border-0 shadow-lg bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-600">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {success}
                </p>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-4 mb-6 border-0 shadow-lg bg-red-50 dark:bg-red-900/30 border-l-4 border-red-600">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Earnings
              </p>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {money.totalEarnings}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              All time earnings
            </p>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                This Month
              </p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {money.thisMonth}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Current month
            </p>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Available
              </p>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {money.available}
            </p>
            <Button
              onClick={handleWithdrawClick}
              className="w-full mt-4 bg-amber-600 hover:bg-amber-700 h-9 font-medium"
              disabled={isLoading}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Withdraw Funds
            </Button>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Pending
              </p>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {money.pending}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              Processing
            </p>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Transaction History
            </h2>
            <Button
              variant="outline"
              className="bg-transparent gap-2"
              onClick={exportTransactions}
              disabled={earningsData.transactions.length === 0}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Description
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Amount
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Date
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="p-6 text-sm text-gray-500" colSpan={5}>
                      Loading transactions...
                    </td>
                  </tr>
                )}
                {!isLoading && earningsData.transactions.length === 0 && (
                  <tr>
                    <td className="p-6 text-sm text-gray-500" colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {earningsData.transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-6 text-sm text-gray-900 dark:text-white font-medium">
                      {tx.type}
                    </td>
                    <td className="p-6 text-sm text-gray-600 dark:text-gray-400">
                      {tx.description}
                    </td>
                    <td
                      className={`p-6 text-sm font-semibold ${tx.amount.startsWith("+") ? "text-emerald-600" : "text-orange-600"}`}
                    >
                      {tx.amount}
                    </td>
                    <td className="p-6 text-sm text-gray-600 dark:text-gray-400">
                      {tx.date}
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : tx.status === "Failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={showWithdrawDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Step {withdrawStep} of 3
              </p>
            </div>
            <button
              onClick={handleCloseDialog}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="py-6">
            {withdrawStep === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your available balance:{" "}
                    <span className="font-bold text-foreground">
                      {money.available}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Withdrawal Amount (KES)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      KES
                    </span>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter amount (minimum 100)"
                      className="pl-12"
                      min="100"
                      max={earningsData.available}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum withdrawal: KES 100
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAmountSubmit}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {withdrawStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Withdraw{" "}
                  <span className="font-bold text-foreground">
                    KES{" "}
                    {Number.parseFloat(withdrawAmount || "0").toLocaleString()}
                  </span>
                </p>
                <p className="text-sm font-medium text-foreground">
                  Select payment method:
                </p>

                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <Icon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {method.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawStep(1)}
                    className="flex-1 bg-transparent gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>
              </div>
            )}

            {withdrawStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-foreground">
                      KES{" "}
                      {Number.parseFloat(
                        withdrawAmount || "0",
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="font-semibold text-foreground">
                      {
                        paymentMethods.find(
                          (m) => m.id === selectedPaymentMethod,
                        )?.name
                      }
                    </p>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">New Balance</p>
                    <p className="font-semibold text-emerald-600">
                      KES{" "}
                      {(
                        earningsData.available -
                        Number.parseFloat(withdrawAmount || "0")
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    This withdrawal will be processed immediately if your wallet
                    balance is sufficient.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawStep(2)}
                    className="flex-1 bg-transparent gap-2"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmWithdrawal}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
