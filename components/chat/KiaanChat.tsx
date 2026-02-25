'use client'

import { useState, useRef, useEffect } from 'react'
import SimpleBar from 'simplebar-react'
import { MessageBubble } from './MessageBubble'
import { KiaanLogo } from '@/components/branding'
import { useSmartScroll } from '@/hooks/useSmartScroll'
import { VoiceInputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import { useMicroPause } from '@/hooks/useMicroPause'
import { BreathingDot } from '@/components/animations/BreathingDot'

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
  viewMode?: 'detailed' | 'summary'
}

export function KiaanChat({
  messages,
  onSendMessage,
  onSaveToJournal,
  isLoading = false,
  className = '',
  viewMode = 'detailed',
}: KiaanChatProps) {
  const [inputText, setInputText] = useState('')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearedUntil, setClearedUntil] = useState(0)
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Get current language for voice features
  const { language } = useLanguage()

  // Micro-pause before revealing AI response
  const { showPause } = useMicroPause({
    loading: isLoading,
    hasResult: messages.length > 0,
    tool: 'kiaan',
  })

  // Use smart scroll hook for better UX
  const visibleMessages = messages.slice(clearedUntil)
  const { scrollRef, messagesEndRef, hasNewMessage, scrollToBottom } = useSmartScroll(visibleMessages.length)

  // Listen for reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
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
      className={`relative flex flex-col rounded-3xl border border-[#d4a44c]/15 bg-black/50 h-[calc(100vh-280px)] max-h-[800px] min-h-[480px] ${className}`}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-[#d4a44c]/15 px-4 py-3">
        <KiaanLogo size="sm" showTagline={false} animated={true} />

        <div className="ml-auto flex items-center gap-2">
          {!confirmingClear && (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="rounded-full border border-[#d4a44c]/25 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#f5f0e8]/80 transition hover:border-[#d4a44c]/60 hover:text-[#f5f0e8]"
            >
              Clear old messages
            </button>
          )}

          {confirmingClear && (
            <div className="flex items-center gap-2 rounded-full border border-[#d4a44c]/30 bg-black/70 px-3 py-1.5 text-[11px] text-[#f5f0e8] shadow-lg shadow-[#d4a44c]/20">
              <span>Clear history?</span>
              <button
                type="button"
                onClick={() => {
                  setClearedUntil(messages.length)
                  setConfirmingClear(false)
                  scrollToBottom()
                }}
                className="rounded-full bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#e8b54a] px-2.5 py-1 text-[11px] font-semibold text-slate-950 shadow-md shadow-[#d4a44c]/30"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-full border border-[#d4a44c]/30 px-2.5 py-1 text-[11px] font-semibold text-[#f5f0e8]/80"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div className="relative flex-1 overflow-hidden" style={{ contain: 'layout' }}>
        <SimpleBar
          autoHide={false}
          scrollableNodeProps={{
            ref: scrollRef,
            tabIndex: 0,
            role: 'log',
            'aria-label': 'Chat messages',
            'aria-live': 'polite',
            className: 'kiaan-chat-scroll-container smooth-touch-scroll scroll-stable focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 focus-visible:ring-inset',
            style: {
              height: '100%',
              maxHeight: '100%',
              scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
              paddingRight: '0.25rem'
            }
          }}
          className="mv-energy-scrollbar h-full pr-3 md:pr-5"
        >
          <div className="px-4 pr-6 md:pr-10 py-4 space-y-4">
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#d4a44c]/20 to-[#e8b54a]/20 flex items-center justify-center mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">KIAAN</h3>
                <p className="text-sm text-[#f5f0e8]/70 max-w-sm">
                  Tell me what&apos;s happening. I&apos;ll help you understand the pattern, regulate the response, and find a concrete next step.
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
                  viewMode={viewMode}
                />
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 animate-pulse" role="status" aria-label="KIAAN is typing">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] flex items-center justify-center text-xs font-bold text-slate-900">
                  K
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#d4a44c]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#d4a44c]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#d4a44c]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="sr-only">KIAAN is typing...</span>
              </div>
            )}

            {/* Micro-pause breathing dot before revealing new response */}
            <BreathingDot visible={showPause} />

            {/* Invisible element at the end for scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </SimpleBar>

        {/* Compact scroll controls - positioned together near the response */}
        <div className="pointer-events-none absolute top-4 right-1 flex flex-col items-center gap-1 md:right-2">
          <button
            type="button"
            onMouseDown={() => startScroll('up')}
            onMouseUp={stopScroll}
            onMouseLeave={stopScroll}
            onTouchStart={() => startScroll('up')}
            onTouchEnd={stopScroll}
            onTouchCancel={stopScroll}
            className="pointer-events-auto h-10 w-10 rounded-xl bg-white/10 text-[#f5f0e8] shadow-md shadow-[#d4a44c]/20 backdrop-blur-sm border border-[#d4a44c]/30 hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a44c] transition-all text-sm font-semibold"
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
            className="pointer-events-auto h-10 w-10 rounded-xl bg-white/10 text-[#f5f0e8] shadow-md shadow-[#d4a44c]/20 backdrop-blur-sm border border-[#d4a44c]/30 hover:bg-white/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a44c] transition-all text-sm font-semibold"
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
          className="absolute bottom-[116px] right-5 z-10 rounded-full bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#d4a44c] px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-[#d4a44c]/40 transition-all hover:scale-105"
          aria-label="Jump to latest message"
        >
          ↓ Jump to Latest
        </button>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-[#d4a44c]/15 px-4 py-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share what's on your mind..."
            className="flex-1 rounded-2xl border border-[#d4a44c]/25 bg-slate-950/70 px-4 py-2.5 text-sm text-[#f5f0e8] outline-none focus:ring-2 focus:ring-[#d4a44c]/50 placeholder:text-[#f5f0e8]/40"
            disabled={isLoading}
            aria-label="Type your message"
          />
          <VoiceInputButton
            language={language}
            onTranscript={(text) => setInputText(text)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
