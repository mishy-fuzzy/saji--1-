"use client";

import { useLocalization } from "@/lib/hooks/useLocalization";
import {
  Bell,
  Search,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  Settings,
  Palette,
  BellIcon,
  X,
  CheckCircle,
  AlertCircle,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type HeaderNotification = {
  id: string;
  type: "user" | "warning" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionHref?: string;
};

type HeaderMessage = {
  id: string;
  sender: string;
  message: string;
  time: string;
  unread: boolean;
};

type AdminHeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarHidden?: boolean;
};

export function AdminHeader({
  onToggleSidebar,
  isSidebarHidden = false,
}: AdminHeaderProps) {
  const { currency, setCurrency, theme, setTheme } = useLocalization();
  const { logout } = useAuthContext();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [messages, setMessages] = useState<HeaderMessage[]>([]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        messagesRef.current &&
        !messagesRef.current.contains(event.target as Node)
      ) {
        setShowMessages(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const normalizeType = (value: string): HeaderNotification["type"] => {
      const lower = value.toLowerCase();
      if (lower === "warning") return "warning";
      if (lower === "success") return "success";
      if (lower === "user") return "user";
      return "info";
    };

    const formatTime = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "Just now";
      return date.toLocaleString();
    };

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unreadOnly=true", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return;
        }

        const items = payload.data.map((item: any) => ({
          id: String(item.id),
          type: normalizeType(String(item.type || "info")),
          title: String(item.title || "Notification"),
          message: String(item.message || ""),
          read: Boolean(item.read),
          actionHref: item.actionHref ? String(item.actionHref) : undefined,
          time: formatTime(String(item.createdAt || "")),
        })) as HeaderNotification[];

        setNotifications(items);

        const messageItems: HeaderMessage[] = items
          .filter((item) =>
            item.title.toLowerCase().startsWith("new message from "),
          )
          .map((item) => {
            const sender = item.title
              .toLowerCase()
              .startsWith("new message from ")
              ? item.title.slice("new message from ".length)
              : "User";

            return {
              id: item.id,
              sender: sender || "User",
              message: item.message,
              time: item.time,
              unread: !item.read,
            };
          });

        setMessages(messageItems);
      } catch {
        // Keep UI responsive even if notifications endpoint is unavailable.
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setIsDark(newTheme === "dark");
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    router.push("/");
  };

  const markMessageAsRead = async (messageId: string) => {
    await markNotificationAsRead(messageId);
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((item) => item.id !== notificationId),
        );
      }
    } catch {
      // Keep local UI stable if patch fails.
    }
  };

  const unreadNotificationsList = notifications.filter((n) => !n.read);

  const unreadNotifications = unreadNotificationsList.length;
  const unreadMessages = messages.length;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
            title={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            {isSidebarHidden ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <div className="relative hidden sm:block min-w-0 flex-1 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm overflow-hidden text-ellipsis"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMessages(false);
              }}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {unreadNotificationsList.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      No unread notifications
                    </div>
                  )}
                  {unreadNotificationsList.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (notif.type === "info" || notif.type === "user") {
                          markMessageAsRead(notif.id);
                          setShowNotifications(false);
                          router.push("/admin/messages");
                          return;
                        }

                        markNotificationAsRead(notif.id);
                        if (notif.actionHref) {
                          setShowNotifications(false);
                          router.push(notif.actionHref);
                        }
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors bg-blue-50 dark:bg-blue-900/20"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            notif.type === "user"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : notif.type === "warning"
                                ? "bg-yellow-100 dark:bg-yellow-900/30"
                                : notif.type === "success"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                                  : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          {notif.type === "success" && (
                            <CheckCircle
                              size={18}
                              className="text-emerald-600"
                            />
                          )}
                          {notif.type === "warning" && (
                            <AlertCircle
                              size={18}
                              className="text-yellow-600"
                            />
                          )}
                          {(notif.type === "user" || notif.type === "info") && (
                            <Bell
                              size={18}
                              className={
                                notif.type === "user"
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {notif.title}
                            </p>
                            <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/admin/announcements");
                    }}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => {
                setShowMessages(!showMessages);
                setShowNotifications(false);
              }}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare
                size={20}
                className="text-gray-600 dark:text-gray-300"
              />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>

            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Messages
                  </h3>
                  <button
                    onClick={() => setShowMessages(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {messages.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      No unread messages
                    </div>
                  )}
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        markMessageAsRead(msg.id);
                        setShowMessages(false);
                        router.push("/admin/messages");
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                          {msg.sender.split(" ")[0][0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {msg.sender}
                            </p>
                            <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {msg.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => router.push("/admin/messages")}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Open Messages
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
          >
            {isDark ? (
              <Sun size={20} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none text-sm hidden md:block"
          >
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-lg transition-shadow"
            >
              A
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Admin User
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    admin@example.com
                  </p>
                </div>

                <Link
                  href="/admin/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <User size={18} />
                  <span>Admin Profile</span>
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
