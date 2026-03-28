"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import ProviderSidebar from "@/components/provider-sidebar";
import { Bell, X } from "lucide-react";

type ProviderNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionHref?: string;
  createdAt: string;
};

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState<ProviderNotification[]>(
    [],
  );
  const [showNotifications, setShowNotifications] = useState(false);

  // Apply theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "provider")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "provider") return;

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) {
          setNotifications([]);
          return;
        }

        const payload = await res.json();
        setNotifications(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 25000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, user?.role]);

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Keep optimistic UI state if request fails.
    }
  };

  const removeNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));

    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      // Keep optimistic UI state if request fails.
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading || !isAuthenticated || user?.role !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Bell - Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-40 flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Provider
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <ProviderSidebar
        unreadNotifications={unreadCount}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
      />

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0 pt-14 lg:pt-0">
        {children}
      </main>

      {/* Notifications Panel - Mobile */}
      {showNotifications && (
        <div
          className="lg:hidden fixed inset-0 top-14 bg-black/50 z-50"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notif.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p
                          className={`font-semibold text-sm ${!notif.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notif.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
