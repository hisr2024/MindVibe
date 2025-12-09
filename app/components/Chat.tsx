'use client'

import { useEffect, useRef, useState } from 'react'
import SimpleBar from 'simplebar-react'
import { MessageBubble } from '@/components/chat'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { useSmartScroll } from '@/hooks/useSmartScroll'

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
  const [savedNotification, setSavedNotification] = useState<string | null>(null)

  // Use smart scroll hook for better UX
  const { scrollRef, messagesEndRef, hasNewMessage, scrollToBottom } = useSmartScroll(messages.length)

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content) return

    const userMessage: Message = { sender: 'user', text: content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: content })
      })

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
        text: getErrorMessage(error),
        timestamp: new Date().toISOString(),
        status: 'error'
      }
      setMessages(prev => [...prev, assistant])
    } finally {
      setLoading(false)
    }
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
        <SimpleBar
          autoHide={false}
          scrollableNodeProps={{
            ref: scrollRef,
            role: 'log',
            'aria-live': 'polite',
            'aria-label': 'Conversation history',
            tabIndex: 0,
            className: 'chat-scrollbar smooth-touch-scroll scroll-stable',
          }}
          className="mv-energy-scrollbar h-80 rounded-2xl border border-orange-500/20 bg-slate-950/70 shadow-inner shadow-orange-500/10"
        >
          <div className="p-4 pr-3 sm:pr-4">
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
            {/* Invisible element at the end for scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </SimpleBar>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3">
          <div className="pointer-events-auto flex flex-col gap-2 text-xs font-semibold text-orange-50">
            {hasNewMessage && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-3 py-2 text-slate-950 shadow-lg shadow-orange-500/35 transition hover:scale-[1.02]"
              >
                ↓ Jump to Latest
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
          {loading ? <span>Sending...</span> : <span>Send</span>}
        </button>
      </div>
      <p className="text-xs text-orange-100/70">We do not store chats long-term; avoid crisis information and call local services in emergencies.</p>
    </div>
  )
}
