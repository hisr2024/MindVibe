'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import { getNextStepSuggestion } from '@/lib/suggestions/nextStep'
import { NextStepLink } from '@/components/suggestions/NextStepLink'

/**
 * Viyoga — The Detachment Centre
 *
 * Cultivates non-attachment, steadiness, and disciplined clarity for users
 * emotionally attached to outcomes, approval, performance, or identity.
 *
 * Uses the v4.0 backend pipeline: AI concern analysis, enhanced Gita verse
 * retrieval, analysis-aware prompts, and Gita wisdom filtering.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .slice(0, 2000)
}

function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state])

  return [state, setState]
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  const key = 'viyoga_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  function generateSecureSuffix(length: number): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(length)
      window.crypto.getRandomValues(bytes)
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    return Math.random().toString(36).slice(2, 2 + length)
  }

  const randomSuffix = generateSecureSuffix(6)
  const newId = `viyoga_${Date.now()}_${randomSuffix}`
  window.localStorage.setItem(key, newId)
  return newId
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sections?: Record<string, string>
  attachmentType?: string
  primaryEmotion?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ATTACHMENT_LABELS: Record<string, string> = {
  control: 'Control attachment',
  future_worry: 'Future anxiety',
  future_anxiety: 'Future anxiety',
  outcome_dependency: 'Outcome dependency',
  outcome: 'Outcome attachment',
  perfectionism: 'Perfectionism',
  approval_seeking: 'Approval seeking',
  approval: 'Approval seeking',
  identity: 'Identity attachment',
  loss_anxiety: 'Loss anxiety',
  outcome_anxiety: 'Outcome anxiety',
}

const principles = [
  'You control effort, not outcomes.',
  'Praise and blame are temporary.',
  'Your worth is independent of performance.',
  'Right action matters more than recognition.',
  'Remain steady in success and failure.',
  'Act fully. Release results.',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ViyogaPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useLocalState<Message[]>('viyoga_messages', [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Clear error on input change
  useEffect(() => {
    if (error) setError(null)
  }, [input, error])

  const sendMessage = useCallback(async () => {
    const sanitized = sanitizeInput(input.trim())
    if (!sanitized || loading) return

    const userMessage: Message = {
      role: 'user',
      content: sanitized,
      timestamp: new Date().toISOString(),
    }

    const withUserMessage = [...messages, userMessage]
    setMessages(withUserMessage)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await apiCall('/api/viyoga/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: sanitized,
          sessionId: getOrCreateSessionId(),
          mode: 'full',
          secularMode: true,
        }),
        timeout: 60000,
      })

      const data = await response.json()

      if (data.assistant) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.assistant,
          timestamp: new Date().toISOString(),
          sections: data.sections,
          attachmentType: data.attachment_analysis?.type || data.concern_analysis?.attachment_type,
          primaryEmotion: data.concern_analysis?.primary_emotion,
        }
        setMessages([...withUserMessage, assistantMessage])
      } else {
        setError('Viyoga could not generate a response. Try again.')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, setMessages])

  function clearConversation() {
    setMessages([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('viyoga_session_id')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const assistantMessages = messages.filter((m) => m.role === 'assistant')
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0e] to-[#0d0907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PathwayMap />

        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">
                Detachment Centre
              </p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Viyoga
              </h1>
              <p className="mt-2 text-sm text-orange-100/70 max-w-xl">
                Cultivate steadiness. Separate effort from outcome. Release what you cannot control.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                No accounts &bull; Stored locally
              </span>
              <Link
                href="/"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition"
              >
                &larr; Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Conversation */}
          <section className="space-y-4">
            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-orange-500/20">
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.role === 'user' ? (
                      <div className="rounded-2xl border border-orange-500/10 bg-[#111115]/80 p-4">
                        <p className="text-xs text-orange-100/70 mb-2">You</p>
                        <p className="text-sm text-orange-50 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-orange-500/20 bg-black/60 p-5 shadow-inner shadow-orange-500/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-orange-50">Viyoga</span>
                            {msg.attachmentType && ATTACHMENT_LABELS[msg.attachmentType] && (
                              <span className="text-[10px] rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-orange-200/80">
                                {ATTACHMENT_LABELS[msg.attachmentType]}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-orange-100/40">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-orange-50/90 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-5">
                    <p className="text-xs text-orange-100/70 mb-2">Viyoga</p>
                    <div className="flex items-center gap-2 text-sm text-orange-100/60">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400/60 animate-pulse" />
                      <span>Observing your concern...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-3">
                {messages.length === 0
                  ? 'What outcome are you attached to?'
                  : 'Continue the conversation'}
              </label>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  messages.length === 0
                    ? 'Example: I need this interview to go perfectly or my career is over.'
                    : 'Share more, or ask Viyoga to go deeper...'
                }
                className="w-full min-h-[120px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
              />

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02]"
                >
                  {loading ? (
                    <span>Observing...</span>
                  ) : messages.length === 0 ? (
                    <span>Begin</span>
                  ) : (
                    <span>Send</span>
                  )}
                </button>

                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    disabled={loading}
                    className="px-4 py-3 rounded-2xl border border-orange-500/20 text-orange-100/70 text-sm hover:text-orange-100 hover:border-orange-500/40 transition disabled:opacity-40"
                  >
                    Clear
                  </button>
                )}

                <span className="text-[10px] text-orange-100/30 ml-auto">
                  Enter to send &bull; Shift+Enter for new line
                </span>
              </div>

              {error && (
                <p className="mt-3 text-sm text-orange-200/80">{error}</p>
              )}
            </div>

            {/* Next step suggestion after last assistant message */}
            {lastAssistantMessage && (
              <NextStepLink suggestion={getNextStepSuggestion({ tool: 'viyoga' })} />
            )}
          </section>

          {/* Right: Principles and Info */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">
                Principles
              </h3>
              <ul className="space-y-3 text-sm text-orange-100/85">
                {principles.map((principle, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400/60 shrink-0" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-3">
                What Viyoga does
              </h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Viyoga identifies what you are attached to, names the fear beneath
                it, and trains you to remain steady regardless of the outcome. It
                does not motivate. It does not promise. It cultivates composure.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">
                  Response structure
                </h4>
                <p className="text-xs text-orange-100/60 leading-relaxed">
                  Emotional calibration &rarr; Attachment diagnosis &rarr; Grounded
                  truth &rarr; Steadiness training &rarr; Disciplined action &rarr;
                  Detachment reminder
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-3">
                What Viyoga does not do
              </h3>
              <ul className="space-y-2 text-xs text-orange-100/70">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-orange-400/50">&ndash;</span>
                  <span>Does not provide therapy or crisis support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-orange-400/50">&ndash;</span>
                  <span>Does not promise positive outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-orange-400/50">&ndash;</span>
                  <span>Does not encourage avoidance or passivity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-orange-400/50">&ndash;</span>
                  <span>Does not romanticize success or failure</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/60 italic">
                Act fully. Release results. Remain balanced.
              </p>
            </div>

            {/* Cross-feature navigation */}
            <SpiritualToolsNav currentTool="viyoga" />
          </section>
        </div>
      </div>
    </main>
  )
}
