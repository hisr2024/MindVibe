'use client'

/**
 * Sacred Mobile Relationship Compass Page — "Dharma-Guided Relationship Clarity"
 *
 * Mobile-native implementation of the Relationship Compass tool.
 * Uses the same /api/relationship-compass/guide endpoint as desktop
 * but with a fully touch-optimized, sacred mobile experience.
 *
 * Features the 5-step Gita framework for relationship clarity:
 * 1. Pause Before Reacting
 * 2. Identify the Attachment
 * 3. Regulate Before You Communicate
 * 4. Speak Without Demanding an Outcome
 * 5. See Their Humanity
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import {
  MobileSacredToolShell,
  MobileSacredSection,
  MobileCollapsibleCard,
} from '@/components/mobile/MobileSacredToolShell'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { VoiceInputButton } from '@/components/voice/VoiceInputButton'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)
}

function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const item = window.localStorage.getItem(key)
      if (item) return JSON.parse(item)
    } catch {
      // localStorage unavailable
    }
    return initial
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

type RelationshipCompassResult = {
  response: string
  sections: Record<string, string>
  requestedAt: string
  gitaVerses?: number
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  contextSufficient?: boolean
  secularMode?: boolean
}

const GUIDANCE_PATHS = [
  'Conflict with partner that feels stuck',
  'Understanding both sides of a disagreement',
  'The right thing to do in a difficult situation',
  'A conversation I have been avoiding',
]

export default function MobileRelationshipCompassPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()

  const [conflict, setConflict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<RelationshipCompassResult | null>(
    'relationship_compass',
    null
  )
  const [sessionId, setSessionId] = useLocalState<string>('relationship_compass_session', '')

  useEffect(() => {
    if (error) setError(null)
  }, [conflict, error])

  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID())
    }
  }, [sessionId, setSessionId])

  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setConflict((prev) => {
      const separator = prev.trim() ? ' ' : ''
      return prev + separator + text.trim()
    })
  }, [])

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      triggerHaptic('selection')
      setConflict(prompt)
    },
    [triggerHaptic]
  )

  async function requestCompass() {
    const trimmedConflict = sanitizeInput(conflict.trim())
    if (!trimmedConflict || !sessionId) return

    triggerHaptic('medium')
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/relationship-compass/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedConflict,
          sessionId,
          relationshipType: 'other',
          secularMode: false,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok && !data.response) {
        setError(
          'Relationship Compass is gathering wisdom. Please try again shortly.'
        )
        return
      }

      const guidance = data.sections
      const fullResponse =
        data.response || formatCompassGuidance(guidance)
      const citations = Array.isArray(data.citations)
        ? data.citations.map(
            (citation: {
              source?: string
              source_file?: string
              chapter?: string
              verse?: string
              chunk_id?: string
            }) => ({
              source_file:
                citation.source_file || citation.source || 'Unknown source',
              reference_if_any:
                citation.chapter && citation.verse
                  ? `${citation.chapter}:${citation.verse}`
                  : undefined,
              chunk_id: citation.chunk_id || 'unknown',
            })
          )
        : []

      if (guidance && typeof guidance === 'object') {
        setResult({
          response: fullResponse,
          sections: guidance,
          requestedAt: new Date().toISOString(),
          gitaVerses: citations.length,
          citations,
          contextSufficient: data.contextSufficient,
          secularMode: data.secularMode !== false,
        })
        triggerHaptic('success')
      } else if (fullResponse) {
        setResult({
          response: fullResponse,
          sections: {},
          requestedAt: new Date().toISOString(),
          gitaVerses: citations.length,
          citations,
          contextSufficient: data.contextSufficient,
          secularMode: data.secularMode !== false,
        })
        triggerHaptic('success')
      } else {
        setError(
          'Relationship Compass could not generate a response. Please try again.'
        )
      }
    } catch {
      setError(
        'Unable to reach Relationship Compass. Check your connection and retry.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatCompassGuidance(
    guidance: Record<string, string> | undefined
  ): string {
    if (!guidance) return ''
    return Object.entries(guidance)
      .map(([title, content]) => `${title}\n${content}`)
      .join('\n\n')
  }

  return (
    <MobileAppShell title="Relationship Compass" showBack>
      <MobileSacredToolShell
        title="Relationship Compass"
        sanskrit={'\u0938\u0902\u092C\u0928\u094D\u0927'}
        subtitle="Dharma-Guided Relationship Clarity"
        verse={{
          english:
            'One who sees all beings in the Self and the Self in all beings never shrinks from anything.',
          reference: 'Bhagavad Gita 6.29',
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
                htmlFor="m-conflict-input"
                className="text-sm font-medium text-[#f5e6c8]/80"
              >
                Describe the relationship challenge
              </label>
              <VoiceInputButton
                language={language}
                onTranscript={handleVoiceTranscript}
                disabled={loading}
              />
            </div>

            <MobileTextarea
              id="m-conflict-input"
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              placeholder="Share what is happening in this relationship... the Compass will illuminate both perspectives with Gita wisdom."
              minRows={4}
              className="!bg-black/40 !border-[#d4a44c]/10 !text-[#f5f0e8]/90 !placeholder:text-[#d4a44c]/20"
              aria-describedby="m-conflict-hint"
            />
            <p id="m-conflict-hint" className="sr-only">
              Describe the relationship conflict you need guidance with
            </p>

            {/* Quick Prompts — horizontally scrollable */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {GUIDANCE_PATHS.map((path) => (
                <motion.button
                  key={path}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickPrompt(path)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] text-[#d4a44c]/60 border border-[#d4a44c]/12 bg-[#d4a44c]/[0.04] active:bg-[#d4a44c]/[0.1] transition-colors whitespace-nowrap"
                >
                  {path}
                </motion.button>
              ))}
            </div>

            {/* Submit + Talk to KIAAN */}
            <div className="space-y-2 mt-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={requestCompass}
                disabled={!conflict.trim() || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c8943a] via-[#d4a44c] to-[#e8b54a] text-[#0a0a0f] text-sm font-semibold shadow-lg shadow-[#d4a44c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:shadow-[#d4a44c]/30 min-h-[48px]"
                aria-label={loading ? 'Seeking clarity...' : 'Seek Dharmic Guidance'}
              >
                {loading ? 'Seeking clarity...' : 'Seek Dharmic Guidance'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  triggerHaptic('selection')
                  router.push('/m/kiaan')
                }}
                className="w-full py-3 rounded-xl bg-white/5 border border-[#d4a44c]/15 text-[#f5e6c8]/60 text-sm font-medium active:border-[#d4a44c]/30 transition-colors min-h-[44px] flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to KIAAN
              </motion.button>
            </div>

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
            <WisdomLoadingState tool="relationship_compass" />
          </MobileSacredSection>
        )}

        {/* Response */}
        {result && !loading && (
          <MobileSacredSection>
            <WisdomResponseCard
              tool="relationship_compass"
              sections={result.sections}
              fullResponse={result.response}
              gitaVersesUsed={result.gitaVerses}
              timestamp={result.requestedAt}
              language="en-IN"
              citations={result.citations}
              secularMode={result.secularMode !== false}
            />
          </MobileSacredSection>
        )}

        {/* When to Seek Guidance */}
        <MobileSacredSection>
          <MobileCollapsibleCard
            title="When to seek guidance"
            icon={
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#d4a44c] inline-block"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            }
          >
            <ul className="space-y-3 text-sm text-[#f5f0e8]/55 leading-relaxed">
              {[
                'Conflicts with partner, family, or friends that feel stuck',
                'Understanding both sides of a disagreement',
                'The right thing to do in a difficult situation',
                'Having a conversation you have been avoiding',
              ].map((path, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a44c]/40 shrink-0" />
                  <span>{path}</span>
                </li>
              ))}
            </ul>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* The Compass Process */}
        <MobileSacredSection>
          <MobileCollapsibleCard
            title="The Compass Process"
            icon={<Users className="w-3.5 h-3.5" />}
          >
            <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
              The Compass draws from the Gita&apos;s teachings on righteous conduct
              and compassion. It illuminates both sides with clarity, never taking
              sides — always honoring truth.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#d4a44c]/[0.03] border border-[#d4a44c]/8">
              <p className="text-[10px] text-[#d4a44c]/30 leading-relaxed">
                Pause → Identify Attachment → Regulate → Speak Without Demanding →
                See Their Humanity
              </p>
            </div>
          </MobileCollapsibleCard>
        </MobileSacredSection>

        {/* Navigation */}
        <MobileSacredSection>
          <SpiritualToolsNav currentTool="relationship-compass" />
        </MobileSacredSection>

        <MobileSacredSection>
          <CompanionCTA fromTool="relationship-compass" />
        </MobileSacredSection>
      </MobileSacredToolShell>
    </MobileAppShell>
  )
}
