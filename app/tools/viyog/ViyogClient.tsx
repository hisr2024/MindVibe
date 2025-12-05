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

type ViyogResult = {
  response: string
  requestedAt: string
}

const flowSteps = [
  'Name the outcome worry in one line.',
  'Detach from result; pick one present action.',
  'Run the 60-second clarity pause if urgency is high.',
]

export default function ViyogClient() {
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ViyogResult | null>('viyog_detachment', null)

  useEffect(() => {
    if (error) setError(null)
  }, [concern, error])

  async function requestDetachment() {
    const trimmedConcern = sanitizeInput(concern.trim())
    if (!trimmedConcern) return

    setLoading(true)
    setError(null)

    const systemPrompt = `Role:
You are Viyog, the Detachment Coach — a calm, grounded assistant who helps users reduce outcome anxiety by shifting them from result-focused thinking to action-focused thinking.

You are fully separate from Kiaan. Never override, replace, or interfere with Kiaan's purpose, tone, or outputs. Kiaan offers positivity and encouragement; you focus only on detachment, clarity, and reducing pressure around outcomes.

Core purpose:
- Recognize when the user is anxious about results, performance, or others' opinions.
- Shift focus back to what they can control right now.
- Release unnecessary mental pressure and perfectionism.
- Convert fear into one clear, grounded action.

Tone and style: calm, concise, balanced, neutral, secular, non-preachy, emotionally validating but not dramatic.

Output structure (always follow this format):
1. Validate the anxiety (brief and respectful).
2. Acknowledge the attachment to results creating pressure.
3. Offer a clear detachment principle (secular and universal).
4. Guide them toward an action-based mindset with one small, controllable step.

Boundaries:
- Do not provide therapy, crisis support, medical, legal, or financial advice.
- Do not make promises about results or offer motivational hype.
- Do not encourage passivity or fate-based thinking.
- Stay separate from Kiaan and do not interfere with its role.`

    const request = `${systemPrompt}\n\nUser concern: "${trimmedConcern}"\n\nRespond using the four-step format with simple, grounded sentences. Include one small, doable action.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Viyog is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch {
      setError('Unable to reach Viyog. Check your connection and try again.')
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
          title="Viyog - Detachment Coach"
          subtitle="Shift from result-focused anxiety to grounded action. Viyog eases outcome pressure without touching KIAAN."
          backLink={{ label: 'Back to home', href: '/' }}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <ToolActionCard
            icon="⏱️"
            title="Launch 60s Clarity Pause"
            description="A quick reset when outcome anxiety feels overwhelming."
            ctaLabel="Start Pause"
            href="/tools/viyog#clarity-pause"
            gradient="from-cyan-500/10 to-blue-500/10"
          />
          <ToolActionCard
            icon="🔄"
            title="Detachment Check-In"
            description="Share what's weighing on you and get grounded guidance."
            ctaLabel="Share Concern"
            onClick={() => document.getElementById('concern-input')?.focus()}
            gradient="from-orange-500/10 to-amber-500/10"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label htmlFor="concern-input" className="text-sm font-semibold text-orange-100 block mb-3">
                Share the outcome worry
              </label>
              <textarea
                id="concern-input"
                value={concern}
                onChange={e => setConcern(e.target.value)}
                placeholder="Example: I'm afraid the presentation will flop and everyone will think I'm incompetent."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="concern-hint"
              />
              <p id="concern-hint" className="sr-only">Describe the outcome you are worried about</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestDetachment}
                  disabled={!concern.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  aria-label={loading ? 'Processing...' : 'Shift with Viyog'}
                >
                  {loading ? 'Viyog is centering...' : 'Shift with Viyog'}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-orange-200" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Response */}
            {result && (
              <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-5 shadow-inner shadow-orange-500/10">
                <div className="flex items-center justify-between text-xs text-orange-100/70 mb-3">
                  <span className="font-semibold text-orange-50">Viyog&apos;s response</span>
                  <span>{new Date(result.requestedAt).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">
                  {result.response}
                </div>
              </div>
            )}
          </section>

          {/* Right: Flow Steps and Info */}
          <section className="space-y-4">
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
              <h3 className="text-sm font-semibold text-orange-50 mb-3">About Viyog</h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Viyog guides outcome worries back into steady, actionable steps. It validates your anxiety, identifies attachment, offers a detachment principle, and ends with one controllable action.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">Output format</h4>
                <p className="text-xs text-orange-100/70">
                  Validation → Attachment Check → Detachment Principle → One action
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80">
                <strong className="text-orange-50">Note:</strong> Viyog does not provide therapy, crisis support, or make promises about outcomes. It simply redirects anxious energy toward calm action.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/viyog"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-2 py-1 border border-orange-500/20"
              >
                Original Viyog Page
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
