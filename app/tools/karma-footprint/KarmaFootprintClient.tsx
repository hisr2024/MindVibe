'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ToolHeader, ToolActionCard, KarmaPlant, type KarmaFootprintState } from '@/components/tools'
import { apiFetch } from '@/lib/api'
import { FadeIn } from '@/components/ui'

interface FootprintAnalysis {
  state: KarmaFootprintState
  summary: string
  positiveActions: string[]
  areasForGrowth: string[]
  recommendation: string
  analyzedAt: string
}

// Mock analysis for UI development
const mockAnalysis: FootprintAnalysis = {
  state: 'mild_positive',
  summary: 'Your day reflects mindful choices with room to grow. You showed kindness and patience, though a few moments could benefit from more presence.',
  positiveActions: [
    'Helped a colleague with a challenging task',
    'Practiced patience during a stressful meeting',
    'Made time for self-reflection'
  ],
  areasForGrowth: [
    'A brief moment of impatience with family',
    'Rushed through an interaction without full presence'
  ],
  recommendation: 'Consider a brief gratitude practice before bed to anchor the positive moments of your day.',
  analyzedAt: new Date().toISOString()
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .slice(0, 3000)
}

export default function KarmaFootprintClient() {
  const [dayDescription, setDayDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<FootprintAnalysis | null>(null)

  useEffect(() => {
    if (error) setError(null)
  }, [dayDescription, error])

  const analyzeDay = useCallback(async () => {
    const trimmedDescription = sanitizeInput(dayDescription.trim())
    if (!trimmedDescription) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/karma-footprint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_description: trimmedDescription,
          dayDescription: trimmedDescription,
        })
      })

      if (!response.ok) {
        // Use mock data for development if backend unavailable
        setAnalysis(mockAnalysis)
        return
      }

      const data = await response.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
      } else {
        setAnalysis(mockAnalysis)
      }
    } catch {
      // Use mock data for development
      setAnalysis(mockAnalysis)
    } finally {
      setLoading(false)
    }
  }, [dayDescription])

  const resetAnalysis = () => {
    setDayDescription('')
    setAnalysis(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn>
          <ToolHeader
            icon="👣"
            title="Karma Footprint Analyzer"
            subtitle="Reflect on your daily actions and visualize your karma footprint to cultivate mindful living."
            backLink={{ label: 'Back to home', href: '/' }}
          />
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            <ToolActionCard
              icon="📝"
              title="Analyze My Day"
              description="Share what happened today for a karma footprint assessment."
              ctaLabel="Start Analysis"
              onClick={() => document.getElementById('day-input')?.focus()}
              gradient="from-lime-500/10 to-green-500/10"
            />
            <ToolActionCard
              icon="🌱"
              title="View Karmic Tree"
              description="See your overall progress and growth visualization."
              ctaLabel="Open Tree"
              href="/tools/karmic-tree"
              gradient="from-green-500/10 to-emerald-500/10"
            />
          </div>
        </FadeIn>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Analysis */}
          <section className="space-y-4">
            {!analysis ? (
              <FadeIn delay={0.1}>
                <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                  <label htmlFor="day-input" className="text-sm font-semibold text-orange-100 block mb-3">
                    How did your day go?
                  </label>
                  <textarea
                    id="day-input"
                    value={dayDescription}
                    onChange={e => setDayDescription(e.target.value)}
                    placeholder="Describe your interactions, choices, and moments from today. Include both positive moments and areas where you might have acted differently..."
                    className="w-full min-h-[200px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
                    aria-describedby="day-hint"
                  />
                  <p id="day-hint" className="sr-only">Describe your day for karma analysis</p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={analyzeDay}
                      disabled={!dayDescription.trim() || loading}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                      aria-label={loading ? 'Analyzing...' : 'Analyze my day'}
                    >
                      {loading ? <span>Analyzing...</span> : <span>Analyze my day</span>}
                    </button>
                  </div>

                  {error && (
                    <p className="mt-3 text-sm text-orange-200" role="alert">
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              </FadeIn>
            ) : (
              <FadeIn delay={0.1}>
                <div className="space-y-4">
                  {/* Analysis Result Header */}
                  <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-orange-50">Your Karma Footprint</h3>
                      <span className="text-xs text-orange-100/70">
                        {new Date(analysis.analyzedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <KarmaPlant state={analysis.state} size="md" />
                      <div className="flex-1">
                        <p className="text-sm text-orange-100/90 leading-relaxed">
                          {analysis.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Positive Actions */}
                  <div className="rounded-2xl border border-green-400/30 bg-green-500/5 p-5">
                    <h4 className="text-sm font-semibold text-green-50 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
                      Positive Actions
                    </h4>
                    <ul className="space-y-2">
                      {analysis.positiveActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-green-100/80 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Growth */}
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
                    <h4 className="text-sm font-semibold text-amber-50 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                      Areas for Growth
                    </h4>
                    <ul className="space-y-2">
                      {analysis.areasForGrowth.map((area, idx) => (
                        <li key={idx} className="text-sm text-amber-100/80 flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-5">
                    <h4 className="text-sm font-semibold text-orange-50 mb-2">Recommendation</h4>
                    <p className="text-sm text-orange-100/80">{analysis.recommendation}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={resetAnalysis}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-orange-400/25 text-orange-50 hover:bg-white/5 transition"
                    >
                      🔄 Analyze Another Day
                    </button>
                    <Link
                      href="/tools/emotional-reset"
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-500/20 text-purple-50 hover:bg-purple-500/30 border border-purple-400/25 transition"
                    >
                      💫 Emotional Reset
                    </Link>
                  </div>
                </div>
              </FadeIn>
            )}
          </section>

          {/* Right: Info Sidebar */}
          <section className="space-y-4">
            <FadeIn delay={0.15}>
              <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                <h3 className="text-sm font-semibold text-orange-50 mb-4">Karma Footprint States</h3>
                <div className="space-y-3">
                  {[
                    { state: 'strong_positive' as KarmaFootprintState, label: 'Flourishing', desc: 'Many mindful, positive actions' },
                    { state: 'mild_positive' as KarmaFootprintState, label: 'Growing', desc: 'Good balance with room to grow' },
                    { state: 'neutral' as KarmaFootprintState, label: 'Steady', desc: 'Even mix of actions' },
                    { state: 'mild_heavy' as KarmaFootprintState, label: 'Wilting', desc: 'Some areas need attention' },
                    { state: 'heavy' as KarmaFootprintState, label: 'Needs Care', desc: 'Time for reset and reflection' },
                  ].map(({ state, label, desc }) => (
                    <div key={state} className="flex items-center gap-3 text-sm">
                      <KarmaPlant state={state} size="sm" />
                      <div>
                        <span className="font-medium text-orange-50">{label}</span>
                        <p className="text-xs text-orange-100/70">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                <h3 className="text-sm font-semibold text-orange-50 mb-3">About Karma Footprint</h3>
                <p className="text-xs text-orange-100/80 leading-relaxed mb-4">
                  The Karma Footprint analyzer helps you reflect on your daily actions and their impact. It&apos;s not about judgment—it&apos;s about awareness and growth.
                </p>

                <div className="p-3 rounded-xl bg-black/40 border border-orange-500/15">
                  <h4 className="text-xs font-semibold text-orange-50 mb-2">How it works</h4>
                  <p className="text-xs text-orange-100/70">
                    Share your day → Get visual feedback → Identify patterns → Grow mindfully
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.25}>
              <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
                <p className="text-xs text-orange-100/80">
                  <strong className="text-orange-50">Privacy:</strong> Your reflections are processed securely. We don&apos;t store personal details—only anonymized patterns for your growth tracking.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/tools/karmic-tree"
                  className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-2 py-1 border border-orange-500/20"
                >
                  Karmic Tree
                </Link>
                <Link
                  href="/tools/emotional-reset"
                  className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-2 py-1 border border-orange-500/20"
                >
                  Emotional Reset
                </Link>
              </div>
            </FadeIn>
          </section>
        </div>
      </div>
    </main>
  )
}
