"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Plus,
  Search,
  Send,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  roleLabel: string;
};

type ChatMessage = {
  id: string;
  sender: "admin" | "peer";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
};

type UserOption = {
  id: string;
  name: string;
  role: string;
  email: string;
};

function toTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isRecentlyActive(value?: string | Date | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 10 * 60 * 1000;
}

function toTitleCase(value: string): string {
  if (!value) return "User";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AdminMessagesPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<UserOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = useMemo(
    () => conversations.find((c) => c.id === activeChat) || null,
    [conversations, activeChat],
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (conv) =>
          conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.roleLabel.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [conversations, searchQuery],
  );

  const filteredContacts = useMemo(() => {
    const normalized = contactQuery.trim().toLowerCase();
    const candidates = contacts.filter((item) => item.id !== activeChat);
    if (!normalized) return candidates;
    return candidates.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.email.toLowerCase().includes(normalized) ||
        item.role.toLowerCase().includes(normalized),
    );
  }, [contacts, activeChat, contactQuery]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch("/api/admin/users?includeDeleted=false", {
          cache: "no-store",
        });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: UserOption[] = rows
          .map((row: any) => ({
            id: String(row?.id || ""),
            name: String(row?.name || "User"),
            role: toTitleCase(String(row?.role || "user")),
            email: String(row?.email || ""),
          }))
          .filter((row: UserOption) => row.id);

        setContacts(mapped);
      } catch {
        setContacts([]);
      }
    };

    loadContacts();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch("/api/messages", { cache: "no-store" });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: Conversation[] = rows
          .map((row: any) => ({
            id: String(row?.peer?.id || ""),
            name: String(row?.peer?.name || "User"),
            avatar: String(row?.peer?.image || "/placeholder.svg"),
            lastMessage: String(row?.lastMessage || ""),
            time: toTime(row?.createdAt || new Date()),
            unread: Number(row?.unread || 0),
            online: Boolean(
              row?.peer?.online || isRecentlyActive(row?.peer?.lastLoginAt),
            ),
            roleLabel: toTitleCase(String(row?.peer?.role || "user")),
          }))
          .filter((row: Conversation) => row.id);

        setConversations(mapped);
        if (!activeChat && mapped.length > 0) {
          setActiveChat(mapped[0].id);
        }
      } catch {
        setConversations([]);
      }
    };

    loadConversations();
    const intervalId = window.setInterval(loadConversations, 10000);
    return () => window.clearInterval(intervalId);
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const loadThread = async () => {
      try {
        const response = await fetch(
          `/api/messages?withUserId=${encodeURIComponent(activeChat)}`,
          { cache: "no-store" },
        );
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: ChatMessage[] = rows.map((row: any) => ({
          id: String(row?.id || ""),
          sender:
            String(row?.senderId || "") === String(activeChat)
              ? "peer"
              : "admin",
          text: String(row?.text || ""),
          time: toTime(row?.createdAt || new Date()),
          status: "read",
        }));

        setMessages(mapped);
      } catch {
        setMessages([]);
      }
    };

    loadThread();
    const intervalId = window.setInterval(loadThread, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartChat = (user: UserOption) => {
    setActiveChat(user.id);
    setShowCompose(false);
    setContactQuery("");
    setConversations((prev) => {
      if (prev.some((item) => item.id === user.id)) return prev;
      return [
        {
          id: user.id,
          name: user.name,
          avatar: "/placeholder.svg",
          lastMessage: "",
          time: "",
          unread: 0,
          online: false,
          roleLabel: user.role,
        },
        ...prev,
      ];
    });
  };

  const handleSendMessage = async () => {
    if (!activeChat || !messageInput.trim() || isSending) return;

    const text = messageInput.trim();
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "admin",
      text,
      time: toTime(new Date()),
      status: "sent",
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeChat, text }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to send message");
      }

      const row = payload?.data;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimistic.id
            ? {
                id: String(row?.id || optimistic.id),
                sender: "admin",
                text,
                time: toTime(row?.createdAt || new Date()),
                status: "delivered",
              }
            : msg,
        ),
      );

      const selectedName =
        selectedChat?.name || contacts.find((item) => item.id === activeChat)?.name || "User";
      const selectedRole =
        selectedChat?.roleLabel ||
        contacts.find((item) => item.id === activeChat)?.role ||
        "User";

      setConversations((prev) => {
        const existing = prev.find((item) => item.id === activeChat);
        const nextItem: Conversation = {
          id: activeChat,
          name: existing?.name || selectedName,
          avatar: existing?.avatar || "/placeholder.svg",
          lastMessage: text,
          time: toTime(row?.createdAt || new Date()),
          unread: existing?.unread || 0,
          online: existing?.online || false,
          roleLabel: existing?.roleLabel || selectedRole,
        };
        const remaining = prev.filter((item) => item.id !== activeChat);
        return [nextItem, ...remaining];
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  const chatHeader =
    selectedChat || contacts.find((item) => item.id === activeChat)
      ? {
          name:
            selectedChat?.name ||
            contacts.find((item) => item.id === activeChat)?.name ||
            "User",
          roleLabel:
            selectedChat?.roleLabel ||
            contacts.find((item) => item.id === activeChat)?.role ||
            "User",
          avatar: selectedChat?.avatar || "/placeholder.svg",
          online: selectedChat?.online || false,
        }
      : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto flex h-screen lg:h-[calc(100vh-2rem)] lg:my-4 lg:rounded-2xl overflow-hidden shadow-xl">
        <div
          className={`w-full lg:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col ${activeChat ? "hidden lg:flex" : "flex"}`}
        >
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Messages
              </h1>
              <Button size="sm" onClick={() => setShowCompose((prev) => !prev)}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {showCompose && (
            <div className="border-b dark:border-gray-700 p-3 space-y-3 bg-blue-50/50 dark:bg-blue-950/10">
              <Input
                placeholder="Find user by name, email, or role"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
              />
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-white dark:bg-gray-800">
                {filteredContacts.slice(0, 20).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartChat(user)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.role} • {user.email}
                    </p>
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No users found.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv.id)}
                className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b dark:border-gray-700 last:border-0 ${
                  activeChat === conv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Image
                    src={conv.avatar || "/placeholder.svg"}
                    alt={conv.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {conv.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {conv.lastMessage || "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {conv.roleLabel}
                    </span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No conversations found.
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${activeChat ? "flex" : "hidden lg:flex"}`}
        >
          {activeChat && chatHeader ? (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Image
                  src={chatHeader.avatar || "/placeholder.svg"}
                  alt={chatHeader.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {chatHeader.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {chatHeader.online ? "Online now" : chatHeader.roleLabel}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_35%)]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        msg.sender === "admin"
                          ? "bg-emerald-500 text-white rounded-br-sm"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${
                          msg.sender === "admin"
                            ? "text-emerald-50"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.sender === "admin" &&
                          (msg.status === "read" ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <Card className="m-3 p-2 border border-border shadow-sm">
                <div className="flex items-center gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="h-9"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a conversation or start a new chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
