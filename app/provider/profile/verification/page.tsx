"use client";

import { ArrowLeft, Check, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationItem = {
  id: string;
  type: string;
  status: "verified" | "pending";
  date: string;
};

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        const payload = await response.json();
        const user = payload?.user || {};
        const createdDate = user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "-";

        const items: VerificationItem[] = [
          {
            id: "email",
            type: "Email",
            status: user?.emailVerified ? "verified" : "pending",
            date: createdDate,
          },
          {
            id: "phone",
            type: "Phone",
            status: user?.phone ? "verified" : "pending",
            date: createdDate,
          },
        ];

        setVerifications(items);
      } catch {
        setVerifications([]);
      }
    };

    loadVerification();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Verification</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <div className="space-y-3">
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {verification.status === "verified" ? (
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {verification.type}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {verification.date}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    verification.status === "verified"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {verification.status === "verified" ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
