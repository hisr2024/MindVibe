'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { apiFetch } from '@/lib/api'
import { VoiceInputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { useMicroPause } from '@/hooks/useMicroPause'
import { BreathingDot } from '@/components/animations/BreathingDot'

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
    } catch {
      // Silent fail for localStorage
    }
  }, [key, state])

  return [state, setState]
}

const ARDHA_SECTION_HEADINGS = [
  'Distortion Detection',
  'Emotional Precision',
  'Mechanism Insight',
  'Gita-Aligned Truth',
  'Calibration Layer',
  'Disciplined Action',
  'Reflective Question',
]

function parseArdhaSections(response: string): Record<string, string> {
  const sections: Record<string, string> = {}
  let currentHeading: string | null = null

  response.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const headingMatch = ARDHA_SECTION_HEADINGS.find(
      (heading) => heading.toLowerCase() === trimmed.toLowerCase()
    )

    if (headingMatch) {
      currentHeading = headingMatch
      sections[slugifyHeading(headingMatch)] = ''
    } else if (currentHeading) {
      const key = slugifyHeading(currentHeading)
      sections[key] = sections[key]
        ? `${sections[key]} ${trimmed}`
        : trimmed
    }
  })

  return sections
}

function slugifyHeading(heading: string): string {
  return heading.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
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

type DepthMode = 'quick' | 'deep' | 'quantum'

type SourceRef = {
  file: string
  reference: string
}

type ArdhaResult = {
  response: string
  sections: Record<string, string>
  requestedAt: string
  sources?: SourceRef[]
  depth?: DepthMode
}

const pillars = [
  'Distortion detection - identify cognitive distortions with CBT precision.',
  'Gita-aligned truth - grounded principles translated into modern clarity.',
  'Calibration - distinguish story from fact, identity from behavior.',
  'Disciplined action - one concrete corrective step rooted in abhyasa.',
]

export default function ArdhaClient() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe', null)
  const analysisMode: DepthMode = 'quick'

  // Voice integration
  const { language, t } = useLanguage()

  // Micro-pause before revealing response
  const { showPause } = useMicroPause({
    loading,
    hasResult: !!result,
    tool: 'ardha',
  })

  useEffect(() => {
    if (error) setError(null)
  }, [thought, error])

  async function requestReframe() {
    const trimmedThought = sanitizeInput(thought.trim())
    if (!trimmedThought) return

    setLoading(true)
    setError(null)

    try {
      // Use local API route to proxy requests to backend (avoids CORS issues)
      const response = await apiFetch('/api/ardha/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought: trimmedThought,
          depth: analysisMode,
          sessionId: getOrCreateSessionId(),
        })
      })

      const data = await response.json()

      // Handle error responses with appropriate messages
      if (!response.ok) {
        const errorMessage = data.error || 'An unexpected error occurred.'
        const status = data.status || 'error'

        // Provide user-friendly error messages based on status
        if (status === 'service_unavailable' || response.status === 503) {
          setError('Ardha is currently unavailable. Please ensure the AI service is configured and try again.')
        } else if (status === 'rate_limited' || response.status === 429) {
          setError('Too many requests. Please wait a moment before trying again.')
        } else if (status === 'timeout' || response.status === 504) {
          setError('The request took too long. Please try with a shorter thought or the Quick Reframe option.')
        } else if (status === 'connection_error') {
          setError('Unable to connect to Ardha. Please check your internet connection.')
        } else {
          setError(errorMessage)
        }
        return
      }

      // Parse structured response
      const fullResponse = data.response || ''

      if (fullResponse) {
        setResult({
          response: fullResponse,
          sections: parseArdhaSections(fullResponse),
          requestedAt: new Date().toISOString(),
          sources: data.sources || [],
          depth: data.depth || analysisMode,
        })
      } else {
        setError('Ardha could not generate a response. Please try again with a different thought.')
      }
    } catch (err) {
      console.error('Ardha request failed:', err)
      setError('Unable to reach Ardha. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="🔄"
          title="Ardha - Cognitive Reframing"
          subtitle="Transform distorted, reactive thoughts into balanced, steady clarity with Gita-aligned CBT precision."
          backLink={{ label: 'Back to home', href: '/' }}
          modeLabel={`${t('dashboard.mode_label.prefix', 'You are in:')} ${t('dashboard.mode_label.ardha', 'Clarity Mode')}`}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <ToolActionCard
            icon="💭"
            title="Reframe a Thought"
            description="Share a distorted or reactive thought for grounded, precise clarity."
            ctaLabel="Start Reframing"
            onClick={() => document.getElementById('thought-input')?.focus()}
            gradient="from-purple-500/10 to-indigo-500/10"
          />
          <ToolActionCard
            icon="📚"
            title="Learn the Principles"
            description="Understand how Gita principles and CBT techniques work together."
            ctaLabel="Explore Wisdom"
            href="/wisdom-rooms"
            gradient="from-amber-500/10 to-orange-500/10"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="thought-input" className="text-sm font-semibold text-orange-100">
                  Share the thought to reframe
                </label>
                <VoiceInputButton
                  language={language}
                  onTranscript={(text) => setThought(prev => prev ? `${prev} ${text}` : text)}
                  disabled={loading}
                />
              </div>
              <textarea
                id="thought-input"
                value={thought}
                onChange={e => setThought(e.target.value)}
                placeholder="Speak or type your thought. Example: I keep messing up at work, maybe I'm just not cut out for this."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/60 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="thought-hint"
              />
              <p id="thought-hint" className="sr-only">Describe the negative thought you want to reframe</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestReframe}
                  disabled={!thought.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  aria-label={loading ? 'Processing...' : 'Reframe with Ardha'}
                >
                  {loading ? (
                    <span>Ardha is reflecting...</span>
                  ) : (
                    <span>Reframe with Ardha</span>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-orange-200" role="alert">
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Sacred Loading State */}
            {loading && (
              <WisdomLoadingState tool="ardha" />
            )}

            {/* Micro-pause breathing dot */}
            <BreathingDot visible={showPause} />

            {/* Ultra-Deep Wisdom Response */}
            {result && !loading && !showPause && (
              <WisdomResponseCard
                tool="ardha"
                sections={result.sections}
                fullResponse={result.response}
                timestamp={result.requestedAt}
                language={language}
                analysisMode={result.depth || analysisMode}
                sources={result.sources}
              />
            )}
          </section>

          {/* Right: Pillars and Info */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">Ardha&apos;s Pillars</h3>
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
                <strong className="text-orange-50">The Gift of Balance:</strong> Ardha draws from the Gita&apos;s wisdom on equanimity — transforming turbulent thoughts into balanced clarity. As Krishna teaches: &quot;The self-controlled soul attains peace.&quot;
              </p>
            </div>

            <CompanionCTA fromTool="ardha" className="mt-4" />

            <SpiritualToolsNav currentTool="ardha" className="mt-4" />
          </section>
        </div>
      </div>
    </main>
  )
}
