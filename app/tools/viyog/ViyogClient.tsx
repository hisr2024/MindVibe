'use client'

import { useState, useEffect } from 'react'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { apiFetch } from '@/lib/api'
import { VoiceInputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'
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

const flowSteps = [
  'Share what\'s weighing on you - name the worry you\'re carrying.',
  'Get a fresh perspective on what you can and can\'t control.',
  'Walk away with one concrete thing you can do today.',
]

export default function ViyogClient() {
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ViyogResult | null>('viyog_detachment', null)
  const [sessionId, setSessionId] = useLocalState<string>('viyog_session', '')

  // Voice integration
  const { language, t } = useLanguage()

  // Micro-pause before revealing response
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
        // Handle specific HTTP error codes
        if (response.status === 401 || response.status === 403) {
          setError('Session expired. Please refresh the page and try again.')
        } else if (response.status === 429) {
          setError('Too many requests. Please wait a moment before trying again.')
        } else if (response.status === 503) {
          setError('Viyoga is temporarily unavailable. Please try again in a few minutes.')
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="🎯"
          title="Viyoga - Outcome Anxiety Support"
          subtitle="Shift from worrying about results to focused action. Get practical help when you're stuck overthinking outcomes."
          backLink={{ label: 'Back to home', href: '/' }}
          modeLabel={`${t('dashboard.mode_label.prefix', 'You are in:')} ${t('dashboard.mode_label.viyog', 'Pause Mode')}`}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <ToolActionCard
            icon="⏱️"
            title="60-Second Reset"
            description="A quick inner reset when worry about outcomes feels overwhelming."
            ctaLabel="Start Reset"
            href="/tools/viyog#clarity-pause"
            gradient="from-cyan-500/10 to-blue-500/10"
          />
          <ToolActionCard
            icon="🔄"
            title="Talk It Through"
            description="Share what's on your mind and get a fresh perspective."
            ctaLabel="Share What's Up"
            onClick={() => document.getElementById('concern-input')?.focus()}
            gradient="from-orange-500/10 to-amber-500/10"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="concern-input" className="text-sm font-semibold text-orange-100">
                  What outcome are you worried about?
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
                placeholder="Tell me what's on your mind. Example: I'm worried my presentation won't go well and everyone will think I'm not good at my job."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/60 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="concern-hint"
              />
              <p id="concern-hint" className="sr-only">Describe what you&apos;re worried about</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestDetachment}
                  disabled={!concern.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  aria-label={loading ? 'Processing...' : 'Get Fresh Perspective'}
                >
                  {loading ? <span>Thinking...</span> : <span>Get Fresh Perspective</span>}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-orange-200" role="alert">
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <WisdomLoadingState tool="viyoga" secularMode={true} />
            )}

            {/* Micro-pause breathing dot */}
            <BreathingDot visible={showPause} />

            {/* Response Card */}
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
          </section>

          {/* Right: Insight Card, Flow Steps and Info */}
          <section className="space-y-4">
            {/* Concern Analysis Insight Card - shows when analysis is available */}
            {result && !loading && !showPause && result.concernAnalysis && result.concernAnalysis.analysis_depth === 'ai_enhanced' && (
              <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5 shadow-[0_15px_60px_rgba(255,180,50,0.08)]">
                <h3 className="text-sm font-semibold text-amber-100 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  What I See in Your Situation
                </h3>
                <div className="space-y-3 text-xs text-amber-100/80 leading-relaxed">
                  {result.concernAnalysis.primary_emotion && (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400/70 font-medium shrink-0 w-20">Feeling:</span>
                      <span className="capitalize">
                        {result.concernAnalysis.primary_emotion}
                        {result.concernAnalysis.emotional_intensity && result.concernAnalysis.emotional_intensity !== 'moderate'
                          ? ` (${result.concernAnalysis.emotional_intensity})`
                          : ''}
                      </span>
                    </div>
                  )}
                  {result.concernAnalysis.attachment_object && (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400/70 font-medium shrink-0 w-20">Attached to:</span>
                      <span>{result.concernAnalysis.attachment_object}</span>
                    </div>
                  )}
                  {result.concernAnalysis.root_cause && (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400/70 font-medium shrink-0 w-20">Root:</span>
                      <span>{result.concernAnalysis.root_cause}</span>
                    </div>
                  )}
                  {result.concernAnalysis.effort_redirect && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-amber-500/15 mt-2">
                      <span className="text-amber-300/90 font-medium text-[11px] uppercase tracking-wider block mb-1">Redirect energy toward</span>
                      <span className="text-amber-100/90">{result.concernAnalysis.effort_redirect}</span>
                    </div>
                  )}
                  {result.concernAnalysis.in_their_control && result.concernAnalysis.in_their_control.length > 0 && (
                    <div className="mt-2">
                      <span className="text-emerald-400/80 font-medium text-[11px] uppercase tracking-wider block mb-1.5">In your control</span>
                      <ul className="space-y-1">
                        {result.concernAnalysis.in_their_control.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400/60 mt-0.5 shrink-0">+</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.concernAnalysis.not_in_their_control && result.concernAnalysis.not_in_their_control.length > 0 && (
                    <div className="mt-1">
                      <span className="text-orange-400/80 font-medium text-[11px] uppercase tracking-wider block mb-1.5">Not in your control</span>
                      <ul className="space-y-1">
                        {result.concernAnalysis.not_in_their_control.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-orange-400/60 mt-0.5 shrink-0">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">The Flow</h3>
              <ol className="space-y-3 text-sm text-orange-100/85">
                {flowSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347] text-xs font-bold text-slate-950 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-3">About Viyoga</h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Viyoga is like a wise friend who actually listens. It deeply analyzes YOUR specific situation - understanding what you&apos;re attached to, why it matters to you, and what&apos;s really driving the anxiety. Then it helps you find freedom through focused action, guided by timeless Bhagavad Gita wisdom on detachment.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">How It Works</h4>
                <p className="text-xs text-orange-100/70">
                  Deep Understanding → Identify Attachment → See What You Control → Shift to Effort → One Action → Reflect
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80">
                <strong className="text-orange-50">The Path of Detachment:</strong> Viyoga draws from the Gita&apos;s timeless teaching — let go of attachment to outcomes and find peace in right action. As Krishna teaches: &quot;You have the right to perform your actions, but not to the fruits thereof.&quot;
              </p>
            </div>

            <SpiritualToolsNav currentTool="viyoga" />
          </section>
        </div>

        <CompanionCTA fromTool="viyog" />
      </div>
    </main>
  )
}
