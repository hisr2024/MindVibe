'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { apiFetch } from '@/lib/api'
import WisdomResponseCard, { WisdomLoadingState } from '@/components/tools/WisdomResponseCard'
import CompanionCTA from '@/components/companion/CompanionCTA'

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\\/g, '') // Remove backslashes
    .slice(0, 2000) // Limit length
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

const triggerPatterns = [
  'Conflicts with partner, family, or friends that feel stuck',
  'When you want to understand both sides of a disagreement',
  'Figuring out the right thing to do in a tough situation',
  'When you know you need to have a difficult conversation'
]

export default function RelationshipCompassClient() {
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
      const response = await apiFetch('/api/relationship-compass/gita-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedConflict,
          sessionId,
          relationshipType: 'other'
        })
      })

      if (!response.ok) {
        setError('Relationship Compass is unavailable right now. Please try again shortly.')
        return
      }

      const data = await response.json()

      // Parse structured response - supports both legacy and ultra-deep sections
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
        // Store both sections and full response
        setResult({
          response: fullResponse,
          sections: guidance,
          requestedAt: new Date().toISOString(),
          gitaVerses: citations.length,
          citations,
          contextSufficient: data.contextSufficient,
          secularMode: data.secularMode !== false  // Default to true
        })
      } else if (fullResponse) {
        // Fallback to full response only
        setResult({
          response: fullResponse,
          sections: {},
          requestedAt: new Date().toISOString(),
          gitaVerses: citations.length,
          citations,
          contextSufficient: data.contextSufficient,
          secularMode: data.secularMode !== false  // Default to true
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

  // Format structured guidance into readable response
  function _formatCompassGuidance(guidance: Record<string, string> | undefined): string {
    if (!guidance) return ''
    const parts = Object.entries(guidance).map(([title, content]) => `${title}\n${content}`)
    return parts.join('\n\n')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="🧭"
          title="Relationship Compass"
          subtitle="Navigate relationship challenges with clarity, fairness, and compassion."
          backLink={{ label: 'Back to home', href: '/' }}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <ToolActionCard
            icon="💬"
            title="Get Conflict Guidance"
            description="Share your situation for balanced, thoughtful perspective."
            ctaLabel="Start Now"
            onClick={() => document.getElementById('conflict-input')?.focus()}
            gradient="from-rose-500/10 to-orange-500/10"
          />
          <ToolActionCard
            icon="🤝"
            title="Communication Templates"
            description="Access non-reactive conversation starters and phrases."
            ctaLabel="View Templates"
            href="/wisdom-rooms"
            gradient="from-blue-500/10 to-purple-500/10"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label htmlFor="conflict-input" className="text-sm font-semibold text-orange-100 block mb-3">
                Describe the conflict
              </label>
              <textarea
                id="conflict-input"
                value={conflict}
                onChange={e => setConflict(e.target.value)}
                placeholder="Example: My partner feels I don't listen, and I keep getting defensive when they bring it up."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="conflict-hint"
              />
              <p id="conflict-hint" className="sr-only">Describe the relationship conflict you need guidance with</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestCompass}
                  disabled={!conflict.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  aria-label={loading ? 'Processing...' : 'Get Guidance'}
                >
                  {loading ? <span>Thinking...</span> : <span>Get Guidance</span>}
                </button>
                <Link
                  href="/kiaan/chat"
                  className="px-5 py-3 rounded-2xl bg-white/5 border border-orange-500/30 text-orange-50 text-sm font-semibold hover:border-orange-300/50 transition focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                >
                  Send context to KIAAN
                </Link>
              </div>

              {error && (
                <p className="mt-3 text-sm text-orange-200" role="alert">
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Sacred Loading State */}
            {loading && (
              <WisdomLoadingState tool="relationship_compass" />
            )}

            {/* Ultra-Deep Wisdom Response */}
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
          </section>

          {/* Right: Trigger Patterns */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-orange-50">Good for</h3>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-orange-100/70">
                  Use cases
                </span>
              </div>

              <ul className="space-y-3 text-sm text-orange-100/85">
                {triggerPatterns.map((pattern, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347] shrink-0" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h4 className="text-xs font-semibold text-orange-50 mb-2">What you&apos;ll get</h4>
              <p className="text-xs text-orange-100/70 leading-relaxed">
                Validation → Insight → Other perspective → Practical suggestions → Conversation script → One actionable step
              </p>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80">
                <strong className="text-orange-50">Boundaries:</strong> No therapy, legal, medical, or financial advice. No side-taking. If safety is a concern, reach out to a trusted person.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/relationship-compass"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-2 py-1 border border-orange-500/20"
              >
                Original Page
              </Link>
            </div>
          </section>
        </div>

        <CompanionCTA fromTool="relationship-compass" />
      </div>
    </main>
  )
}
