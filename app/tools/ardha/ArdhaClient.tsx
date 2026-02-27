'use client'

import { useState, useEffect } from 'react'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { apiFetch } from '@/lib/api'
import { VoiceInputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { useMicroPause } from '@/hooks/useMicroPause'
import { BreathingDot } from '@/components/animations/BreathingDot'
import {
  ARDHA_PILLARS,
  ARDHA_SECTION_HEADINGS,
  ARDHA_COMPLIANCE_TESTS,
  parseArdhaSections,
  type ArdhaResult,
  type ArdhaCompliance,
  type ArdhaAnalysis,
  type DepthMode,
} from '@/lib/ardha-knowledge'

/**
 * Sanitize user input to prevent prompt injection.
 */
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
    } catch {
      // Silent fail for localStorage
    }
  }, [key, state])

  return [state, setState]
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  const key = 'ardha_session_id'
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
  const newId = `ardha_${Date.now()}_${randomSuffix}`
  window.localStorage.setItem(key, newId)
  return newId
}

/**
 * ARDHA Compliance Badge component — shows pass/fail for each of the 5 tests.
 */
function ComplianceIndicator({ compliance }: { compliance: ArdhaCompliance | undefined }) {
  if (!compliance) return null

  return (
    <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0b0c0f]/90 p-4">
      <h4 className="text-xs font-semibold text-[#f5f0e8] mb-3">
        Gita Compliance ({compliance.score}/{compliance.max_score})
      </h4>
      <div className="space-y-2">
        {compliance.tests?.map((test, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                test.passed
                  ? 'bg-emerald-400'
                  : 'bg-red-400/60'
              }`}
            />
            <span className={test.passed ? 'text-[#f5f0e8]/90' : 'text-[#f5f0e8]/50'}>
              {test.test}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * ARDHA Pillar Analysis component — shows which pillars were recommended.
 */
function PillarAnalysis({ analysis }: { analysis: ArdhaAnalysis | undefined }) {
  if (!analysis || analysis.crisis_detected) return null

  return (
    <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0b0c0f]/90 p-4">
      <h4 className="text-xs font-semibold text-[#f5f0e8] mb-2">
        ARDHA Analysis
      </h4>
      <p className="text-xs text-[#f5f0e8]/70 mb-3">
        Detected: <span className="text-[#e8b54a]">{analysis.primary_emotion?.replace(/_/g, ' ')}</span>
      </p>
      <div className="space-y-2">
        {analysis.pillars?.map((pillar, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 h-4 w-4 rounded-md bg-gradient-to-r from-[#d4a44c] to-[#ffb347] flex items-center justify-center text-[8px] font-bold text-slate-950 shrink-0">
              {pillar.code}
            </span>
            <div>
              <span className="text-[#f5f0e8]/90">{pillar.name}</span>
              <p className="text-[#f5f0e8]/50 text-[10px]">{pillar.compliance_test}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * ARDHA Pillar Card — displays one pillar's teaching and key verse.
 */
function PillarCard({ pillar, isExpanded, onToggle }: {
  pillar: typeof ARDHA_PILLARS[0]
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-[#d4a44c]/15 bg-black/30 p-3">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2 text-left"
        aria-expanded={isExpanded}
      >
        <span className="mt-0.5 h-5 w-5 rounded-md bg-gradient-to-r from-[#d4a44c] to-[#ffb347] flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0">
          {pillar.icon}
        </span>
        <div className="flex-1">
          <span className="text-xs font-semibold text-[#f5f0e8]">{pillar.name}</span>
          <span className="text-[10px] text-[#f5f0e8]/50 ml-1">({pillar.sanskritName})</span>
        </div>
        <span className="text-[#f5f0e8]/40 text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isExpanded && (
        <div className="mt-2 pl-7 space-y-2">
          <p className="text-[10px] text-[#f5f0e8]/70 leading-relaxed">
            {pillar.coreTeaching}
          </p>
          <div className="text-[10px] text-[#f5f0e8]/50">
            <span className="font-semibold text-[#e8b54a]">Test: </span>
            {pillar.complianceTest}
          </div>
          {pillar.keyVerses[0] && (
            <div className="p-2 rounded-lg bg-[#d4a44c]/5 border border-[#d4a44c]/10">
              <p className="text-[10px] text-[#e8b54a] font-semibold">{pillar.keyVerses[0].reference}</p>
              <p className="text-[10px] text-[#f5f0e8]/60 italic mt-0.5">{pillar.keyVerses[0].english}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ArdhaClient() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe_v2', null)
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null)
  const analysisMode: DepthMode = 'quick'

  const { language, t } = useLanguage()

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
      const response = await apiFetch('/api/ardha/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought: trimmedThought,
          depth: analysisMode,
          sessionId: getOrCreateSessionId(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'An unexpected error occurred.'
        const status = data.status || 'error'

        if (status === 'service_unavailable' || response.status === 503) {
          setError('ARDHA is currently unavailable. Please ensure the AI service is configured and try again.')
        } else if (status === 'rate_limited' || response.status === 429) {
          setError('Too many requests. Please wait a moment before trying again.')
        } else if (status === 'timeout' || response.status === 504) {
          setError('The request took too long. Please try with a shorter thought.')
        } else if (status === 'connection_error') {
          setError('Unable to connect to ARDHA. Please check your internet connection.')
        } else {
          setError(errorMessage)
        }
        return
      }

      const fullResponse = data.response || ''

      if (fullResponse) {
        setResult({
          response: fullResponse,
          sections: parseArdhaSections(fullResponse),
          requestedAt: new Date().toISOString(),
          sources: data.sources || [],
          depth: data.depth || analysisMode,
          ardha_analysis: data.ardha_analysis,
          compliance: data.compliance,
        })
      } else {
        setError('ARDHA could not generate a response. Please try again with a different thought.')
      }
    } catch (err) {
      console.error('ARDHA request failed:', err)
      setError('Unable to reach ARDHA. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050507] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="~"
          title="ARDHA - Gita Reframing"
          subtitle="Atma-Reframing through Dharma and Higher Awareness. Correct identity, not just thoughts."
          backLink={{ label: 'Back to home', href: '/' }}
          modeLabel={`${t('dashboard.mode_label.prefix', 'You are in:')} ${t('dashboard.mode_label.ardha', 'ARDHA Mode')}`}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <ToolActionCard
            icon="~"
            title="ARDHA Reframe"
            description="Transform thoughts through the 5 Gita pillars: Atma, Raga-Dvesha, Dharma, Samatvam, Arpana."
            ctaLabel="Start ARDHA Reframing"
            onClick={() => document.getElementById('thought-input')?.focus()}
            gradient="from-purple-500/10 to-indigo-500/10"
          />
          <ToolActionCard
            icon="~"
            title="Explore the 5 Pillars"
            description="Understand how ARDHA's Gita-compliant framework differs from CBT."
            ctaLabel="Explore Wisdom"
            href="/wisdom-rooms"
            gradient="from-amber-500/10 to-[#d4a44c]/10"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(212,164,76,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="thought-input" className="text-sm font-semibold text-[#f5f0e8]">
                  Share the thought to reframe
                </label>
                <VoiceInputButton
                  language={language}
                  onTranscript={(text) => setThought((prev) => (prev ? `${prev} ${text}` : text))}
                  disabled={loading}
                />
              </div>
              <textarea
                id="thought-input"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="Speak or type your thought. Example: I keep messing up at work, maybe I'm just not cut out for this."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-[#d4a44c]/25 text-[#f5f0e8] placeholder:text-[#f5f0e8]/60 p-4 focus:ring-2 focus:ring-[#d4a44c]/50 outline-none"
                aria-describedby="thought-hint"
              />
              <p id="thought-hint" className="sr-only">
                Describe the negative thought you want to reframe through ARDHA
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestReframe}
                  disabled={!thought.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#ffb347] to-[#e8b54a] text-slate-950 font-semibold shadow-lg shadow-[#d4a44c]/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/50"
                  aria-label={loading ? 'Processing...' : 'Reframe with ARDHA'}
                >
                  {loading ? (
                    <span>ARDHA is reflecting...</span>
                  ) : (
                    <span>Reframe with ARDHA</span>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-[#e8b54a]" role="alert">
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Sacred Loading State */}
            {loading && <WisdomLoadingState tool="ardha" />}

            {/* Micro-pause breathing dot */}
            <BreathingDot visible={showPause} />

            {/* ARDHA Wisdom Response */}
            {result && !loading && !showPause && (
              <>
                <WisdomResponseCard
                  tool="ardha"
                  sections={result.sections}
                  fullResponse={result.response}
                  timestamp={result.requestedAt}
                  language={language}
                  analysisMode={result.depth || analysisMode}
                  sources={result.sources}
                />

                {/* ARDHA-specific: Pillar Analysis and Compliance */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <PillarAnalysis analysis={result.ardha_analysis} />
                  <ComplianceIndicator compliance={result.compliance} />
                </div>
              </>
            )}
          </section>

          {/* Right: ARDHA Pillars and Info */}
          <section className="space-y-4">
            {/* 5 ARDHA Pillars */}
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(212,164,76,0.12)]">
              <h3 className="text-sm font-semibold text-[#f5f0e8] mb-4">
                ARDHA&apos;s 5 Pillars
              </h3>
              <div className="space-y-2">
                {ARDHA_PILLARS.map((pillar, idx) => (
                  <PillarCard
                    key={pillar.code}
                    pillar={pillar}
                    isExpanded={expandedPillar === idx}
                    onToggle={() => setExpandedPillar(expandedPillar === idx ? null : idx)}
                  />
                ))}
              </div>
            </div>

            {/* About ARDHA */}
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(212,164,76,0.12)]">
              <h3 className="text-sm font-semibold text-[#f5f0e8] mb-3">About ARDHA</h3>
              <p className="text-xs text-[#f5f0e8]/80 leading-relaxed mb-4">
                ARDHA corrects <strong>mistaken identity</strong>, not just distorted thinking.
                Where CBT strengthens the functional ego, ARDHA loosens ego-identification.
                Where CBT aims for mental health, ARDHA aims for inner freedom through right action.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-[#d4a44c]/15">
                <h4 className="text-xs font-semibold text-[#f5f0e8] mb-2">Response Structure</h4>
                <p className="text-xs text-[#f5f0e8]/70">
                  Atma Distinction {'\u2192'} Raga-Dvesha Scan {'\u2192'} Dharma Alignment {'\u2192'} Hrdaya Samatvam {'\u2192'} Arpana {'\u2192'} Gita Verse {'\u2192'} Compliance Check
                </p>
              </div>
            </div>

            {/* 5 Compliance Tests */}
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0b0c0f]/90 p-4">
              <h4 className="text-xs font-semibold text-[#f5f0e8] mb-3">5 Tests of Gita Compliance</h4>
              <ul className="space-y-2">
                {ARDHA_COMPLIANCE_TESTS.map((test, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[10px] text-[#f5f0e8]/70">
                    <span className="mt-0.5 h-3 w-3 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347] flex items-center justify-center text-[7px] font-bold text-slate-950 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{test.test}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ARDHA vs CBT */}
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#d4a44c]/10 to-transparent p-4">
              <p className="text-xs text-[#f5f0e8]/80">
                <strong className="text-[#f5f0e8]">ARDHA vs CBT:</strong>{' '}
                CBT says &quot;correct distorted thinking.&quot; ARDHA says &quot;correct mistaken identity.&quot;
                As Krishna teaches in BG 2.16: &quot;The unreal has no existence, and the real never ceases to be.&quot;
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
