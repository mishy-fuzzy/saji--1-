"use client";

import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type WalletTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
};

export default function PaymentMethodsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await fetch("/api/wallet", { cache: "no-store" });
        const payload = await response.json();
        const data = payload?.data || {};

        setBalance(Number(data.balance || 0));
        setCurrency(String(data.currency || "KES"));
        setTransactions(
          Array.isArray(data.transactions) ? data.transactions : [],
        );
      } catch {
        setBalance(0);
        setCurrency("KES");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/provider/profile"
              className="lg:hidden hover:bg-blue-500/50 p-2 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Payment Activity</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6 py-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Wallet Balance
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {currency} {balance.toLocaleString()}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            Loading payment activity...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              No Payment Activity
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Wallet transactions and payouts will appear here once available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {tx.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tx.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${tx.status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}
                  >
                    {tx.status}
                  </span>
                  <span
                    className={`font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {tx.amount >= 0 ? "+" : "-"} {currency}{" "}
                    {Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
