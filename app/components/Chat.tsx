'use client'

import { useEffect, useRef, useState } from 'react'

type Message = {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
}

const starterPrompts = [
  'Help me slow down and breathe after a stressful day.',
  'Guide me through a quick clarity pause before replying to a tough message.',
  'Can you help me reframe a negative thought?',
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    } catch (error) {
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:bg-orange-500/20"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="h-64 overflow-y-auto rounded-2xl border border-orange-500/20 bg-slate-950/70 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-orange-100/70">Start a gentle conversation. Your messages are sent securely.</p>
        )}
        <div className="space-y-3">
          {messages.map((message, idx) => (
            <div key={`${message.timestamp}-${idx}`} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-orange-100/60">
                <span className="font-semibold text-orange-50">{message.sender === 'user' ? 'You' : 'KIAAN'}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.sender === 'user'
                    ? 'bg-orange-500/10 text-orange-50'
                    : message.status === 'error'
                      ? 'border border-red-500/40 bg-red-500/10 text-red-50'
                      : 'bg-white/5 text-orange-50 border border-orange-500/15'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/60 px-3 py-2 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/70"
          placeholder="Share what you need support with. Avoid personal identifiers or emergencies."
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      <p className="text-xs text-orange-100/70">We do not store chats long-term; avoid crisis information and call local services in emergencies.</p>
    </div>
  )
}
