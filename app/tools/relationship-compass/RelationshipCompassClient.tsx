'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .slice(0, 2000)
}

function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initial)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setState(JSON.parse(item))
      }
    } catch {
      // Silent fail for localStorage
    }
    setIsHydrated(true)
  }, [key])

  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Silent fail for localStorage
    }
  }, [key, state, isHydrated])

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

const ANCHOR_VERSE = {
  english: 'One who sees all beings in the Self and the Self in all beings never shrinks from anything.',
  reference: 'Bhagavad Gita 6.29',
}

const GUIDANCE_PATHS = [
  'Conflicts with partner, family, or friends that feel stuck',
  'Understanding both sides of a disagreement',
  'The right thing to do in a difficult situation',
  'Having a conversation you have been avoiding',
]

const SACRED_PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${14 + (i * 13) % 72}%`,
  delay: i * 0.9,
  duration: 5 + (i % 3),
}))

export default function RelationshipCompassClient() {
  const { t } = useLanguage()
  const [conflict, setConflict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<RelationshipCompassResult | null>('relationship_compass', null)
  const [sessionId, setSessionId] = useLocalState<string>('relationship_compass_session', '')

  useEffect(() => {
    if (error) setError(null)
  }, [conflict, error])

  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID())
    }
  }, [sessionId, setSessionId])

  async function requestCompass() {
    const trimmedConflict = sanitizeInput(conflict.trim())
    if (!trimmedConflict || !sessionId) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/relationship-compass/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedConflict,
          sessionId,
          relationshipType: 'other'
        })
      })

      if (!response.ok) {
        setError('Relationship Compass is gathering wisdom. Please try again shortly.')
        return
      }

      const data = await response.json()

      const guidance = data.sections
      const fullResponse = data.response || _formatCompassGuidance(guidance)
      const citations = Array.isArray(data.citations)
        ? data.citations.map((citation: { source?: string; source_file?: string; chapter?: string; verse?: string; chunk_id?: string }) => ({
          source_file: citation.source_file || citation.source || 'Unknown source',
          reference_if_any: citation.chapter && citation.verse ? `${citation.chapter}:${citation.verse}` : undefined,
          chunk_id: citation.chunk_id || 'unknown',
        }))
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
      } else {
        setError('Relationship Compass could not generate a response. Please try again.')
      }
    } catch {
      setError('Unable to reach Relationship Compass. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  function _formatCompassGuidance(guidance: Record<string, string> | undefined): string {
    if (!guidance) return ''
    const parts = Object.entries(guidance).map(([title, content]) => `${title}\n${content}`)
    return parts.join('\n\n')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#080305] via-[#0a0510] to-[#0c0810] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">

        {/* Sacred Header */}
        <motion.header
          className="relative overflow-hidden rounded-[28px] border border-rose-500/10 bg-gradient-to-br from-rose-950/30 via-[#0a0610] to-amber-950/15 p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            boxShadow: '0 16px 64px rgba(244, 63, 94, 0.06), inset 0 1px 0 rgba(244, 63, 94, 0.08)',
          }}
        >
          {SACRED_PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-rose-400/30"
              style={{ left: p.left, bottom: 0 }}
              animate={{ y: [0, -180], opacity: [0, 0.5, 0] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
            />
          ))}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] text-rose-400/50 hover:text-rose-300/70 transition-colors mb-5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Return to sanctuary
          </Link>

          <div className="flex items-start gap-4 sm:gap-5">
            <motion.div
              className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400/15 to-amber-500/10 border border-rose-500/10"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(244, 63, 94, 0.08)',
                  '0 0 35px rgba(244, 63, 94, 0.15)',
                  '0 0 20px rgba(244, 63, 94, 0.08)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-xl sm:text-2xl font-sacred text-rose-200/90 select-none">
                {'\u0938\u0902\u092C\u0928\u094D\u0927'}
              </span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-rose-100">Relationship Compass</h1>
              <p className="text-sm text-rose-300/50 font-sacred italic mt-1">
                Dharma-Guided Relationship Clarity
              </p>
              <p className="mt-1.5 text-[11px] tracking-wide text-rose-400/30">
                {t('dashboard.mode_label.prefix', 'You are in:')} {t('dashboard.mode_label.relationship-compass', 'Relationship Mode')}
              </p>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-rose-950/20 border border-rose-500/8">
            <p className="font-sacred text-sm text-rose-200/60 italic leading-relaxed">
              &ldquo;{ANCHOR_VERSE.english}&rdquo;
            </p>
            <p className="text-[10px] text-rose-400/30 mt-2 tracking-wide">
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
              className="rounded-[22px] border border-rose-500/10 bg-[#0a0810]/90 p-5 sm:p-6"
              style={{ boxShadow: '0 8px 40px rgba(244, 63, 94, 0.05)' }}
            >
              <label htmlFor="conflict-input" className="text-sm font-medium text-rose-100/80 block mb-3">
                Describe the relationship challenge
              </label>
              <textarea
                id="conflict-input"
                value={conflict}
                onChange={e => setConflict(e.target.value)}
                placeholder="Share what is happening in this relationship... the Compass will illuminate both perspectives with Gita wisdom."
                className="w-full min-h-[140px] rounded-xl bg-black/40 border border-rose-500/10 text-white/90 placeholder:text-white/25 p-4 text-sm leading-relaxed focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500/20 outline-none transition-all resize-none"
                aria-describedby="conflict-hint"
              />
              <p id="conflict-hint" className="sr-only">Describe the relationship conflict you need guidance with</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestCompass}
                  disabled={!conflict.trim() || loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-rose-500/30 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  aria-label={loading ? 'Processing...' : 'Seek Dharmic Guidance'}
                >
                  {loading ? 'Seeking clarity...' : 'Seek Dharmic Guidance'}
                </button>
                <Link
                  href="/kiaan/chat"
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-rose-500/15 text-rose-100/60 text-sm font-medium hover:border-rose-500/30 transition focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  Talk to KIAAN
                </Link>
              </div>

              {error && (
                <p className="mt-3 text-sm text-amber-300/80" role="alert">{error}</p>
              )}
            </div>

            {loading && <WisdomLoadingState tool="relationship_compass" />}

            {result && !loading && (
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
            )}
          </motion.section>

          {/* Right: Guidance Paths */}
          <motion.section
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div
              className="rounded-[20px] border border-rose-500/8 bg-[#0a0810]/80 p-5"
              style={{ boxShadow: '0 4px 24px rgba(244, 63, 94, 0.04)' }}
            >
              <h3 className="text-xs font-semibold text-rose-200/70 mb-4">When to seek guidance</h3>
              <ul className="space-y-3 text-sm text-white/55 leading-relaxed">
                {GUIDANCE_PATHS.map((path, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400/30 shrink-0" />
                    <span>{path}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-[20px] border border-rose-500/8 bg-[#0a0810]/80 p-5"
              style={{ boxShadow: '0 4px 24px rgba(244, 63, 94, 0.04)' }}
            >
              <h3 className="text-xs font-semibold text-rose-200/70 mb-3">The Compass Process</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                The Compass draws from the Gita&apos;s teachings on righteous conduct and compassion.
                It illuminates both sides with clarity, never taking sides &mdash; always honoring truth.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-rose-950/15 border border-rose-500/8">
                <p className="text-[10px] text-rose-300/40 leading-relaxed">
                  Pause {'\u2192'} Identify Attachment {'\u2192'} Regulate {'\u2192'} Speak Without Demanding {'\u2192'} See Their Humanity
                </p>
              </div>
            </div>

            <SpiritualToolsNav currentTool="relationship-compass" />
            <CompanionCTA fromTool="relationship-compass" />
          </motion.section>
        </div>
      </div>
    </main>
  )
}
