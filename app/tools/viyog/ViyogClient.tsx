'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'

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
  gitaVerses?: number
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

  // Voice integration
  const { language } = useLanguage()

  useEffect(() => {
    if (error) setError(null)
  }, [concern, error])

  async function requestDetachment() {
    const trimmedConcern = sanitizeInput(concern.trim())
    if (!trimmedConcern) return

    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/viyoga/detach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome_worry: trimmedConcern })
      })

      if (!response.ok) {
        setError('Viyoga is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      
      // Parse structured response
      const guidance = data.detachment_guidance
      if (guidance) {
        const formattedResponse = `**Validation**
${guidance.validation}

**Attachment Check**
${guidance.attachment_check}

**Detachment Principle**
${guidance.detachment_principle}

**One Action**
${guidance.one_action}`

        setResult({ 
          response: formattedResponse, 
          requestedAt: new Date().toISOString(),
          gitaVerses: data.gita_verses_used || 0
        })
      } else if (data.raw_text) {
        // Fallback to raw text if structured parsing failed
        setResult({ 
          response: data.raw_text, 
          requestedAt: new Date().toISOString(),
          gitaVerses: data.gita_verses_used || 0
        })
      } else {
        setError('Viyoga could not generate a response. Please try again.')
      }
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
          title="Viyoga - Detachment Coach"
          subtitle="Shift from result-focused anxiety to grounded action. Viyoga eases outcome pressure without touching KIAAN."
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
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="concern-input" className="text-sm font-semibold text-orange-100">
                  Share the outcome worry
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
                placeholder="Speak or type your concern. Example: I'm afraid the presentation will flop."
                className="w-full min-h-[160px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="concern-hint"
              />
              <p id="concern-hint" className="sr-only">Describe the outcome you are worried about</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={requestDetachment}
                  disabled={!concern.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  aria-label={loading ? 'Processing...' : 'Shift with Viyoga'}
                >
                  {loading ? <span>Viyoga is centering...</span> : <span>Shift with Viyoga</span>}
                </button>
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-orange-50">Viyoga&apos;s response</span>
                    {result.gitaVerses && result.gitaVerses > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300 border border-orange-400/30">
                        <span>🕉️</span>
                        <span>Gita Wisdom ({result.gitaVerses} verses)</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <VoiceResponseButton
                      text={result.response.replace(/\*\*/g, '')}
                      language={language}
                      size="sm"
                      variant="accent"
                    />
                    <span>{new Date(result.requestedAt).toLocaleString()}</span>
                  </div>
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
              <h3 className="text-sm font-semibold text-orange-50 mb-3">About Viyoga</h3>
              <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                Viyoga guides outcome worries back into steady, actionable steps. It validates your anxiety, identifies attachment, offers a detachment principle, and ends with one controllable action.
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
                <strong className="text-orange-50">Note:</strong> Viyoga does not provide therapy, crisis support, or make promises about outcomes. It simply redirects anxious energy toward calm action.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/viyog"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-2 py-1 border border-orange-500/20"
              >
                Original Viyoga Page
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
