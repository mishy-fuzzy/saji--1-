"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react";
import { useAuthContext } from "../../lib/auth-context";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
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
  sender: "customer" | "provider";
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

export function CustomerMessagesPage() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeChat) ||
      null,
    [conversations, activeChat],
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) =>
          conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conversation.roleLabel
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [conversations, searchQuery],
  );

  const onlineConversations = useMemo(
    () => conversations.filter((conversation) => conversation.online),
    [conversations],
  );

  useEffect(() => {
    if (!user?.id) return;

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
  }, [activeChat, user?.id]);

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
              ? "provider"
              : "customer",
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
      sender: "customer",
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
                sender: "customer",
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

  const renderStatus = (online: boolean) =>
    online ? (
      <span className="text-emerald-600 dark:text-emerald-400">Online now</span>
    ) : (
      <span className="text-muted-foreground">Offline</span>
    );

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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2.5 tracking-wider">
              ONLINE NOW
            </p>
            {onlineConversations.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No providers online right now
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {onlineConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveChat(conversation.id)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="relative">
                      <Image
                        src={conversation.avatar || "/placeholder.svg"}
                        alt={conversation.name}
                        width={44}
                        height={44}
                        className="rounded-full object-cover ring-2 ring-emerald-400 ring-offset-2 ring-offset-background"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-12 text-center">
                      {conversation.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveChat(conversation.id)}
                className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b dark:border-gray-700 last:border-0 ${activeChat === conversation.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
              >
                <div className="relative shrink-0">
                  <Image
                    src={conversation.avatar || "/placeholder.svg"}
                    alt={conversation.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12"
                  />
                  {conversation.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {conversation.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {conversation.roleLabel}
                    </span>
                    {conversation.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                        {conversation.unread}
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
          {activeChat && selectedConversation ? (
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
                    src={selectedConversation.avatar || "/placeholder.svg"}
                    alt={selectedConversation.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {renderStatus(selectedConversation.online)}
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
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-linear-to-b from-blue-50/30 to-transparent dark:from-blue-950/10">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${message.sender === "customer" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${message.sender === "customer" ? "text-blue-100" : "text-muted-foreground"}`}
                      >
                        <span className="text-[10px]">{message.time}</span>
                        {message.sender === "customer" &&
                          (message.status === "read" ? (
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() =>
                      alert("Attachment tools can be connected here")
                    }
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => alert("Media picker can be connected here")}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMessageInput(e.target.value)
                    }
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                      e.key === "Enter" && handleSendMessage()
                    }
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
              Select a conversation to start chatting with service providers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
