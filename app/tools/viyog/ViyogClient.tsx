'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'
import { VoiceInputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { useMicroPause } from '@/hooks/useMicroPause'
import { BreathingDot } from '@/components/animations/BreathingDot'
import { SacredPageShell } from '@/components/tools/SacredPageShell'

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

export default function ViyogClient() {
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ViyogResult | null>('viyog_detachment', null)
  const [sessionId, setSessionId] = useLocalState<string>('viyog_session', '')

  const { language, t } = useLanguage()

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

  const mapSections = (sections: Record<string, string>) => {
    const normalized: Record<string, string> = {}
    Object.entries(sections).forEach(([key, value]) => {
      if (!value) return
      normalized[key] = value
    })
    return normalized
  }

  async function requestDetachment() {
    const trimmedConcern = sanitizeInput(concern.trim())
    if (!trimmedConcern) return

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
        })
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Session expired. Please refresh the page and try again.')
        } else if (response.status === 429) {
          setError('Take a breath. Too many requests \u2014 please wait a moment.')
        } else if (response.status === 503) {
          setError('Viyoga is gathering wisdom. Please try again in a few minutes.')
        } else if (response.status >= 500) {
          setError('Viyoga encountered an issue. Please try again.')
        } else {
          setError('Unable to process your request. Please try again.')
        }
        return
      }

      const data = await response.json()
      const responseText = typeof data.assistant === 'string' ? data.assistant : ''
      const sections = data.sections && typeof data.sections === 'object' ? data.sections : {}
      const citations = Array.isArray(data.citations) ? data.citations : []

      if (!responseText) {
        setError('Viyoga could not generate a response. Please try again.')
        return
      }

      setResult({
        response: responseText,
        sections: mapSections(sections),
        requestedAt: new Date().toISOString(),
        gitaVerses: data.gita_verses_used || citations.length,
        citations,
        concernAnalysis: data.concern_analysis || null,
        provider: data.provider || data.retrieval?.strategy || 'unknown',
      })
    } catch {
      setError('Unable to reach Viyoga. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const leftContent = (
    <>
      {/* Input Card */}
      <div
        className="rounded-[22px] border border-[#d4a44c]/10 bg-[#0d0a06]/90 p-5 sm:p-6"
        style={{ boxShadow: '0 8px 40px rgba(212, 164, 76, 0.04)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="concern-input" className="text-sm font-medium text-[#f5e6c8]/80">
            What is weighing on your heart?
          </label>
          <VoiceInputButton
            language={language}
            onTranscript={(text) => setConcern(prev => prev ? `${prev} ${text}` : text)}
            disabled={loading}
          />
        </div>
        <textarea
          id="concern-input"
          value={concern}
          onChange={e => setConcern(e.target.value)}
          placeholder="Share what outcome you are attached to... what worry you carry..."
          className="w-full min-h-[140px] rounded-xl bg-black/40 border border-[#d4a44c]/10 text-[#f5f0e8]/90 placeholder:text-[#d4a44c]/20 p-4 text-sm leading-relaxed focus:ring-1 focus:ring-[#d4a44c]/30 focus:border-[#d4a44c]/20 outline-none transition-all resize-none"
          aria-describedby="concern-hint"
        />
        <p id="concern-hint" className="sr-only">Describe what you are worried about</p>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={requestDetachment}
            disabled={!concern.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c8943a] via-[#d4a44c] to-[#e8b54a] text-[#0a0a0f] text-sm font-semibold shadow-lg shadow-[#d4a44c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[#d4a44c]/30 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/40"
            aria-label={loading ? 'Processing...' : 'Release & Receive Wisdom'}
          >
            {loading ? 'Receiving wisdom...' : 'Release & Receive Wisdom'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[#e8b54a]/70" role="alert">{error}</p>
        )}
      </div>

      {loading && <WisdomLoadingState tool="viyoga" secularMode={true} />}
      <BreathingDot visible={showPause} />

      {result && !loading && !showPause && (
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
      )}
    </>
  )

  const rightContent = (
    <>
      {/* Concern Analysis Insight Card */}
      {result && !loading && !showPause && result.concernAnalysis && result.concernAnalysis.analysis_depth === 'ai_enhanced' && (
        <div
          className="rounded-[20px] border border-[#d4a44c]/12 bg-gradient-to-br from-[#d4a44c]/[0.05] to-transparent p-5"
          style={{ boxShadow: '0 8px 32px rgba(212, 164, 76, 0.04)' }}
        >
          <h3 className="text-xs font-semibold text-[#f5e6c8]/70 mb-3 flex items-center gap-2">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#d4a44c]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            What Krishna Sees
          </h3>
          <div className="space-y-2.5 text-xs text-[#f5e6c8]/60 leading-relaxed">
            {result.concernAnalysis.primary_emotion && (
              <div className="flex items-start gap-2">
                <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">Feeling:</span>
                <span className="capitalize">{result.concernAnalysis.primary_emotion}</span>
              </div>
            )}
            {result.concernAnalysis.attachment_object && (
              <div className="flex items-start gap-2">
                <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">Attached:</span>
                <span>{result.concernAnalysis.attachment_object}</span>
              </div>
            )}
            {result.concernAnalysis.root_cause && (
              <div className="flex items-start gap-2">
                <span className="text-[#d4a44c]/50 font-medium shrink-0 w-16">Root:</span>
                <span>{result.concernAnalysis.root_cause}</span>
              </div>
            )}
            {result.concernAnalysis.effort_redirect && (
              <div className="p-3 rounded-xl bg-black/30 border border-[#d4a44c]/8 mt-2">
                <span className="text-[#d4a44c]/50 font-medium text-[10px] uppercase tracking-wider block mb-1">Redirect energy toward</span>
                <span className="text-[#f5e6c8]/70">{result.concernAnalysis.effort_redirect}</span>
              </div>
            )}
            {result.concernAnalysis.in_their_control && result.concernAnalysis.in_their_control.length > 0 && (
              <div className="mt-2">
                <span className="text-emerald-400/50 font-medium text-[10px] uppercase tracking-wider block mb-1.5">In your control</span>
                <ul className="space-y-1">
                  {result.concernAnalysis.in_their_control.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400/40 mt-0.5 shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.concernAnalysis.not_in_their_control && result.concernAnalysis.not_in_their_control.length > 0 && (
              <div className="mt-1">
                <span className="text-[#d4a44c]/40 font-medium text-[10px] uppercase tracking-wider block mb-1.5">Not in your control</span>
                <ul className="space-y-1">
                  {result.concernAnalysis.not_in_their_control.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#d4a44c]/35 mt-0.5 shrink-0">&ndash;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sacred Teaching */}
      <div
        className="rounded-[20px] border border-[#d4a44c]/8 bg-[#0d0a06]/80 p-5"
        style={{ boxShadow: '0 4px 24px rgba(212, 164, 76, 0.03)' }}
      >
        <h3 className="text-xs font-semibold text-[#f5e6c8]/60 mb-3">The Path of Viyoga</h3>
        <p className="text-xs text-[#f5f0e8]/40 leading-relaxed">
          Viyoga is the Gita&apos;s teaching of releasing attachment to outcomes.
          Not suppression, but freedom. You act with full effort, then release
          the result to the Divine. This is the path Krishna teaches Arjuna.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-[#d4a44c]/[0.03] border border-[#d4a44c]/8">
          <p className="text-[10px] text-[#d4a44c]/30 leading-relaxed">
            Share &rarr; Understand &rarr; See what you control &rarr; Shift to effort &rarr; Release
          </p>
        </div>
      </div>

      <SpiritualToolsNav currentTool="viyoga" />
      <CompanionCTA fromTool="viyog" />
    </>
  )

  return (
    <SacredPageShell
      title="Viyoga"
      sanskrit={'\u0935\u093F\u092F\u094B\u0917'}
      subtitle="The Sacred Art of Detachment"
      modeLabel={`${t('dashboard.mode_label.prefix', 'You are in:')} ${t('dashboard.mode_label.viyog', 'Pause Mode')}`}
      verse={{
        english: 'You have the right to perform your actions, but you are not entitled to the fruits of your actions.',
        reference: 'Bhagavad Gita 2.47',
      }}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
