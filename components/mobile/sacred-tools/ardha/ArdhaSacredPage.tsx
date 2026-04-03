'use client'

/**
 * ArdhaSacredPage — Enhanced Ardha with full Kiaanverse sacred design
 *
 * Same API (/api/ardha/reframe), same response generation —
 * but with cosmic-void backgrounds, sacred cards, VerseRevelation
 * for pillars, divine-gold accents, and the full sacred design system.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredDivider } from '@/components/sacred/SacredDivider'
import { VerseRevelation } from '@/components/sacred/VerseRevelation'
import { VoiceInputButton } from '@/components/voice'
import WisdomResponseCard from '@/components/tools/WisdomResponseCard'
import { BreathingDot } from '@/components/animations/BreathingDot'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { SacredLoadingCycle } from '../shared/SacredLoadingCycle'
import { SacredMovementShell } from '../shared/SacredMovementShell'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useMicroPause } from '@/hooks/useMicroPause'
import { apiFetch } from '@/lib/api'
import { sanitizeInput } from '@/lib/utils/sanitizeInput'
import { springConfigs } from '@/lib/animations/spring-configs'
import {
  ARDHA_PILLARS,
  ARDHA_COMPLIANCE_TESTS,
  parseArdhaSections,
  type ArdhaResult,
  type DepthMode,
} from '@/lib/ardha-knowledge'

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
    try { window.localStorage.setItem(key, JSON.stringify(state)) } catch { /* */ }
  }, [key, state])
  return [state, setState]
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  const key = 'ardha_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const bytes = new Uint8Array(6)
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes)
  const suffix = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
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

export default function ArdhaSacredPage() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe_v2', null)
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null)
  const analysisMode: DepthMode = 'quick'

  const { language } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()
  const { showPause } = useMicroPause({ loading, hasResult: !!result, tool: 'ardha' })

  useEffect(() => { if (error) setError(null) }, [thought, error])

  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setThought((prev) => (prev.trim() ? `${prev} ${text.trim()}` : text.trim()))
  }, [])

  async function requestReframe() {
    const trimmed = sanitizeInput(thought.trim())
    if (!trimmed) return
    triggerHaptic('medium')
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch('/api/ardha/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thought: trimmed, depth: analysisMode, sessionId: getOrCreateSessionId() }),
      })
      const data = await response.json()
      if (!response.ok) {
        const status = data.status || 'error'
        if (status === 'service_unavailable' || response.status === 503) setError('ARDHA is gathering wisdom. Please try again.')
        else if (status === 'rate_limited' || response.status === 429) setError('Take a breath. Too many requests.')
        else if (status === 'timeout' || response.status === 504) setError('Request took too long. Try a shorter thought.')
        else setError(data.error || 'An unexpected error occurred.')
        return
      }
      if (data.response) {
        setResult({
          response: data.response,
          sections: parseArdhaSections(data.response),
          requestedAt: new Date().toISOString(),
          sources: data.sources || [],
          depth: data.depth || analysisMode,
          ardha_analysis: data.ardha_analysis,
          compliance: data.compliance,
        })
        triggerHaptic('success')
      } else {
        setError('ARDHA could not generate a response. Try a different thought.')
      }
    } catch {
      setError('Unable to reach ARDHA. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SacredMovementShell>
      {/* Sacred Entry Header */}
      <motion.div
        className="text-center space-y-2 pt-2 pb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfigs.gentle}
      >
        <motion.h1
          className="font-divine text-3xl text-[var(--sacred-divine-gold,#D4A017)]"
          style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
        >
          अर्ध
        </motion.h1>
        <h2 className="font-divine text-lg bg-gradient-to-r from-[#e8b54a] via-[#d4a44c] to-[#f5e6c8] bg-clip-text text-transparent">
          Ardha
        </h2>
        <p className="font-sacred italic text-xs text-[var(--sacred-text-secondary,#B8AE98)]">
          Atma-Reframing through Dharma &amp; Higher Awareness
        </p>
        <SacredDivider />
        <p className="font-sacred italic text-xs text-[var(--sacred-text-muted,#6B6355)] px-6 leading-relaxed">
          &ldquo;The unreal has no existence, and the real never ceases to be.&rdquo;
          <span className="block mt-1 text-[9px] tracking-wide">Bhagavad Gita 2.16</span>
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfigs.smooth, delay: 0.1 }}
      >
        <SacredCard variant="divine" className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="ardha-thought" className="font-sacred text-sm text-[var(--sacred-text-primary,#EDE8DC)]">
              Share the thought to reframe
            </label>
            <VoiceInputButton language={language} onTranscript={handleVoiceTranscript} disabled={loading} />
          </div>
          <textarea
            id="ardha-thought"
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Type a thought that troubles you... ARDHA will see through the distortion to the truth beneath."
            className="sacred-input w-full min-h-[100px] resize-none px-4 py-3 text-[16px] font-sacred italic placeholder:text-[var(--sacred-text-muted)]"
          />

          {/* Quick Prompts */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {QUICK_PROMPTS.map((prompt) => (
              <motion.button
                key={prompt}
                whileTap={{ scale: 0.95 }}
                onClick={() => { triggerHaptic('selection'); setThought(prompt) }}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-ui text-[var(--sacred-divine-gold,#D4A017)] border border-[var(--sacred-divine-gold,#D4A017)]/20 bg-[var(--sacred-divine-gold,#D4A017)]/[0.04] active:bg-[var(--sacred-divine-gold)]/[0.1] transition-colors whitespace-nowrap"
              >
                {prompt}
              </motion.button>
            ))}
          </div>

          <SacredButton variant="divine" fullWidth onClick={requestReframe} disabled={!thought.trim() || loading}>
            {loading ? 'ARDHA is reflecting...' : 'Reframe with ARDHA'}
          </SacredButton>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-[#e8b54a]/70" role="alert" aria-live="assertive">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </SacredCard>
      </motion.div>

      {/* Loading */}
      {loading && (
        <SacredLoadingCycle messages={[
          'ARDHA is examining the distortion...',
          'Distinguishing Atman from Prakriti...',
          'Scanning for Raga-Dvesha patterns...',
          'Aligning with Dharma...',
        ]} />
      )}

      <BreathingDot visible={showPause} />

      {/* Response */}
      {result && !loading && !showPause && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfigs.smooth}
          className="space-y-4"
        >
          <SacredCard variant="divine">
            <WisdomResponseCard
              tool="ardha"
              sections={result.sections}
              fullResponse={result.response}
              timestamp={result.requestedAt}
              language={language}
              analysisMode={result.depth || analysisMode}
              sources={result.sources}
            />
          </SacredCard>

          {/* Analysis + Compliance */}
          {(result.ardha_analysis || result.compliance) && (
            <SacredCard>
              <h4 className="font-divine text-sm text-[var(--sacred-divine-gold)] mb-3">ARDHA Analysis</h4>
              {result.ardha_analysis && !result.ardha_analysis.crisis_detected && (
                <div className="space-y-2 mb-3">
                  <p className="font-ui text-xs text-[var(--sacred-text-secondary)]">
                    Detected: <span className="text-[var(--sacred-divine-gold-bright,#F0C040)]">{result.ardha_analysis.primary_emotion?.replace(/_/g, ' ')}</span>
                  </p>
                  {result.ardha_analysis.pillars?.map((pillar, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 h-4 w-4 rounded-md bg-[var(--sacred-divine-gold)]/20 border border-[var(--sacred-divine-gold)]/15 flex items-center justify-center text-[8px] font-bold text-[var(--sacred-divine-gold-bright)] shrink-0">
                        {pillar.code}
                      </span>
                      <div>
                        <span className="text-[var(--sacred-text-primary)]">{pillar.name}</span>
                        <p className="text-[var(--sacred-text-muted)] text-[10px]">{pillar.compliance_test}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.compliance && (
                <>
                  <SacredDivider />
                  <div className="mt-3 space-y-2">
                    <h4 className="font-ui text-xs text-[var(--sacred-text-secondary)]">
                      Gita Compliance ({result.compliance.score}/{result.compliance.max_score})
                    </h4>
                    {result.compliance.tests?.map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${test.passed ? 'bg-emerald-400/80' : 'bg-red-400/40'}`} />
                        <span className={test.passed ? 'text-[var(--sacred-text-primary)]' : 'text-[var(--sacred-text-muted)]'}>{test.test}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SacredCard>
          )}
        </motion.div>
      )}

      {/* 5 ARDHA Pillars with VerseRevelation */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfigs.smooth, delay: 0.2 }}
      >
        <SacredCard className="space-y-3">
          <h3 className="font-divine text-sm text-[var(--sacred-divine-gold)] flex items-center gap-2">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[var(--sacred-divine-gold)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            ARDHA&apos;s 5 Pillars
          </h3>
          <div className="space-y-2">
            {ARDHA_PILLARS.map((pillar, idx) => (
              <SacredCard
                key={pillar.code}
                interactive
                className="!p-3"
                onClick={() => { triggerHaptic('selection'); setExpandedPillar(expandedPillar === idx ? null : idx) }}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-5 w-5 rounded-md bg-[var(--sacred-divine-gold)]/15 border border-[var(--sacred-divine-gold)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--sacred-divine-gold-bright)] shrink-0">
                    {pillar.icon}
                  </span>
                  <div className="flex-1">
                    <span className="font-ui text-xs font-semibold text-[var(--sacred-text-primary)]">{pillar.name}</span>
                    <span className="font-divine italic text-[10px] text-[var(--sacred-text-muted)] ml-1">({pillar.sanskritName})</span>
                  </div>
                  <motion.span className="text-[var(--sacred-text-muted)] text-xs" animate={{ rotate: expandedPillar === idx ? 180 : 0 }}>▼</motion.span>
                </div>
                <AnimatePresence>
                  {expandedPillar === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pl-7 space-y-2">
                        <p className="font-sacred text-[10px] text-[var(--sacred-text-secondary)] leading-relaxed">{pillar.coreTeaching}</p>
                        <p className="text-[10px] text-[var(--sacred-text-muted)]">
                          <span className="font-semibold text-[var(--sacred-divine-gold-bright)]">Test: </span>
                          {pillar.complianceTest}
                        </p>
                        {pillar.keyVerses[0] && (
                          <VerseRevelation
                            meaning={pillar.keyVerses[0].english}
                            reference={pillar.keyVerses[0].reference}
                            staggerMs={60}
                            className="!p-2 !text-[10px]"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SacredCard>
            ))}
          </div>
        </SacredCard>
      </motion.div>

      {/* ARDHA vs CBT */}
      <SacredCard>
        <h3 className="font-divine text-xs text-[var(--sacred-text-secondary)] mb-2">ARDHA vs CBT</h3>
        <p className="font-sacred text-xs text-[var(--sacred-text-primary)] leading-relaxed">
          CBT corrects <em>distorted thinking</em>. ARDHA corrects <em>mistaken identity</em>.
          Where CBT strengthens the functional ego, ARDHA loosens ego-identification
          toward inner freedom through right action.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-[var(--sacred-divine-gold)]/[0.03] border border-[var(--sacred-divine-gold)]/10">
          <p className="font-ui text-[10px] text-[var(--sacred-text-muted)] leading-relaxed">
            Atma Distinction → Raga-Dvesha Scan → Dharma Alignment → Hrdaya Samatvam → Arpana
          </p>
        </div>
      </SacredCard>

      {/* 5 Compliance Tests */}
      <SacredCard>
        <h4 className="font-divine text-xs text-[var(--sacred-text-secondary)] mb-3">5 Tests of Gita Compliance</h4>
        <ul className="space-y-2">
          {ARDHA_COMPLIANCE_TESTS.map((test, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[10px] text-[var(--sacred-text-secondary)]">
              <span className="mt-0.5 h-3 w-3 rounded-full bg-[var(--sacred-divine-gold)]/15 border border-[var(--sacred-divine-gold)]/10 flex items-center justify-center text-[7px] font-bold text-[var(--sacred-divine-gold-bright)] shrink-0">
                {idx + 1}
              </span>
              <span>{test.test}</span>
            </li>
          ))}
        </ul>
      </SacredCard>

      <SpiritualToolsNav currentTool="ardha" />
      <CompanionCTA fromTool="ardha" />
    </SacredMovementShell>
  )
}
