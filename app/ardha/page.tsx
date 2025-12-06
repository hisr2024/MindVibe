'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'

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
    } catch {}
  }, [key, state])

  return [state, setState]
}

type ArdhaResult = {
  response: string
  requestedAt: string
}

const pillars = [
  'Validate the feeling without dilution.',
  'Spot the distortion before offering the shift.',
  'Use ancient-wisdom-aligned calm insight, not sermons.',
  "Close with one doable action inside the user's control.",
]

export default function ArdhaPage() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaResult | null>('ardha_reframe', null)

  useEffect(() => {
    if (error) setError(null)
  }, [thought, error])

  async function requestReframe() {
    const trimmedThought = sanitizeInput(thought.trim())
    if (!trimmedThought) return

    setLoading(true)
    setError(null)

    const systemPrompt = `Role:
You are Ardha, the Reframing Assistant—a calm, wise, ancient wisdom-inspired voice whose purpose is to transform negative, confusing, or self-defeating thoughts into balanced, empowering, reality-based reframes, without dismissing the user's emotions.

You stand as a separate entity from Kiaan. You must not override, interfere with, or replace Kiaan's core functions. Kiaan focuses on positive guidance; Ardha focuses on cognitive reframing using ancient wisdom principles. Your job is complementary, not overlapping.

Core Behavior:
- Identify the negative belief or emotional distortion the user expresses.
- Acknowledge their feeling with compassion (never invalidate).
- Apply ancient wisdom principles such as detachment from outcomes (2.47), stability of mind (2.55–2.57), viewing situations with clarity, not emotion (2.70), acting from Dharma, not fear (3.19), and seeing challenges as part of growth (6.5).
- Generate a clear, modern, emotionally intelligent reframe.
- Keep tone grounded, calm, non-preachy, non-religious, and universally applicable.
- Never offer spiritual authority—only perspective reshaping.
- No judgment, no moralizing, no sermons.
- Reframe in simple, conversational, modern English.

Output Format:
When the user shares a negative thought, respond with:
1. Recognition (validate the feeling)
2. Deep Insight (the principle being applied)
3. Reframe (positive but realistic)
4. Small Action Step (something within their control)

Boundaries:
- You are NOT a therapist.
- You do NOT give medical, legal, or crisis advice.
- You do NOT contradict Kiaan.
- You ONLY transform the user's thought into a healthier, clearer version.`

    const request = `${systemPrompt}\n\nUser thought: "${trimmedThought}"\n\nRespond using the four-part format with short, direct language.`

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: request })
      })

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Reframes Distorted Thoughts</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Ardha – The Reframing Assistant
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                Transform negative thoughts into balanced, empowering perspectives with ancient wisdom.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                No accounts • Stored locally
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-3">
                Share the thought to reframe
              </label>
              <textarea
                value={thought}
                onChange={e => setThought(e.target.value)}
                placeholder="Example: I keep messing up at work, maybe I'm just not cut out for this."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
              />

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestReframe}
                  disabled={!thought.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02]"
                >
                  {loading ? <span>Ardha is reflecting...</span> : <span>Reframe with Ardha</span>}
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-orange-200"><span>{error}</span></p>}
            </div>

            {/* Response */}
            {result && (
              <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-5 shadow-inner shadow-orange-500/10">
                <div className="flex items-center justify-between text-xs text-orange-100/70 mb-3">
                  <span className="font-semibold text-orange-50">Ardha's response</span>
                  <span>{new Date(result.requestedAt).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">
                  {result.response}
                </div>
              </div>
            )}
          </section>

          {/* Right: Pillars and Info */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">Ardha's Pillars</h3>
              <ul className="space-y-3 text-sm text-orange-100/85">
                {pillars.map((pillar, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347] shrink-0" />
                    <span>{pillar}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-3">About Ardha</h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Ardha spots the distortion, validates the feeling, and reshapes it with grounded insight. Balanced reframes that leave Kiaan untouched.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">Output format</h4>
                <p className="text-xs text-orange-100/70">
                  Recognition → Insight → Reframe → One action
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80">
                <strong className="text-orange-50">Boundaries:</strong> Ardha is not a therapist and does not give medical, legal, or crisis advice. It only transforms thoughts into healthier perspectives.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
