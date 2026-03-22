'use client'

/**
 * SakhaChatInterface — Main orchestrator for the Sakha divine chat experience.
 *
 * Manages the complete animation sequence:
 * 1. User sends → message appears (slide-in, haptic)
 * 2. Sakha avatar → 'thinking' (slow golden pulse)
 * 3. 300ms sacred silence
 * 4. Sakha avatar → 'speaking' (faster golden pulse)
 * 5. Empty Sakha bubble appears
 * 6. Words stream in from SSE endpoint (parsed word-by-word)
 * 7. Verse refs appear as tappable golden chips
 * 8. Avatar → 'idle' on complete
 *
 * Reuses: useSmartScroll, useLanguage, hapticPulse, chatStorage, VoiceInputButton
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { SakhaMessageBubble } from './SakhaMessageBubble'
import { SuggestedPrompts } from './SuggestedPrompts'
import { SakhaAvatar } from './SakhaAvatar'
import { VoiceInputButton } from '@/components/voice/VoiceInputButton'
import { useSmartScroll } from '@/hooks/useSmartScroll'
import { useLanguage } from '@/hooks/useLanguage'
import { hapticPulse } from '@/utils/voice/hapticFeedback'
import {
  loadChatMessages,
  saveChatMessages,
  type ChatMessage,
} from '@/lib/chatStorage'

type AvatarState = 'idle' | 'thinking' | 'speaking'

/** Extended message type with streaming flag for UI rendering. */
interface SakhaMessage extends ChatMessage {
  isStreaming?: boolean
}

/** Generate a unique message ID. */
function createId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Parse SSE data lines from a raw text chunk.
 * Handles partial lines across chunk boundaries via the buffer parameter.
 */
function parseSSELines(
  chunk: string,
  buffer: string
): { lines: string[]; remaining: string } {
  const combined = buffer + chunk
  const parts = combined.split('\n')
  const remaining = parts.pop() ?? ''
  const lines: string[] = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith('data: ')) {
      lines.push(trimmed.slice(6))
    }
  }

  return { lines, remaining }
}

export function SakhaChatInterface() {
  const [messages, setMessages] = useState<SakhaMessage[]>(() =>
    loadChatMessages()
  )
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [inputText, setInputText] = useState('')
  const { language } = useLanguage()

  // Refs for cleanup and unmount safety
  const abortRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const sacredSilenceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  const { scrollRef, messagesEndRef, hasNewMessage, scrollToBottom } =
    useSmartScroll(messages.length)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortRef.current?.abort()
      if (sacredSilenceRef.current) clearTimeout(sacredSilenceRef.current)
    }
  }, [])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      // Strip isStreaming flag before persisting
      const toSave: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
        ...(msg.status ? { status: msg.status } : {}),
      }))
      saveChatMessages(toSave)
    }
  }, [messages])

  // Auto-scroll when streaming adds new words
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom()
    }
  }, [messages, isStreaming, scrollToBottom])

  /**
   * Core send handler — implements the full sacred animation sequence.
   */
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      // 1. Haptic + add user message
      hapticPulse()
      const userMsg: SakhaMessage = {
        id: createId(),
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMsg])
      setInputText('')

      // 2. Avatar → thinking
      setAvatarState('thinking')
      setIsStreaming(true)

      // 3. Sacred silence (300ms)
      await new Promise<void>(resolve => {
        sacredSilenceRef.current = setTimeout(resolve, 300)
      })
      if (!isMountedRef.current) return

      // 4. Avatar → speaking, add empty assistant message
      setAvatarState('speaking')
      const assistantId = createId()
      const assistantMsg: SakhaMessage = {
        id: assistantId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      }
      setMessages(prev => [...prev, assistantMsg])

      // 5. Fetch SSE stream
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch('/api/chat/message/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, language }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }

        const body = response.body
        if (!body) {
          throw new Error('No response body')
        }

        // 6. Read stream and parse SSE data lines
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!isMountedRef.current) {
            reader.cancel()
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const { lines, remaining } = parseSSELines(chunk, sseBuffer)
          sseBuffer = remaining

          for (const line of lines) {
            if (line === '[DONE]') {
              // Stream complete
              break
            }
            // Accumulate text — each line is a word or text fragment
            if (fullText.length > 0 && !line.startsWith(' ')) {
              fullText += ' '
            }
            fullText += line
          }

          // Update assistant message with accumulated text
          if (isMountedRef.current) {
            const currentText = fullText
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, text: currentText }
                  : m
              )
            )
          }
        }

        // 7. Stream complete — finalize
        if (isMountedRef.current) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, isStreaming: false }
                : m
            )
          )
        }
      } catch (error: unknown) {
        if (!isMountedRef.current) return

        // AbortError means intentional cancellation (component unmount)
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        // Show error message in chat
        const errorText =
          "I couldn't connect right now. Please try again in a moment."
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, text: errorText, isStreaming: false, status: 'error' }
              : m
          )
        )
      } finally {
        // 8. Avatar → idle
        if (isMountedRef.current) {
          setAvatarState('idle')
          setIsStreaming(false)
          abortRef.current = null
        }
      }
    },
    [isStreaming, language]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSend(inputText)
    },
    [inputText, handleSend]
  )

  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      if (transcript.trim()) {
        handleSend(transcript)
      }
    },
    [handleSend]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={handleSend} />
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {messages.map(msg => (
                <SakhaMessageBubble
                  key={msg.id}
                  id={msg.id}
                  sender={msg.sender}
                  text={msg.text}
                  timestamp={msg.timestamp}
                  isStreaming={msg.isStreaming}
                  avatarState={avatarState}
                />
              ))}
            </AnimatePresence>

            {/* Thinking indicator (shown before assistant bubble appears) */}
            {isStreaming &&
              avatarState === 'thinking' &&
              !messages.some(m => m.isStreaming) && (
                <div className="flex items-center gap-2">
                  <SakhaAvatar state="thinking" size="sm" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#e8b54a]"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* New message indicator */}
      {hasNewMessage && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#d4a44c]/40 bg-[#0f0f18]/90 px-4 py-1.5 text-xs text-[#e8b54a] shadow-lg backdrop-blur-sm transition-colors hover:bg-[#d4a44c]/20"
        >
          New messages below
        </button>
      )}

      {/* Input bar */}
      <div className="border-t border-[#e8b54a]/10 bg-[#050507]/80 px-4 py-3 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <VoiceInputButton
            language={language}
            onTranscript={handleVoiceTranscript}
            disabled={isStreaming}
            className="flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Share what's on your heart..."
            disabled={isStreaming}
            className="flex-1 rounded-full border border-[#e8b54a]/20 bg-[#0f0f18] px-4 py-2.5 text-sm text-[#f5f0e8] placeholder-[#7a7060] transition-colors focus:border-[#e8b54a]/50 focus:outline-none focus:ring-1 focus:ring-[#e8b54a]/30 disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#d4a44c] text-[#050507] transition-all hover:bg-[#e8b54a] focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/50 disabled:opacity-30 disabled:hover:bg-[#d4a44c]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
