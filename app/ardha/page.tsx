'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { getNextStepSuggestion } from '@/lib/suggestions/nextStep'
import { NextStepLink } from '@/components/suggestions/NextStepLink'

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\\/g, '') // Remove backslashes
    .slice(0, 2000) // Limit length
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
  const key = 'ardha_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  // Generate a cryptographically secure random suffix
  function generateSecureSuffix(length: number): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(length)
      window.crypto.getRandomValues(bytes)
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    // Fallback: use Math.random only if crypto is unavailable
    return Math.random().toString(36).slice(2, 2 + length)
  }

  const randomSuffix = generateSecureSuffix(6)
  const newId = `ardha_${Date.now()}_${randomSuffix}`
  window.localStorage.setItem(key, newId)
  return newId
}

type ArdhaResult = {
  response: string
  requestedAt: string
}

const pillars = [
  'Detect the cognitive distortion with CBT precision.',
  'Name the emotion and explain the psychological mechanism.',
  'Deliver a grounded Gita-aligned truth, not abstraction.',
  'Provide one concrete disciplined action (abhyasa).',
]

export default function ArdhaPage() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe', null)

  useEffect(() => {
    if (error) setError(null)
  }, [thought, error])

  async function requestReframe() {
    const trimmedThought = sanitizeInput(thought.trim())
    if (!trimmedThought) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall('/api/ardha/reframe', {
        method: 'POST',
        body: JSON.stringify({
          thought: trimmedThought,
          depth: 'quick',
          sessionId: getOrCreateSessionId(),
        })
      })

      const data = await response.json()

      // Handle error responses
      if (!response.ok) {
        const errorMessage = data.error || 'An unexpected error occurred.'
        const status = data.status || 'error'

        if (status === 'service_unavailable' || response.status === 503) {
          setError('Ardha is currently unavailable. Please ensure the AI service is configured.')
        } else if (status === 'rate_limited') {
          setError('Too many requests. Please wait a moment.')
        } else {
          setError(errorMessage)
        }
        return
      }

      if (data.response) {
        setResult({ response: data.response, requestedAt: new Date().toISOString() })
      } else {
        setError('Ardha could not generate a response. Please try again.')
      }
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Pathway Map */}
        <PathwayMap />

        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Cognitive Reframing</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Ardha – Cognitive Reframing
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                Transform distorted, reactive thoughts into balanced, steady clarity with Gita-aligned CBT precision.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                No accounts • Stored locally
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-3">
                Share the thought to reframe
              </label>
              <textarea
                value={thought}
                onChange={e => setThought(e.target.value)}
                placeholder="Example: I keep messing up at work, maybe I'm just not cut out for this."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
              />

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestReframe}
                  disabled={!thought.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02]"
                >
                  {loading ? <span>Ardha is reflecting...</span> : <span>Reframe with Ardha</span>}
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-orange-200"><span>{error}</span></p>}
            </div>

            {/* Response */}
            {result && (
              <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-5 shadow-inner shadow-orange-500/10">
                <div className="flex items-center justify-between text-xs text-orange-100/70 mb-3">
                  <span className="font-semibold text-orange-50">Ardha's response</span>
                  <span>{new Date(result.requestedAt).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">
                  {result.response}
                </div>
                <NextStepLink suggestion={getNextStepSuggestion({ tool: 'ardha' })} />
              </div>
            )}
          </section>

          {/* Right: Pillars and Info */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">Ardha's Pillars</h3>
              <ul className="space-y-3 text-sm text-orange-100/85">
                {pillars.map((pillar, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347] shrink-0" />
                    <span>{pillar}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-3">About Ardha</h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Ardha detects cognitive distortions, names the emotion precisely, explains the psychological mechanism, and delivers a Gita-aligned truth with calibrated action. Clear, direct, grounded.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">Output format</h4>
                <p className="text-xs text-orange-100/70">
                  Distortion Detection → Emotional Precision → Mechanism Insight → Gita-Aligned Truth → Calibration → Disciplined Action → Reflective Question
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80">
                <strong className="text-orange-50">Boundaries:</strong> Ardha is not a therapist. No medical, legal, or crisis advice. It transforms distorted thoughts into balanced clarity through cognitive reframing.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
