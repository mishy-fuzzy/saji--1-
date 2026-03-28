"use client";

import { useEffect, useState } from "react";
import { Bell, Settings, User, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      message: string;
      time: string;
      read: boolean;
      actionHref?: string;
    }[]
  >([]);

  useEffect(() => {
    const formatTime = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "Just now";
      return date.toLocaleString();
    };

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unreadOnly=true", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return;
        }

        setNotifications(
          payload.data.map((item: any) => ({
            id: String(item.id),
            title: String(item.title || "Notification"),
            message: String(item.message || ""),
            time: formatTime(String(item.createdAt || "")),
            read: Boolean(item.read),
            actionHref: item.actionHref ? String(item.actionHref) : undefined,
          })),
        );
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Keep optimistic UI state if marking as read fails.
    }
  };

  const handleLogout = () => {
    console.log(" Logging out user");
    setShowLogout(false);
    // Redirect to login
    window.location.href = "/";
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-10 lg:ml-0">
        {/* Left spacer for mobile */}
        <div className="w-10 lg:hidden" />

        {/* Right side actions */}
        <div className="flex items-center gap-4 ml-auto relative">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      No unread notifications
                    </div>
                  )}
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        setShowNotifications(false);
                        if (notif.actionHref) {
                          router.push(notif.actionHref);
                        }
                      }}
                      className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <p className="text-sm text-gray-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notif.time}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/subadmin/reports");
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings size={20} />
          </button>

          {showSettings && (
            <div className="absolute right-12 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <a
                href="/admin/settings"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
              >
                Global Settings
              </a>
              <a
                href="/admin/profile"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Profile Settings
              </a>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Logout
              </h2>
              <button onClick={() => setShowLogout(false)}>
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
