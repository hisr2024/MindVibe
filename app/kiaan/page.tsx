'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { KiaanLogo } from '@/src/components/KiaanLogo'

type Message = {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
}

export default function KiaanChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content) return

    const userMessage: Message = { sender: 'user', text: content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const data = await response.json()
      const assistant: Message = {
        sender: 'assistant',
        text: data.response || 'I am here for you with a calm response.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistant])
    } catch {
      const assistant: Message = {
        sender: 'assistant',
        text: 'I could not reach the guidance service. Please try again.',
        timestamp: new Date().toISOString(),
        status: 'error'
      }
      setMessages(prev => [...prev, assistant])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-orange-500/15 bg-[#0d0d10]/95 backdrop-blur px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <KiaanLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Talk to KIAAN
              </h1>
              <p className="text-xs text-orange-100/60">Your calm AI companion</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-orange-100/60 hover:text-orange-200 transition">
            ← Home
          </Link>
        </div>
      </header>

      {/* Scrollable Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-orange-100/60 text-sm">Start a conversation with KIAAN</p>
              <p className="text-orange-100/40 text-xs mt-2">Your messages are private and secure</p>
            </div>
          )}
          {messages.map((message, idx) => (
            <div
              key={`${message.timestamp}-${idx}`}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/15 border border-orange-500/30'
                    : message.status === 'error'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-black/50 border border-orange-500/20'
                }`}
              >
                <p className="text-sm text-orange-50 whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs text-orange-100/40 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-black/50 border border-orange-500/20 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input Bar */}
      <div className="border-t border-orange-500/15 bg-[#0d0d10]/95 backdrop-blur px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="flex-1 rounded-xl border border-orange-500/25 bg-black/50 px-4 py-3 text-sm text-orange-50 placeholder:text-orange-100/40 outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              placeholder="Share what's on your mind..."
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-6 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          
          {/* Trigger Factor and Clarity Pause buttons */}
          <div className="flex gap-3">
            <Link
              href="/tools/trigger-factor"
              className="flex-1 py-3 rounded-xl border border-orange-500/25 bg-orange-500/10 text-center text-sm font-medium text-orange-100 hover:bg-orange-500/20 transition"
            >
              🎯 Trigger Factor
            </Link>
            <Link
              href="/tools/clarity-pause"
              className="flex-1 py-3 rounded-xl border border-orange-500/25 bg-orange-500/10 text-center text-sm font-medium text-orange-100 hover:bg-orange-500/20 transition"
            >
              ⏸️ Clarity Pause
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
