'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { SacredPageShell } from '@/components/tools/SacredPageShell'
import { VoiceInputButton } from '@/components/voice/VoiceInputButton'

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

const GUIDANCE_PATHS = [
  'Conflicts with partner, family, or friends that feel stuck',
  'Understanding both sides of a disagreement',
  'The right thing to do in a difficult situation',
  'Having a conversation you have been avoiding',
]

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

  // Handle voice transcript — append spoken text to the conflict textarea
  const handleVoiceTranscript = useCallback((text: string) => {
    if (!text.trim()) return
    setConflict(prev => {
      const separator = prev.trim() ? ' ' : ''
      return prev + separator + text.trim()
    })
  }, [])

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

  const leftContent = (
    <>
      {/* Input Card */}
      <div
        className="rounded-[22px] border border-[#d4a44c]/10 bg-[#0d0a06]/90 p-5 sm:p-6"
        style={{ boxShadow: '0 8px 40px rgba(212, 164, 76, 0.04)' }}
      >
        <label htmlFor="conflict-input" className="text-sm font-medium text-[#f5e6c8]/80 block mb-3">
          Describe the relationship challenge
        </label>
        {/* Textarea with voice input */}
        <div className="relative">
          <textarea
            id="conflict-input"
            value={conflict}
            onChange={e => setConflict(e.target.value)}
            placeholder="Share what is happening in this relationship... the Compass will illuminate both perspectives with Gita wisdom. You can also tap the mic to speak."
            className="w-full min-h-[140px] rounded-xl bg-black/40 border border-[#d4a44c]/10 text-[#f5f0e8]/90 placeholder:text-[#d4a44c]/20 p-4 pr-14 text-sm leading-relaxed focus:ring-1 focus:ring-[#d4a44c]/30 focus:border-[#d4a44c]/20 outline-none transition-all resize-none"
            aria-describedby="conflict-hint"
          />
          {/* Voice input — positioned inside the textarea for easy access */}
          <div className="absolute bottom-3 right-3">
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={loading}
            />
          </div>
        </div>
        <p id="conflict-hint" className="sr-only">Describe the relationship conflict you need guidance with. You can type or use the microphone button to speak.</p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={requestCompass}
            disabled={!conflict.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c8943a] via-[#d4a44c] to-[#e8b54a] text-[#0a0a0f] text-sm font-semibold shadow-lg shadow-[#d4a44c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[#d4a44c]/30 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/40"
            aria-label={loading ? 'Processing...' : 'Seek Dharmic Guidance'}
          >
            {loading ? 'Seeking clarity...' : 'Seek Dharmic Guidance'}
          </button>
          <Link
            href="/kiaan/chat"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-[#d4a44c]/15 text-[#f5e6c8]/60 text-sm font-medium hover:border-[#d4a44c]/30 transition focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/40"
          >
            Talk to KIAAN
          </Link>
          <span className="text-[10px] text-[#d4a44c]/30 hidden sm:inline">
            Tap the mic to speak your concern
          </span>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[#e8b54a]/70" role="alert">{error}</p>
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
    </>
  )

  const rightContent = (
    <>
      {/* When to seek guidance */}
      <div
        className="rounded-[20px] border border-[#d4a44c]/12 bg-gradient-to-br from-[#d4a44c]/[0.05] to-transparent p-5"
        style={{ boxShadow: '0 8px 32px rgba(212, 164, 76, 0.04)' }}
      >
        <h3 className="text-xs font-semibold text-[#f5e6c8]/70 mb-4 flex items-center gap-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#d4a44c]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          When to seek guidance
        </h3>
        <ul className="space-y-3 text-sm text-[#f5f0e8]/55 leading-relaxed">
          {GUIDANCE_PATHS.map((path, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d4a44c]/40 shrink-0" />
              <span>{path}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The Compass Process */}
      <div
        className="rounded-[20px] border border-[#d4a44c]/8 bg-[#0d0a06]/80 p-5"
        style={{ boxShadow: '0 4px 24px rgba(212, 164, 76, 0.03)' }}
      >
        <h3 className="text-xs font-semibold text-[#f5e6c8]/60 mb-3">The Compass Process</h3>
        <p className="text-xs text-[#f5f0e8]/40 leading-relaxed">
          The Compass draws from the Gita&apos;s teachings on righteous conduct and compassion.
          It illuminates both sides with clarity, never taking sides &mdash; always honoring truth.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-[#d4a44c]/[0.03] border border-[#d4a44c]/8">
          <p className="text-[10px] text-[#d4a44c]/30 leading-relaxed">
            Pause {'\u2192'} Identify Attachment {'\u2192'} Regulate {'\u2192'} Speak Without Demanding {'\u2192'} See Their Humanity
          </p>
        </div>
      </div>

      <SpiritualToolsNav currentTool="relationship-compass" />
      <CompanionCTA fromTool="relationship-compass" />
    </>
  )

  return (
    <SacredPageShell
      title="Relationship Compass"
      sanskrit={'\u0938\u0902\u092C\u0928\u094D\u0927'}
      subtitle="Dharma-Guided Relationship Clarity"
      modeLabel={`${t('dashboard.mode_label.prefix', 'You are in:')} ${t('dashboard.mode_label.relationship-compass', 'Relationship Mode')}`}
      verse={{
        english: 'One who sees all beings in the Self and the Self in all beings never shrinks from anything.',
        reference: 'Bhagavad Gita 6.29',
      }}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
