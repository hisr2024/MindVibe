'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from '@/components/chat'

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
  const listRef = useRef<HTMLDivElement | null>(null)
  const [savedNotification, setSavedNotification] = useState<string | null>(null)
  const [hasNewAnswer, setHasNewAnswer] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [canScrollUp, setCanScrollUp] = useState(false)

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
      setHasNewAnswer(true)
    } catch (error) {
      const assistant: Message = {
        sender: 'assistant',
        text: 'I could not reach the guidance service. Please try again.',
        timestamp: new Date().toISOString(),
        status: 'error'
      }
      setMessages(prev => [...prev, assistant])
      setHasNewAnswer(true)
    } finally {
      setLoading(false)
    }
  }

  function handleScroll() {
    const container = listRef.current
    if (!container) return

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const atBottom = distanceFromBottom < 48
    setIsAtBottom(atBottom)
    setCanScrollUp(container.scrollTop > 12)

    if (atBottom) {
      setHasNewAnswer(false)
    }
  }

  useEffect(() => {
    handleScroll()
  }, [messages])

  function scrollByAmount(amount: number) {
    const container = listRef.current
    if (!container) return

    container.scrollBy({ top: amount, behavior: 'smooth' })
  }

  function scrollToLatest() {
    const container = listRef.current
    if (!container) return

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    setHasNewAnswer(false)
    setIsAtBottom(true)
  }

  function handleSaveToJournal(text: string) {
    // Save to local storage journal entries
    try {
      const existingEntries = localStorage.getItem('mindvibe_journal_entries')
      const entries = existingEntries ? JSON.parse(existingEntries) : []
      
      const newEntry = {
        id: Date.now().toString(),
        content: `KIAAN Insight:\n\n${text}`,
        timestamp: new Date().toISOString(),
        source: 'kiaan_chat',
      }
      
      entries.push(newEntry)
      localStorage.setItem('mindvibe_journal_entries', JSON.stringify(entries))
      
      // Show notification
      setSavedNotification('Saved to Sacred Reflections! 📝')
      setTimeout(() => setSavedNotification(null), 2000)
    } catch (error) {
      console.error('Failed to save to journal:', error)
    }
  }

  return (
    <div className="space-y-3 relative">
      {/* Saved notification toast */}
      {savedNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {savedNotification}
          </div>
        </div>
      )}
      
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
      <div className="relative">
        <div
          ref={listRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Conversation history"
          tabIndex={0}
          className="h-80 overflow-y-auto rounded-2xl border border-orange-500/20 bg-slate-950/70 p-4 pr-3 sm:pr-4 scroll-smooth scroll-stable chat-scrollbar smooth-touch-scroll"
        >
          {messages.length === 0 && (
            <p className="text-sm text-orange-100/70">Start a gentle conversation. Your messages are sent securely.</p>
          )}
          <div className="space-y-3">
            {messages.map((message, idx) => (
              <MessageBubble
                key={`${message.timestamp}-${idx}`}
                sender={message.sender}
                text={message.text}
                timestamp={message.timestamp}
                status={message.status}
                onSaveToJournal={message.sender === 'assistant' ? handleSaveToJournal : undefined}
              />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3">
          <div className="pointer-events-auto flex flex-col gap-2 text-xs font-semibold text-orange-50">
            <button
              type="button"
              onClick={() => scrollByAmount(-200)}
              disabled={!canScrollUp}
              className="rounded-xl border border-orange-500/30 bg-slate-900/80 px-3 py-2 shadow-lg shadow-orange-500/15 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Scroll up
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(200)}
              disabled={isAtBottom}
              className="rounded-xl border border-orange-500/30 bg-slate-900/80 px-3 py-2 shadow-lg shadow-orange-500/15 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Scroll down
            </button>
            {hasNewAnswer && !isAtBottom && (
              <button
                type="button"
                onClick={scrollToLatest}
                className="rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-3 py-2 text-slate-950 shadow-lg shadow-orange-500/35 transition hover:scale-[1.02]"
              >
                Show latest answer
              </button>
            )}
          </div>
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
