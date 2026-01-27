'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ToolHeader, ToolActionCard } from '@/components/tools'

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
  requestedAt: string
}

const triggerPatterns = [
  'Fights, arguments, or tense conversations',
  'Requests for how to respond before replying to a heated message',
  'Wanting to "win" or "prove a point"',
  'Feeling defensive, judged, or misunderstood'
]

export default function RelationshipCompassClient() {
  const [conflict, setConflict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<RelationshipCompassResult | null>('relationship_compass', null)

  useEffect(() => {
    if (error) setError(null)
  }, [conflict, error])

  async function requestCompass() {
    const trimmedConflict = sanitizeInput(conflict.trim())
    if (!trimmedConflict) return

    setLoading(true)
    setError(null)

    const systemPrompt = `You are Relationship Compass, a neutral, calm assistant that guides users through relationship conflicts with clarity, fairness, composure, and compassion. You are not Kiaan and never interfere with Kiaan. You reduce reactivity and ego-driven responses while keeping tone secular, modern, concise, and non-judgmental. Boundaries: do not provide therapy, legal, medical, or financial advice; do not take sides; do not tell someone to leave or stay; do not spiritualize; if safety is a concern, suggest reaching out to a trusted person or professional.

Flow to follow for every reply:
1) Acknowledge the conflict and its emotional weight.
2) Separate emotions from ego impulses.
3) Identify the user's values or desired outcome (respect, honesty, understanding, peace).
4) Offer right-action guidance rooted in fairness, accountability, calm honesty, boundaries, and listening before reacting.
5) Provide ego-detachment suggestions (no need to win, pause before replying, focus on conduct over outcomes).
6) Offer one compassion-based perspective without excusing harm.
7) Share a non-reactive communication pattern with "I" language and one clarifying question.
8) End with one simple next step the user can control.
Tone: short, clear sentences; calm; secular; never shaming.`

    const request = `${systemPrompt}\n\nUser conflict: "${trimmedConflict}"\n\nReturn the structured eight-part response in numbered sections with concise guidance only.`

    try {
      // Use local Next.js API route which handles backend proxying
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Relationship Compass is unavailable right now. Please try again shortly.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch {
      setError('Unable to reach Relationship Compass. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="🧭"
          title="Relationship Compass"
          subtitle="Navigate relationship challenges with clarity, fairness, and compassion. KIAAN remains untouched."
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
                  aria-label={loading ? 'Processing...' : 'Guide me with Relationship Compass'}
                >
                  {loading ? <span>Balancing guidance...</span> : <span>Guide me with Relationship Compass</span>}
                </button>
                <Link
                  href="/#kiaan-chat"
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

            {/* Response */}
            {result && (
              <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-5 shadow-inner shadow-orange-500/10">
                <div className="flex items-center justify-between text-xs text-orange-100/70 mb-3">
                  <span className="font-semibold text-orange-50">Relationship Compass response</span>
                  <span>{new Date(result.requestedAt).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">
                  {result.response}
                </div>
              </div>
            )}
          </section>

          {/* Right: Trigger Patterns */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-orange-50">When to use this</h3>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-orange-100/70">
                  Trigger detection
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
              <h4 className="text-xs font-semibold text-orange-50 mb-2">Output format</h4>
              <p className="text-xs text-orange-100/70 leading-relaxed">
                Acknowledge → Separate ego → Name values → Right action → Detach → Add compassion → Suggest phrasing → One next step
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
      </div>
    </main>
  )
}
