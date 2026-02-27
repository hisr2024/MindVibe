'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
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
  ARDHA_COMPLIANCE_TESTS,
  parseArdhaSections,
  type ArdhaResult,
  type ArdhaCompliance,
  type ArdhaAnalysis,
  type DepthMode,
} from '@/lib/ardha-knowledge'

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

function ComplianceIndicator({ compliance }: { compliance: ArdhaCompliance | undefined }) {
  if (!compliance) return null

  return (
    <div className="rounded-[18px] border border-violet-500/10 bg-[#0a0812]/80 p-4">
      <h4 className="text-xs font-semibold text-violet-200/70 mb-3">
        Gita Compliance ({compliance.score}/{compliance.max_score})
      </h4>
      <div className="space-y-2">
        {compliance.tests?.map((test, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                test.passed ? 'bg-emerald-400/80' : 'bg-red-400/40'
              }`}
            />
            <span className={test.passed ? 'text-violet-100/70' : 'text-violet-100/35'}>
              {test.test}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PillarAnalysis({ analysis }: { analysis: ArdhaAnalysis | undefined }) {
  if (!analysis || analysis.crisis_detected) return null

  return (
    <div className="rounded-[18px] border border-violet-500/10 bg-[#0a0812]/80 p-4">
      <h4 className="text-xs font-semibold text-violet-200/70 mb-2">ARDHA Analysis</h4>
      <p className="text-xs text-violet-100/50 mb-3">
        Detected: <span className="text-violet-300/80">{analysis.primary_emotion?.replace(/_/g, ' ')}</span>
      </p>
      <div className="space-y-2">
        {analysis.pillars?.map((pillar, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 h-4 w-4 rounded-md bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/15 flex items-center justify-center text-[8px] font-bold text-violet-300 shrink-0">
              {pillar.code}
            </span>
            <div>
              <span className="text-violet-100/70">{pillar.name}</span>
              <p className="text-violet-100/35 text-[10px]">{pillar.compliance_test}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PillarCard({ pillar, isExpanded, onToggle }: {
  pillar: typeof ARDHA_PILLARS[0]
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-violet-500/8 bg-black/20 p-3">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2 text-left"
        aria-expanded={isExpanded}
      >
        <span className="mt-0.5 h-5 w-5 rounded-md bg-gradient-to-r from-violet-500/15 to-purple-500/15 border border-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0">
          {pillar.icon}
        </span>
        <div className="flex-1">
          <span className="text-xs font-semibold text-violet-100/80">{pillar.name}</span>
          <span className="text-[10px] text-violet-100/30 ml-1">({pillar.sanskritName})</span>
        </div>
        <span className="text-violet-100/25 text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isExpanded && (
        <div className="mt-2 pl-7 space-y-2">
          <p className="text-[10px] text-violet-100/50 leading-relaxed">{pillar.coreTeaching}</p>
          <div className="text-[10px] text-violet-100/35">
            <span className="font-semibold text-violet-300/50">Test: </span>
            {pillar.complianceTest}
          </div>
          {pillar.keyVerses[0] && (
            <div className="p-2 rounded-lg bg-violet-950/20 border border-violet-500/8">
              <p className="text-[10px] text-violet-300/60 font-semibold">{pillar.keyVerses[0].reference}</p>
              <p className="text-[10px] text-violet-100/40 italic mt-0.5">{pillar.keyVerses[0].english}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ANCHOR_VERSE = {
  english: 'The unreal has no existence, and the real never ceases to be.',
  reference: 'Bhagavad Gita 2.16',
}

const SACRED_PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 15) % 80}%`,
  delay: i * 0.7,
  duration: 4.5 + (i % 3),
}))

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
          setError('ARDHA is gathering wisdom. Please ensure the AI service is configured and try again.')
        } else if (status === 'rate_limited' || response.status === 429) {
          setError('Take a breath. Too many requests \u2014 please wait a moment.')
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
    <main className="min-h-screen bg-gradient-to-b from-[#050308] via-[#080510] to-[#0a0815] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">

        {/* Sacred Header */}
        <motion.header
          className="relative overflow-hidden rounded-[28px] border border-violet-500/10 bg-gradient-to-br from-violet-950/30 via-[#08061a] to-purple-950/20 p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            boxShadow: '0 16px 64px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(139, 92, 246, 0.1)',
          }}
        >
          {SACRED_PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-violet-400/40"
              style={{ left: p.left, bottom: 0 }}
              animate={{ y: [0, -180], opacity: [0, 0.5, 0] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] text-violet-400/50 hover:text-violet-300/70 transition-colors mb-5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Return to sanctuary
          </Link>

          <div className="flex items-start gap-4 sm:gap-5">
            <motion.div
              className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/15 to-purple-500/10 border border-violet-500/10"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.1)',
                  '0 0 35px rgba(139, 92, 246, 0.2)',
                  '0 0 20px rgba(139, 92, 246, 0.1)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-xl sm:text-2xl font-sacred text-violet-200/90 select-none">
                {'\u0905\u0930\u094D\u0927'}
              </span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-violet-100">Ardha</h1>
              <p className="text-sm text-violet-300/50 font-sacred italic mt-1">
                Atma-Reframing through Dharma &amp; Higher Awareness
              </p>
              <p className="mt-1.5 text-[11px] tracking-wide text-violet-400/30">
                {t('dashboard.mode_label.prefix', 'You are in:')} {t('dashboard.mode_label.ardha', 'ARDHA Mode')}
              </p>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-violet-950/20 border border-violet-500/8">
            <p className="font-sacred text-sm text-violet-200/60 italic leading-relaxed">
              &ldquo;{ANCHOR_VERSE.english}&rdquo;
            </p>
            <p className="text-[10px] text-violet-400/30 mt-2 tracking-wide">
              {ANCHOR_VERSE.reference}
            </p>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">

          {/* Left: Input + Response */}
          <motion.section
            className="space-y-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div
              className="rounded-[22px] border border-violet-500/10 bg-[#0a0812]/90 p-5 sm:p-6"
              style={{ boxShadow: '0 8px 40px rgba(139, 92, 246, 0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="thought-input" className="text-sm font-medium text-violet-100/80">
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
                placeholder="Speak or type a thought that troubles you... ARDHA will see through the distortion to the truth beneath."
                className="w-full min-h-[140px] rounded-xl bg-black/40 border border-violet-500/10 text-white/90 placeholder:text-white/25 p-4 text-sm leading-relaxed focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/20 outline-none transition-all resize-none"
                aria-describedby="thought-hint"
              />
              <p id="thought-hint" className="sr-only">
                Describe the negative thought you want to reframe through ARDHA
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={requestReframe}
                  disabled={!thought.trim() || loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-violet-500/30 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  aria-label={loading ? 'Processing...' : 'Reframe with ARDHA'}
                >
                  {loading ? 'ARDHA is reflecting...' : 'Reframe with ARDHA'}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-amber-300/80" role="alert">{error}</p>
              )}
            </div>

            {loading && <WisdomLoadingState tool="ardha" />}
            <BreathingDot visible={showPause} />

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

                <div className="grid gap-4 sm:grid-cols-2">
                  <PillarAnalysis analysis={result.ardha_analysis} />
                  <ComplianceIndicator compliance={result.compliance} />
                </div>
              </>
            )}
          </motion.section>

          {/* Right: Pillars + Info */}
          <motion.section
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {/* 5 ARDHA Pillars */}
            <div
              className="rounded-[20px] border border-violet-500/8 bg-[#0a0812]/80 p-5"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.04)' }}
            >
              <h3 className="text-xs font-semibold text-violet-200/70 mb-4">ARDHA&apos;s 5 Pillars</h3>
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

            {/* ARDHA vs CBT */}
            <div
              className="rounded-[20px] border border-violet-500/8 bg-[#0a0812]/80 p-5"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.04)' }}
            >
              <h3 className="text-xs font-semibold text-violet-200/70 mb-3">ARDHA vs CBT</h3>
              <p className="text-xs text-white/45 leading-relaxed">
                CBT corrects <em>distorted thinking</em>. ARDHA corrects <em>mistaken identity</em>.
                Where CBT strengthens the functional ego, ARDHA loosens ego-identification
                toward inner freedom through right action.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-violet-950/15 border border-violet-500/8">
                <p className="text-[10px] text-violet-300/40 leading-relaxed">
                  Atma Distinction {'\u2192'} Raga-Dvesha Scan {'\u2192'} Dharma Alignment {'\u2192'} Hrdaya Samatvam {'\u2192'} Arpana
                </p>
              </div>
            </div>

            {/* 5 Compliance Tests */}
            <div className="rounded-[18px] border border-violet-500/8 bg-[#0a0812]/80 p-4">
              <h4 className="text-xs font-semibold text-violet-200/60 mb-3">5 Tests of Gita Compliance</h4>
              <ul className="space-y-2">
                {ARDHA_COMPLIANCE_TESTS.map((test, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[10px] text-violet-100/50">
                    <span className="mt-0.5 h-3 w-3 rounded-full bg-gradient-to-r from-violet-500/15 to-purple-500/15 border border-violet-500/10 flex items-center justify-center text-[7px] font-bold text-violet-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{test.test}</span>
                  </li>
                ))}
              </ul>
            </div>

            <SpiritualToolsNav currentTool="ardha" />
            <CompanionCTA fromTool="ardha" />
          </motion.section>
        </div>
      </div>
    </main>
  )
}
