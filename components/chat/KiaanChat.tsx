'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import SimpleBar from 'simplebar-react'
import { MessageBubble } from './MessageBubble'
import { KiaanLogo } from '@/components/branding'

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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Auto-scroll to bottom when allowed
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
  }, [prefersReducedMotion])

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
  }, [isAtBottom, messages.length, scrollToBottom])

  // Detect scroll position to manage auto-scroll behavior
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const threshold = 40
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    setIsAtBottom(isNearBottom)
  }, [])

  // Initialize scroll position state on mount
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const threshold = 40
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    setIsAtBottom(isNearBottom)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText.trim())
      setInputText('')
      setIsAtBottom(true)
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-3xl border border-orange-500/15 bg-black/50 ${className}`}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/15 px-4 py-3">
        <KiaanLogo size="sm" showTagline={false} animated={true} />
      </div>

      {/* Scrollable Messages Container */}
      <SimpleBar
        autoHide={false}
        scrollableNodeProps={{
          ref: messagesContainerRef,
          onScroll: handleScroll,
          tabIndex: 0,
          role: 'log',
          'aria-label': 'Chat messages',
          'aria-live': 'polite',
          className: 'kiaan-chat-scroll-container smooth-touch-scroll scroll-stable focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-inset',
          style: {
            maxHeight: 'calc(100vh - 300px)',
            minHeight: '300px',
            scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth'
          }
        }}
        className="mv-energy-scrollbar flex-1"
      >
          <div className="px-4 py-4 space-y-4">
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
              <div className="flex items-center gap-3 animate-pulse" role="status" aria-label="KIAAN is typing">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-xs font-bold text-slate-900">
                  K
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-orange-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="sr-only">KIAAN is typing...</span>
              </div>
            )}
          </div>
        </SimpleBar>

      {/* Floating Jump to Latest button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => {
            setIsAtBottom(true)
            scrollToBottom()
          }}
          className="absolute bottom-[116px] right-5 z-10 rounded-full bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/40 transition-all hover:scale-105"
          aria-label="Jump to latest message"
        >
          ↓ Jump to Latest
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
            aria-label="Type your message"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default KiaanChat
