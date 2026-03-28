'use client'

/**
 * Sacred Mobile Ardha Page — "Atma-Reframing through Dharma & Higher Awareness"
 *
 * Mobile-native implementation of the ARDHA cognitive reframing tool.
 * Uses the same /api/ardha/reframe endpoint as desktop but with
 * a fully touch-optimized, sacred mobile experience.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import {
  MobileSacredToolShell,
  MobileSacredSection,
  MobileCollapsibleCard,
} from '@/components/mobile/MobileSacredToolShell'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { VoiceInputButton } from '@/components/voice'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { BreathingDot } from '@/components/animations/BreathingDot'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useMicroPause } from '@/hooks/useMicroPause'
import { apiFetch } from '@/lib/api'
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
  return input.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)
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
      // localStorage full or unavailable
    }
  }, [key, state])

  return [state, setState]
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  const key = 'ardha_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  const bytes = new Uint8Array(6)
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  }
  const suffix = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const newId = `ardha_${Date.now()}_${suffix}`
  window.localStorage.setItem(key, newId)
  return newId
}

const QUICK_PROMPTS = [
  'I always fail at...',
  'Nobody cares about...',
  "I'm not good enough...",
  'Nothing will change...',
]

function ComplianceIndicator({ compliance }: { compliance: ArdhaCompliance | undefined }) {
  if (!compliance) return null
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-[#f5e6c8]/70">
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
            <span className={test.passed ? 'text-[#f5e6c8]/70' : 'text-[#f5e6c8]/35'}>
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
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-[#f5e6c8]/70">ARDHA Analysis</h4>
      <p className="text-xs text-[#f5e6c8]/50">
        Detected:{' '}
        <span className="text-[#e8b54a]/80">
          {analysis.primary_emotion?.replace(/_/g, ' ')}
        </span>
      </p>
      <div className="space-y-2">
        {analysis.pillars?.map((pillar, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 h-4 w-4 rounded-md bg-gradient-to-r from-[#d4a44c]/20 to-[#e8b54a]/20 border border-[#d4a44c]/15 flex items-center justify-center text-[8px] font-bold text-[#e8b54a] shrink-0">
              {pillar.code}
            </span>
            <div>
              <span className="text-[#f5e6c8]/70">{pillar.name}</span>
              <p className="text-[#f5e6c8]/35 text-[10px]">{pillar.compliance_test}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MobileArdhaPage() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe_v2', null)
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null)
  const analysisMode: DepthMode = 'quick'

  const { language } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()

  const { showPause } = useMicroPause({
    loading,
    hasResult: !!result,
    tool: 'ardha',
  })

  useEffect(() => {
    if (error) setError(null)
  }, [thought, error])

  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setThought((prev) => (prev.trim() ? `${prev} ${text.trim()}` : text.trim()))
  }, [])

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      triggerHaptic('selection')
      setThought(prompt)
    },
    [triggerHaptic]
  )

  async function requestReframe() {
    const trimmedThought = sanitizeInput(thought.trim())
    if (!trimmedThought) return

    triggerHaptic('medium')
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
        const status = data.status || 'error'
        if (status === 'service_unavailable' || response.status === 503) {
          setError('ARDHA is gathering wisdom. Please ensure the AI service is configured and try again.')
        } else if (status === 'rate_limited' || response.status === 429) {
          setError('Take a breath. Too many requests — please wait a moment.')
        } else if (status === 'timeout' || response.status === 504) {
          setError('The request took too long. Please try with a shorter thought.')
        } else if (status === 'connection_error') {
          setError('Unable to connect to ARDHA. Please check your internet connection.')
        } else {
          setError(data.error || 'An unexpected error occurred.')
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
        triggerHaptic('success')
      } else {
        setError('ARDHA could not generate a response. Please try again with a different thought.')
      }
    } catch {
      setError('Unable to reach ARDHA. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MobileAppShell title="Ardha" showBack>
      <MobileSacredToolShell
        title="Ardha"
        sanskrit={'\u0905\u0930\u094D\u0927'}
        subtitle="Atma-Reframing through Dharma & Higher Awareness"
        verse={{
          english: 'The unreal has no existence, and the real never ceases to be.',
          reference: 'Bhagavad Gita 2.16',
        }}
      >
        {/* Input Section */}
        <MobileSacredSection>
          <div
            className="rounded-[20px] border border-[#d4a44c]/10 bg-[#0d0a06]/90 p-4"
            style={{ boxShadow: '0 8px 32px rgba(212, 164, 76, 0.04)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="m-thought-input"
                className="text-sm font-medium text-[#f5e6c8]/80"
              >
                Share the thought to reframe
              </label>
              <VoiceInputButton
                language={language}
                onTranscript={handleVoiceTranscript}
                disabled={loading}
              />
            </div>

            <MobileTextarea
              id="m-thought-input"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="Type a thought that troubles you... ARDHA will see through the distortion to the truth beneath."
              minRows={4}
              className="!bg-black/40 !border-[#d4a44c]/10 !text-[#f5f0e8]/90 !placeholder:text-[#d4a44c]/20"
              aria-describedby="m-thought-hint"
            />
            <p id="m-thought-hint" className="sr-only">
              Describe the negative thought you want to reframe through ARDHA
            </p>

            {/* Quick Prompts */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {QUICK_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] text-[#d4a44c]/60 border border-[#d4a44c]/12 bg-[#d4a44c]/[0.04] active:bg-[#d4a44c]/[0.1] transition-colors whitespace-nowrap"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={requestReframe}
              disabled={!thought.trim() || loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#c8943a] via-[#d4a44c] to-[#e8b54a] text-[#0a0a0f] text-sm font-semibold shadow-lg shadow-[#d4a44c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:shadow-[#d4a44c]/30 min-h-[48px]"
              aria-label={loading ? 'ARDHA is reflecting...' : 'Reframe with ARDHA'}
            >
              {loading ? 'ARDHA is reflecting...' : 'Reframe with ARDHA'}
            </motion.button>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 text-sm text-[#e8b54a]/70"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </MobileSacredSection>

        {/* Loading */}
        {loading && (
          <MobileSacredSection>
            <WisdomLoadingState tool="ardha" />
          </MobileSacredSection>
        )}

        <BreathingDot visible={showPause} />

        {/* Response */}
        {result && !loading && !showPause && (
          <>
            <MobileSacredSection>
              <WisdomResponseCard
                tool="ardha"
                sections={result.sections}
                fullResponse={result.response}
                timestamp={result.requestedAt}
                language={language}
                analysisMode={result.depth || analysisMode}
                sources={result.sources}
              />
            </MobileSacredSection>

            {/* Analysis + Compliance — stacked vertically on mobile */}
            {(result.ardha_analysis || result.compliance) && (
              <MobileSacredSection>
                <MobileCollapsibleCard title="ARDHA Analysis & Compliance" defaultOpen>
                  <div className="space-y-4">
                    <PillarAnalysis analysis={result.ardha_analysis} />
                    <ComplianceIndicator compliance={result.compliance} />
                  </div>
                </MobileCollapsibleCard>
              </MobileSacredSection>
            )}
          </>
        )}

        {/* 5 ARDHA Pillars — expandable cards */}
        <MobileSacredSection>
          <MobileCollapsibleCard
            title="ARDHA's 5 Pillars"
            icon={
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#d4a44c] inline-block"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            }
          >
            <div className="space-y-2">
              {ARDHA_PILLARS.map((pillar, idx) => (
                <div
                  key={pillar.code}
                  className="rounded-xl border border-[#d4a44c]/8 bg-black/20 overflow-hidden"
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('selection')
                      setExpandedPillar(expandedPillar === idx ? null : idx)
                    }}
                    className="w-full flex items-start gap-2 text-left p-3 min-h-[44px]"
                    aria-expanded={expandedPillar === idx}
                  >
                    <span className="mt-0.5 h-5 w-5 rounded-md bg-gradient-to-r from-[#d4a44c]/15 to-[#e8b54a]/15 border border-[#d4a44c]/10 flex items-center justify-center text-[10px] font-bold text-[#e8b54a] shrink-0">
                      {pillar.icon}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-[#f5e6c8]/80">
                        {pillar.name}
                      </span>
                      <span className="text-[10px] text-[#d4a44c]/30 ml-1">
                        ({pillar.sanskritName})
                      </span>
                    </div>
                    <motion.span
                      className="text-[#d4a44c]/25 text-xs shrink-0"
                      animate={{ rotate: expandedPillar === idx ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {expandedPillar === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pl-10 space-y-2">
                          <p className="text-[10px] text-[#f5e6c8]/50 leading-relaxed">
                            {pillar.coreTeaching}
                          </p>
                          <div className="text-[10px] text-[#f5e6c8]/35">
                            <span className="font-semibold text-[#e8b54a]/50">
                              Test:{' '}
                            </span>
                            {pillar.complianceTest}
                          </div>
                          {pillar.keyVerses[0] && (
                            <div className="p-2 rounded-lg bg-[#d4a44c]/[0.04] border border-[#d4a44c]/8">
                              <p className="text-[10px] text-[#e8b54a]/60 font-semibold">
                                {pillar.keyVerses[0].reference}
                              </p>
                              <p className="text-[10px] text-[#f5e6c8]/40 italic mt-0.5">
                                {pillar.keyVerses[0].english}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* ARDHA vs CBT */}
        <MobileSacredSection>
          <MobileCollapsibleCard title="ARDHA vs CBT" icon={<Flame className="w-3.5 h-3.5" />}>
            <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
              CBT corrects <em>distorted thinking</em>. ARDHA corrects{' '}
              <em>mistaken identity</em>. Where CBT strengthens the functional ego,
              ARDHA loosens ego-identification toward inner freedom through right action.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#d4a44c]/[0.03] border border-[#d4a44c]/8">
              <p className="text-[10px] text-[#d4a44c]/30 leading-relaxed">
                Atma Distinction → Raga-Dvesha Scan → Dharma Alignment → Hrdaya
                Samatvam → Arpana
              </p>
            </div>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* 5 Compliance Tests */}
        <MobileSacredSection>
          <MobileCollapsibleCard title="5 Tests of Gita Compliance">
            <ul className="space-y-2">
              {ARDHA_COMPLIANCE_TESTS.map((test, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[10px] text-[#f5e6c8]/50"
                >
                  <span className="mt-0.5 h-3 w-3 rounded-full bg-gradient-to-r from-[#d4a44c]/15 to-[#e8b54a]/15 border border-[#d4a44c]/10 flex items-center justify-center text-[7px] font-bold text-[#e8b54a] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{test.test}</span>
                </li>
              ))}
            </ul>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* Navigation */}
        <MobileSacredSection>
          <SpiritualToolsNav currentTool="ardha" />
        </MobileSacredSection>

        <MobileSacredSection>
          <CompanionCTA fromTool="ardha" />
        </MobileSacredSection>
      </MobileSacredToolShell>
    </MobileAppShell>
  )
}
