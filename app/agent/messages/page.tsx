"use client"

import { useEffect, useState } from "react"
import { Search, Send, ArrowLeft } from "lucide-react"
import { useAuthContext } from "@/lib/auth-context"
import { fetchMessageThreads } from "@/lib/services/messages-service"

const conversations = [
  { id: 1, name: "John Smith", role: "Provider", lastMsg: "The customer hasn't paid yet", time: "5m", unread: 2, avatar: "J" },
  { id: 2, name: "Alice Johnson", role: "Customer", lastMsg: "When will my refund be processed?", time: "20m", unread: 1, avatar: "A" },
  { id: 3, name: "Admin Office", role: "Admin", lastMsg: "Escalated case DSP-045 to you", time: "1h", unread: 0, avatar: "AO" },
  { id: 4, name: "Emma Davis", role: "Provider", lastMsg: "I've completed the work, please verify", time: "3h", unread: 0, avatar: "E" },
]

export default function AgentMessagesPage() {
  const { user } = useAuthContext()
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [msg, setMsg] = useState("")
  const [search, setSearch] = useState("")
  const [conversationState, setConversationState] = useState(conversations)
  const [messages, setMessages] = useState<{[k:number]:{text:string;from:string;time:string}[]}>({
    1: [{text:"Hi, the customer hasn't paid for the job yet",from:"them",time:"10:30 AM"},{text:"Let me check the transaction status",from:"me",time:"10:32 AM"},{text:"The customer hasn't paid yet",from:"them",time:"10:45 AM"}],
    2: [{text:"When will my refund be processed?",from:"them",time:"9:15 AM"},{text:"I'm looking into this now. Should be within 48 hours.",from:"me",time:"9:20 AM"}],
    3: [{text:"Escalated case DSP-045 to you. High priority.",from:"them",time:"8:00 AM"}],
    4: [{text:"I've completed the work as requested",from:"them",time:"Yesterday"},{text:"Great, let me verify with the customer",from:"me",time:"Yesterday"},{text:"I've completed the work, please verify",from:"them",time:"6:00 AM"}],
  })

  const active = conversations.find(c=>c.id===activeChat)
  const activeFromState = conversationState.find(c=>c.id===activeChat)
  const chatMsgs = activeChat ? messages[activeChat] || [] : []
  const filtered = conversationState.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()))

  const getAutoReply = (role: string) => {
    if (role === "Provider") return "Received. I can share proof of payment in a moment."
    if (role === "Customer") return "Thanks for the update. I will escalate this case now."
    return "Message received. I will get back to you shortly."
  }

  useEffect(() => {
    let mounted = true

    const hydrateFromThreads = async () => {
      if (!user?.id) return
      try {
        const payload = await fetchMessageThreads(user.id)
        if (!mounted) return

        const adminThread = payload.threads.find((thread) =>
          thread.members.some((member) => /admin/i.test(member.user.name) || /admin/i.test(member.user.email)),
        )

        if (!adminThread) return

        const latest = adminThread.messages[0]
        const lastMessage = latest?.body || "No messages yet"

        const threadMessages = adminThread.messages
          .slice()
          .reverse()
          .map((message) => ({
            text: message.body,
            from: message.senderId === user.id ? "me" : "them",
            time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
          }))

        setMessages((prev) => ({
          ...prev,
          3: threadMessages,
        }))

        setConversationState((prev) =>
          prev.map((conv) =>
            conv.id === 3
              ? {
                  ...conv,
                  lastMsg: lastMessage,
                  time: "Now",
                }
              : conv,
          ),
        )
      } catch {
        // Keep current UI data when thread hydration fails.
      }
    }

    hydrateFromThreads()
    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleSend = () => {
    if (!msg.trim()||!activeChat) return

    const now = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    const outgoing = { text: msg, from: "me", time: now }
    const outgoingText = msg

    setMessages(prev=>({...prev,[activeChat]:[...(prev[activeChat]||[]),outgoing]}))
    setConversationState((prev) => prev.map((conv) => conv.id === activeChat ? { ...conv, lastMsg: outgoingText, time: "Just now" } : conv))

    if (activeChat === 3) {
      setConversationState((prev) => prev.map((conv) => conv.id === 3 ? { ...conv, lastMsg: outgoingText, time: "Just now" } : conv))
    } else {
      const targetConversation = conversationState.find((conv) => conv.id === activeChat)
      const autoReply = getAutoReply(targetConversation?.role || "")
      const targetId = activeChat

      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
        setMessages((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), { text: autoReply, from: "them", time: replyTime }],
        }))
        setConversationState((prev) => prev.map((conv) => conv.id === targetId ? { ...conv, lastMsg: autoReply, time: "Just now" } : conv))
      }, 1200)
    }

    setMsg("")
  }

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className={`${activeChat?"hidden sm:flex":"flex"} flex-col w-full sm:w-80 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-700 dark:text-gray-200"/></div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map(c=>(
            <button key={c.id} onClick={()=>setActiveChat(c.id)} className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${activeChat===c.id?"bg-indigo-50 dark:bg-indigo-900/20":""}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p><span className="text-[10px] text-gray-400 flex-shrink-0">{c.time}</span></div>
                <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
              </div>
              {c.unread>0&&<span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className={`${activeChat?"flex":"hidden sm:flex"} flex-col flex-1`}>
        {activeFromState?(<>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <button onClick={()=>setActiveChat(null)} className="sm:hidden text-gray-600"><ArrowLeft size={20}/></button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">{activeFromState.avatar}</div>
            <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{activeFromState.name}</p><p className="text-[10px] text-gray-500">{activeFromState.role}</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMsgs.map((m,i)=>(<div key={i} className={`flex ${m.from==="me"?"justify-end":"justify-start"}`}><div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.from==="me"?"bg-indigo-600 text-white rounded-br-sm":"bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"}`}><p>{m.text}</p><p className={`text-[9px] mt-1 ${m.from==="me"?"text-indigo-200":"text-gray-400"}`}>{m.time}</p></div></div>))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white"/>
            <button onClick={handleSend} className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700"><Send size={16}/></button>
          </div>
        </>):(<div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Select a conversation</p></div>)}
      </div>
    </div>
  )
}
