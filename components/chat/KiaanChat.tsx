'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'

export interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
}

interface KiaanChatProps {
  messages: Message[]
  onSendMessage?: (text: string) => void
  onSaveToJournal?: (text: string) => void
  isLoading?: boolean
  className?: string
}

export function KiaanChat({
  messages,
  onSendMessage,
  onSaveToJournal,
  isLoading = false,
  className = '',
}: KiaanChatProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new messages arrive (if autoScroll is enabled)
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [autoScroll])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Detect if user is scrolling up to preserve scroll position
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setAutoScroll(isAtBottom)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText.trim())
      setInputText('')
      setAutoScroll(true) // Re-enable auto-scroll on new message
    }
  }

  return (
    <div className={`flex flex-col rounded-3xl border border-orange-500/15 bg-black/50 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/15 px-4 py-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-slate-900">
          K
        </div>
        <div>
          <h2 className="text-lg font-semibold text-orange-50">KIAAN</h2>
          <p className="text-xs text-orange-100/60">Your wisdom companion</p>
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '300px' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-300/20 flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-orange-50 mb-2">Welcome to KIAAN</h3>
            <p className="text-sm text-orange-100/70 max-w-sm">
              Share what&apos;s on your mind. I&apos;m here to offer warm, grounded guidance rooted in timeless wisdom.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              sender={message.sender}
              text={message.text}
              timestamp={message.timestamp}
              status={message.status}
              onSaveToJournal={message.sender === 'assistant' ? onSaveToJournal : undefined}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-xs font-bold text-slate-900">
              K
            </div>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && messages.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true)
            scrollToBottom()
          }}
          className="mx-4 mb-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs text-orange-100 hover:bg-orange-500/30 transition-colors"
        >
          ↓ Scroll to latest
        </button>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-orange-500/15 px-4 py-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share what's on your mind..."
            className="flex-1 rounded-2xl border border-orange-500/25 bg-slate-950/70 px-4 py-2.5 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/50 placeholder:text-orange-100/40"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default KiaanChat
