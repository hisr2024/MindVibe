'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import SimpleBar from 'simplebar-react'
import { MessageBubble } from './MessageBubble'
import { KiaanLogo } from '@/components/branding'
import { useSmartScroll } from '@/hooks/useSmartScroll'

export interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  summary?: string
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearedUntil, setClearedUntil] = useState(0)
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Use smart scroll hook for better UX
  const visibleMessages = messages.slice(clearedUntil)
  const { scrollRef, messagesEndRef, hasNewMessage, scrollToBottom } = useSmartScroll(visibleMessages.length)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText.trim())
      setInputText('')
    }
  }

  const startScroll = (direction: 'up' | 'down') => {
    const container = scrollRef.current
    if (!container) return

    const delta = direction === 'up' ? -28 : 28
    container.scrollBy({ top: delta, behavior: prefersReducedMotion ? 'auto' : 'smooth' })

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
    }

    scrollIntervalRef.current = setInterval(() => {
      container.scrollBy({
        top: direction === 'up' ? -18 : 18,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      })
    }, 110)
  }

  const stopScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopScroll()
    }
  }, [])

  return (
    <div
      className={`relative flex flex-col rounded-3xl border border-orange-500/15 bg-black/50 ${className}`}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/15 px-4 py-3">
        <KiaanLogo size="sm" showTagline={false} animated={true} />

        <div className="ml-auto flex items-center gap-2">
          {!confirmingClear && (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="rounded-full border border-orange-500/25 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-orange-100/80 transition hover:border-orange-400/60 hover:text-orange-50"
            >
              Clear old messages
            </button>
          )}

          {confirmingClear && (
            <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-black/70 px-3 py-1.5 text-[11px] text-orange-50 shadow-lg shadow-orange-500/20">
              <span>Clear history?</span>
              <button
                type="button"
                onClick={() => {
                  setClearedUntil(messages.length)
                  setConfirmingClear(false)
                  scrollToBottom()
                }}
                className="rounded-full bg-gradient-to-r from-orange-400 via-[#ff9933] to-orange-200 px-2.5 py-1 text-[11px] font-semibold text-slate-950 shadow-md shadow-orange-500/30"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-full border border-orange-500/30 px-2.5 py-1 text-[11px] font-semibold text-orange-100/80"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div className="relative flex-1">
        <SimpleBar
          autoHide={false}
          scrollableNodeProps={{
            ref: scrollRef,
            tabIndex: 0,
            role: 'log',
            'aria-label': 'Chat messages',
            'aria-live': 'polite',
            className: 'kiaan-chat-scroll-container smooth-touch-scroll scroll-stable focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-inset',
            style: {
              maxHeight: 'calc(100vh - 300px)',
              minHeight: '300px',
              scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
              paddingRight: '0.25rem'
            }
          }}
          className="mv-energy-scrollbar flex-1 pr-3 md:pr-5"
        >
          <div className="px-4 pr-6 md:pr-10 py-4 space-y-4">
            {visibleMessages.length === 0 ? (
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
              visibleMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  sender={message.sender}
                  text={message.text}
                  timestamp={message.timestamp}
                  status={message.status}
                  summary={message.summary}
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

            {/* Invisible element at the end for scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </SimpleBar>

        <div className="pointer-events-none absolute inset-y-6 right-1 flex flex-col items-center justify-between gap-3 md:right-2">
          <button
            type="button"
            onMouseDown={() => startScroll('up')}
            onMouseUp={stopScroll}
            onMouseLeave={stopScroll}
            onTouchStart={() => startScroll('up')}
            onTouchEnd={stopScroll}
            onTouchCancel={stopScroll}
            className="pointer-events-auto h-12 w-12 rounded-2xl bg-white/10 text-orange-50 shadow-md shadow-orange-500/20 backdrop-blur-sm border border-orange-500/30 hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            aria-label="Scroll up"
          >
            ↑
          </button>
          <button
            type="button"
            onMouseDown={() => startScroll('down')}
            onMouseUp={stopScroll}
            onMouseLeave={stopScroll}
            onTouchStart={() => startScroll('down')}
            onTouchEnd={stopScroll}
            onTouchCancel={stopScroll}
            className="pointer-events-auto h-12 w-12 rounded-2xl bg-white/10 text-orange-50 shadow-md shadow-orange-500/20 backdrop-blur-sm border border-orange-500/30 hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            aria-label="Scroll down"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Floating Jump to Latest button */}
      {hasNewMessage && visibleMessages.length > 0 && (
        <button
          onClick={scrollToBottom}
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
