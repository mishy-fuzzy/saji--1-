"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  ImageIcon,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

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
  sender: "customer" | "shopkeeper";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
};

const MESSAGES_ENDPOINT = "/api/messages";

function toTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ShopkeeperMessagesPage() {
  const searchParams = useSearchParams();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "pending">(
    "all",
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (customerId) {
      setActiveChat(customerId);
    }
  }, [searchParams]);

  const selectedChat = useMemo(
    () => conversations.find((c) => c.id === activeChat) || null,
    [conversations, activeChat],
  );

  const filteredConversations = useMemo(() => {
    const bySearch = conversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.roleLabel.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (filterType === "unread") {
      return bySearch.filter((conv) => conv.unread > 0);
    }

    if (filterType === "pending") {
      return bySearch.filter((conv) => conv.lastMessage.trim().length > 0);
    }

    return bySearch;
  }, [conversations, searchQuery, filterType]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch(`${MESSAGES_ENDPOINT}?limit=300`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to load conversations");
        }
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: Conversation[] = rows.map((row: any) => ({
          id: String(row?.peer?.id || ""),
          name: String(row?.peer?.name || "User"),
          avatar: String(row?.peer?.image || "/placeholder.svg"),
          lastMessage: String(row?.lastMessage || ""),
          time: toTime(row?.createdAt || new Date()),
          unread: Number(row?.unread || 0),
          online: false,
          roleLabel: String(row?.peer?.role || "User"),
        }));

        setConversations(mapped);
        if (!activeChat && mapped.length > 0) {
          setActiveChat(mapped[0].id);
        }
      } catch {
        setConversations([]);
      }
    };

    loadConversations();
    const intervalId = window.setInterval(loadConversations, 15000);
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
          `${MESSAGES_ENDPOINT}?withUserId=${encodeURIComponent(activeChat)}&limit=500`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to load message thread");
        }
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: ChatMessage[] = rows.map((row: any) => ({
          id: String(row?.id || ""),
          sender:
            String(row?.senderId || "") === String(activeChat)
              ? "customer"
              : "shopkeeper",
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
    const intervalId = window.setInterval(loadThread, 10000);
    return () => window.clearInterval(intervalId);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!activeChat || !messageInput.trim() || isSending) return;

    const text = messageInput.trim();
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "shopkeeper",
      text,
      time: toTime(new Date()),
      status: "sent",
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");
    setIsSending(true);

    try {
      const response = await fetch(MESSAGES_ENDPOINT, {
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
                sender: "shopkeeper",
                text,
                time: toTime(row?.createdAt || new Date()),
                status: "delivered",
              }
            : msg,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto flex h-screen lg:h-[calc(100vh-2rem)] lg:my-4 lg:rounded-2xl overflow-hidden shadow-xl">
        <div
          className={`w-full lg:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col ${activeChat ? "hidden lg:flex" : "flex"}`}
        >
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Messages
            </h1>
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

          <div className="flex gap-1 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg ${filterType === "all" ? "text-white bg-amber-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("unread")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg ${filterType === "unread" ? "text-white bg-amber-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterType("pending")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg ${filterType === "pending" ? "text-white bg-amber-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              Pending
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv.id)}
                className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b dark:border-gray-700 last:border-0 ${
                  activeChat === conv.id
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : ""
                }`}
              >
                <div className="relative flex-shrink-0">
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
                    <span className="text-xs text-amber-600 dark:text-amber-400 truncate">
                      {conv.roleLabel}
                    </span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
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
          {activeChat && selectedChat ? (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative flex-shrink-0">
                    <Image
                      src={selectedChat.avatar || "/placeholder.svg"}
                      alt={selectedChat.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover w-11 h-11"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.roleLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hidden sm:flex"
                  >
                    <Phone className="w-5 h-5 text-amber-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hidden sm:flex"
                  >
                    <Video className="w-5 h-5 text-amber-600" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Open Thread</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "shopkeeper" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.sender === "shopkeeper"
                          ? "bg-amber-600 text-white rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${msg.sender === "shopkeeper" ? "justify-end" : "justify-start"}`}
                      >
                        <span className="text-[10px] opacity-70">
                          {msg.time}
                        </span>
                        {msg.sender === "shopkeeper" &&
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

              <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                  />
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className="bg-amber-600 hover:bg-amber-700 rounded-full p-2 w-10 h-10"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
