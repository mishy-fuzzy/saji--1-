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
  Check,
  CheckCheck,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  jobTitle: string;
};

type ChatMessage = {
  id: string;
  sender: "client" | "provider";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
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

export default function ProviderMessagesPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = useMemo(
    () => conversations.find((conv) => conv.id === activeChat) || null,
    [conversations, activeChat],
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (conv) =>
          conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [conversations, searchQuery],
  );

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch("/api/messages", { cache: "no-store" });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: Conversation[] = rows.map((row: any) => ({
          id: String(row?.peer?.id || ""),
          name: String(row?.peer?.name || "User"),
          avatar: String(row?.peer?.image || "/placeholder.svg"),
          lastMessage: String(row?.lastMessage || ""),
          time: toTime(row?.createdAt || new Date()),
          unread: Number(row?.unread || 0),
          online: Boolean(
            row?.peer?.online || isRecentlyActive(row?.peer?.lastLoginAt),
          ),
          jobTitle: String(row?.peer?.role || "Client"),
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
          `/api/messages?withUserId=${encodeURIComponent(activeChat)}`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: ChatMessage[] = rows.map((row: any) => ({
          id: String(row?.id || ""),
          sender:
            String(row?.senderId || "") === String(activeChat)
              ? "client"
              : "provider",
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
      sender: "provider",
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
      if (!response.ok || !payload?.ok)
        throw new Error(payload?.error || "Failed to send message");

      const row = payload?.data;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimistic.id
            ? {
                id: String(row?.id || optimistic.id),
                sender: "provider",
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
            <button className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
              All
            </button>
            <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg">
              Unread
            </button>
            <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg">
              Active
            </button>
          </div>

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
                    src={conv.avatar}
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
                      {conv.jobTitle}
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
          {activeChat && selectedChat ? (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Image
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.online
                        ? "Online now"
                        : selectedChat.jobTitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-linear-to-b from-blue-50/30 to-transparent dark:from-blue-950/10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "provider" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.sender === "provider" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === "provider" ? "text-blue-100" : "text-muted-foreground"}`}
                      >
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.sender === "provider" &&
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
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="border-0 focus-visible:ring-0"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
