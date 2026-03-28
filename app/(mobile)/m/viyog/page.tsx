'use client'

/**
 * Sacred Mobile Viyoga Page — "The Art of Letting Go"
 *
 * Mobile-native implementation of the Viyoga detachment tool.
 * Uses the same /api/viyoga/chat endpoint as desktop but with
 * a fully touch-optimized, sacred mobile experience.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import {
  MobileSacredToolShell,
  MobileSacredSection,
  MobileCollapsibleCard,
} from '@/components/mobile/MobileSacredToolShell'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { MobileCard } from '@/components/mobile/MobileCard'
import { VoiceInputButton } from '@/components/voice'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { BreathingDot } from '@/components/animations/BreathingDot'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useMicroPause } from '@/hooks/useMicroPause'
import { apiFetch } from '@/lib/api'
import { springConfigs } from '@/lib/animations/spring-configs'

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

type ConcernAnalysis = {
  specific_worry?: string
  why_it_matters?: string
  what_they_fear?: string
  primary_emotion?: string
  emotional_intensity?: string
  attachment_type?: string
  attachment_object?: string
  root_cause?: string
  detachment_approach?: string
  effort_redirect?: string
  in_their_control?: string[]
  not_in_their_control?: string[]
  confidence?: number
  analysis_depth?: string
}

type ViyogResult = {
  response: string
  sections: Record<string, string>
  requestedAt: string
  gitaVerses?: number
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  concernAnalysis?: ConcernAnalysis | null
  provider?: string
}

const QUICK_PROMPTS = [
  'I\'m worried about...',
  'I can\'t let go of...',
  'I\'m attached to the outcome of...',
  'I keep thinking about...',
]

export default function MobileViyogPage() {
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ViyogResult | null>('viyog_detachment', null)
  const [sessionId, setSessionId] = useLocalState<string>('viyog_session', '')

  const { language } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()

  const { showPause } = useMicroPause({
    loading,
    hasResult: !!result,
    tool: 'viyoga',
  })

  useEffect(() => {
    if (error) setError(null)
  }, [concern, error])

  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      setSessionId(window.crypto.randomUUID())
    }
  }, [sessionId, setSessionId])

  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setConcern((prev) => (prev.trim() ? `${prev} ${text.trim()}` : text.trim()))
  }, [])

  const handleQuickPrompt = useCallback((prompt: string) => {
    triggerHaptic('selection')
    setConcern(prompt)
  }, [triggerHaptic])

  async function requestDetachment() {
    const trimmedConcern = sanitizeInput(concern.trim())
    if (!trimmedConcern) return

    triggerHaptic('medium')
    setLoading(true)
    setError(null)

    try {
      const activeSessionId = sessionId || window.crypto.randomUUID()
      if (!sessionId) setSessionId(activeSessionId)

      const response = await apiFetch('/api/viyoga/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedConcern,
          sessionId: activeSessionId,
          mode: 'full',
        }),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Session expired. Please refresh and try again.')
        } else if (response.status === 429) {
          setError('Take a breath. Too many requests — please wait a moment.')
        } else if (response.status === 503) {
          setError('Viyoga is gathering wisdom. Please try again shortly.')
        } else if (response.status >= 500) {
          setError('Viyoga encountered an issue. Please try again.')
        } else {
          setError('Unable to process your request. Please try again.')
        }
        return
      }

      const data = await response.json()
      const responseText = typeof data.assistant === 'string' ? data.assistant : ''
      const sections =
        data.sections && typeof data.sections === 'object' ? data.sections : {}
      const citations = Array.isArray(data.citations) ? data.citations : []

      if (!responseText) {
        setError('Viyoga could not generate a response. Please try again.')
        return
      }

      const normalized: Record<string, string> = {}
      Object.entries(sections).forEach(([key, value]) => {
        if (value) normalized[key] = value as string
      })

      setResult({
        response: responseText,
        sections: normalized,
        requestedAt: new Date().toISOString(),
        gitaVerses: data.gita_verses_used || citations.length,
        citations,
        concernAnalysis: data.concern_analysis || null,
        provider: data.provider || data.retrieval?.strategy || 'unknown',
      })

      triggerHaptic('success')
    } catch {
      setError('Unable to reach Viyoga. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.concernAnalysis
  const showAnalysis =
    analysis && analysis.analysis_depth === 'ai_enhanced' && !loading && !showPause && result

  return (
    <MobileAppShell title="Viyoga" showBack>
      <MobileSacredToolShell
        title="Viyoga"
        sanskrit={'\u0935\u093F\u092F\u094B\u0917'}
        subtitle="The Sacred Art of Detachment"
        verse={{
          english:
            'You have the right to perform your actions, but you are not entitled to the fruits of your actions.',
          reference: 'Bhagavad Gita 2.47',
        }}
      >
        {/* Input Section */}
        <MobileSacredSection>
          <div
            className="rounded-[20px] border border-[#d4a44c]/10 bg-[#0d0a06]/90 p-4"
            style={{ boxShadow: '0 8px 32px rgba(212, 164, 76, 0.04)' }}
          >
            {/* Voice + Label row */}
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="m-concern-input"
                className="text-sm font-medium text-[#f5e6c8]/80"
              >
                What is weighing on your heart?
              </label>
              <VoiceInputButton
                language={language}
                onTranscript={handleVoiceTranscript}
                disabled={loading}
              />
            </div>

            <MobileTextarea
              id="m-concern-input"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Share what outcome you are attached to... what worry you carry..."
              minRows={4}
              className="!bg-black/40 !border-[#d4a44c]/10 !text-[#f5f0e8]/90 !placeholder:text-[#d4a44c]/20"
              aria-describedby="m-concern-hint"
            />
            <p id="m-concern-hint" className="sr-only">
              Describe what you are worried about
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

            {/* Submit Button — full width on mobile */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={requestDetachment}
              disabled={!concern.trim() || loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#c8943a] via-[#d4a44c] to-[#e8b54a] text-[#0a0a0f] text-sm font-semibold shadow-lg shadow-[#d4a44c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:shadow-[#d4a44c]/30 min-h-[48px]"
              aria-label={loading ? 'Receiving wisdom...' : 'Release & Receive Wisdom'}
            >
              {loading ? 'Receiving wisdom...' : 'Release & Receive Wisdom'}
            </motion.button>

            {/* Error */}
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

        {/* Loading State */}
        {loading && (
          <MobileSacredSection>
            <WisdomLoadingState tool="viyoga" secularMode={true} />
          </MobileSacredSection>
        )}

        <BreathingDot visible={showPause} />

        {/* Response */}
        {result && !loading && !showPause && (
          <MobileSacredSection>
            <WisdomResponseCard
              tool="viyoga"
              sections={result.sections}
              fullResponse={result.response}
              gitaVersesUsed={result.gitaVerses}
              timestamp={result.requestedAt}
              language={language}
              citations={result.citations}
              secularMode={true}
            />
          </MobileSacredSection>
        )}

        {/* Concern Analysis — was right sidebar on desktop, now collapsible card */}
        {showAnalysis && (
          <MobileSacredSection>
            <MobileCollapsibleCard
              title="What Krishna Sees"
              icon={
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#d4a44c] inline-block"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              }
              defaultOpen
            >
              <div className="space-y-2.5 text-xs text-[#f5e6c8]/60 leading-relaxed">
                {analysis!.primary_emotion && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">
                      Feeling:
                    </span>
                    <span className="capitalize">{analysis!.primary_emotion}</span>
                  </div>
                )}
                {analysis!.attachment_object && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">
                      Attached:
                    </span>
                    <span>{analysis!.attachment_object}</span>
                  </div>
                )}
                {analysis!.root_cause && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">
                      Root:
                    </span>
                    <span>{analysis!.root_cause}</span>
                  </div>
                )}
                {analysis!.effort_redirect && (
                  <div className="p-3 rounded-xl bg-black/30 border border-[#d4a44c]/8 mt-2">
                    <span className="text-[#d4a44c]/50 font-medium text-[10px] uppercase tracking-wider block mb-1">
                      Redirect energy toward
                    </span>
                    <span className="text-[#f5e6c8]/70">
                      {analysis!.effort_redirect}
                    </span>
                  </div>
                )}
                {analysis!.in_their_control &&
                  analysis!.in_their_control.length > 0 && (
                    <div className="mt-2">
                      <span className="text-emerald-400/50 font-medium text-[10px] uppercase tracking-wider block mb-1.5">
                        In your control
                      </span>
                      <ul className="space-y-1">
                        {analysis!.in_their_control.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400/40 mt-0.5 shrink-0">
                              +
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {analysis!.not_in_their_control &&
                  analysis!.not_in_their_control.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[#d4a44c]/40 font-medium text-[10px] uppercase tracking-wider block mb-1.5">
                        Not in your control
                      </span>
                      <ul className="space-y-1">
                        {analysis!.not_in_their_control.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#d4a44c]/35 mt-0.5 shrink-0">
                              &ndash;
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </MobileCollapsibleCard>
          </MobileSacredSection>
        )}

        {/* Sacred Teaching — The Path of Viyoga */}
        <MobileSacredSection>
          <MobileCollapsibleCard title="The Path of Viyoga" icon={<Leaf className="w-3.5 h-3.5" />}>
            <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
              Viyoga is the Gita&apos;s teaching of releasing attachment to outcomes.
              Not suppression, but freedom. You act with full effort, then release
              the result to the Divine. This is the path Krishna teaches Arjuna.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#d4a44c]/[0.03] border border-[#d4a44c]/8">
              <p className="text-[10px] text-[#d4a44c]/30 leading-relaxed">
                Share → Understand → See what you control → Shift to effort → Release
              </p>
            </div>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* Navigation */}
        <MobileSacredSection>
          <SpiritualToolsNav currentTool="viyoga" />
        </MobileSacredSection>

        <MobileSacredSection>
          <CompanionCTA fromTool="viyog" />
        </MobileSacredSection>
      </MobileSacredToolShell>
    </MobileAppShell>
  )
}
