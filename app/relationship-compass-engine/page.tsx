'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { getNextStepSuggestion } from '@/lib/suggestions/nextStep'
import { NextStepLink } from '@/components/suggestions/NextStepLink'

/**
 * Relationship Compass Engine - Modern, secular relationship clarity.
 *
 * Translates Gita principles into modern psychology and behavioral clarity.
 * Detects modes (Conflict, Boundary, Repair, Decision, Pattern, Courage)
 * and provides structured guidance: Emotional Precision, Mechanism Insight,
 * Hard Truth, Practical Action, and Optional Script.
 */

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .slice(0, 3000)
}

function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initial)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setState(JSON.parse(item))
    } catch {}
    setIsHydrated(true)
  }, [key])

  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state, isHydrated])

  return [state, setState]
}

const RELATIONSHIP_TYPES = [
  { value: 'romantic', label: 'Partner', icon: '💕', description: 'Partner, spouse, significant other' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Parents, siblings, children' },
  { value: 'friendship', label: 'Friend', icon: '🤝', description: 'Close friends, acquaintances' },
  { value: 'workplace', label: 'Work', icon: '💼', description: 'Colleagues, boss, employees' },
  { value: 'self', label: 'Self', icon: '🪞', description: 'Inner conflict, self-criticism' },
  { value: 'community', label: 'Community', icon: '🌍', description: 'Neighbors, groups, society' },
] as const

const MODE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  conflict: {
    label: 'Conflict',
    color: 'text-red-400 bg-red-500/15 border-red-500/30',
    description: 'Active disagreement or tension',
  },
  boundary: {
    label: 'Boundary',
    color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    description: 'Limit violation or repeated disrespect',
  },
  repair: {
    label: 'Repair',
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    description: 'Post-conflict repair or apology',
  },
  decision: {
    label: 'Decision',
    color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    description: 'Uncertainty about what to do',
  },
  pattern: {
    label: 'Pattern',
    color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    description: 'Recurring relational dynamic',
  },
  courage: {
    label: 'Courage',
    color: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    description: 'Direct honesty requested',
  },
}

const SECTION_CONFIG: Record<string, { title: string; icon: string; gradient: string }> = {
  'Emotional Precision': {
    title: 'Emotional Precision',
    icon: '🎯',
    gradient: 'from-rose-500/20 to-pink-500/10',
  },
  "What's Actually Happening": {
    title: "What's Actually Happening",
    icon: '🔍',
    gradient: 'from-blue-500/20 to-indigo-500/10',
  },
  'The Hard Truth': {
    title: 'The Hard Truth',
    icon: '⚡',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  'What To Do': {
    title: 'What To Do',
    icon: '🎬',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  Script: {
    title: 'Script',
    icon: '💬',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
}

type EngineAnalysis = {
  mode: string
  primary_emotion: string
  secondary_emotions: string[]
  emotional_intensity: string
  mechanism: string
  mechanism_detail: string
  power_dynamic: string
  boundary_needed: boolean
  safety_concern: boolean
  pattern_identified: string | null
  user_contribution: string
  core_need: string
  confidence: number
  analysis_depth: string
}

type EngineResult = {
  response: string
  sections: Record<string, string>
  analysis: EngineAnalysis
  provider: string
  model: string
  requestedAt: string
}

export default function RelationshipCompassEnginePage() {
  const [message, setMessage] = useState('')
  const [relationshipType, setRelationshipType] = useState('romantic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<EngineResult | null>('rc_engine_result', null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sessionId, setSessionId] = useLocalState<string>('rc_engine_session_id', '')

  useEffect(() => {
    if (error) setError(null)
  }, [message, relationshipType, error])

  useEffect(() => {
    if (!sessionId) setSessionId(crypto.randomUUID())
  }, [sessionId, setSessionId])

  const requestClarity = useCallback(async () => {
    const trimmed = sanitizeInput(message.trim())
    if (!trimmed || !sessionId) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall('/api/relationship-compass-engine/clarity', {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          relationshipType,
        }),
        timeout: 60000,
      })

      const data = await response.json()

      if (data.response) {
        setResult({
          response: data.response,
          sections: data.sections || {},
          analysis: data.analysis || {},
          provider: data.provider || 'unknown',
          model: data.model || 'unknown',
          requestedAt: new Date().toISOString(),
        })
        setActiveSection(null)
      } else {
        throw new Error(data.detail || 'Failed to get clarity')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [message, relationshipType, sessionId])

  const suggestion = useMemo(() => {
    if (!result) return null
    return getNextStepSuggestion({
      tool: 'compass',
      userText: message,
      aiText: result.response,
    })
  }, [result, message])

  const modeConfig = result?.analysis?.mode ? MODE_CONFIG[result.analysis.mode] : null
  const selectedRelType = RELATIONSHIP_TYPES.find(t => t.value === relationshipType)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0910] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PathwayMap />

        {/* Header */}
        <header className="rounded-3xl border border-slate-700/40 bg-gradient-to-br from-[#0d0d12] via-[#0c0e14] to-[#0b0b10] p-6 md:p-8 shadow-[0_20px_80px_rgba(100,100,255,0.06)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Relationship Clarity</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-100 via-blue-200 to-slate-300 bg-clip-text text-transparent">
                Compass Engine
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Clear, grounded relationship guidance. No fluff. No preaching. Just clarity, dignity, and a concrete next step.
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 border border-slate-600/30 px-3 py-1 text-xs text-slate-400">
                  Mode detection
                </span>
                <span className="rounded-full bg-white/5 border border-slate-600/30 px-3 py-1 text-xs text-slate-400">
                  Mechanism analysis
                </span>
              </div>
              <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input & Response */}
          <section className="space-y-4">
            {/* Relationship Type */}
            <div className="rounded-2xl border border-slate-700/30 bg-[#0d0d12]/85 p-5">
              <label className="text-sm font-semibold text-slate-300 block mb-3">
                Who is this about?
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {RELATIONSHIP_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setRelationshipType(type.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      relationshipType === type.value
                        ? 'border-blue-400/50 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                        : 'border-slate-700/30 bg-black/20 hover:border-slate-600/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-lg block">{type.icon}</span>
                    <span className="text-[11px] font-medium text-slate-300 block mt-1">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="rounded-2xl border border-slate-700/30 bg-[#0d0d12]/85 p-5">
              <label className="text-sm font-semibold text-slate-300 block mb-3">
                What&apos;s happening?
                <span className="font-normal text-slate-500 ml-2">Be specific. The more detail, the sharper the guidance.</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  relationshipType === 'romantic'
                    ? "My partner shuts down every time I try to talk about how I feel. I've asked calmly, I've written letters, nothing changes. I'm starting to feel invisible."
                    : relationshipType === 'family'
                    ? "My mother criticizes every decision I make. Last week she told my sister I'm ruining my life. I'm 34 and she still treats me like I'm incompetent."
                    : relationshipType === 'friendship'
                    ? "My friend of 10 years only reaches out when they need something. I've started pulling back but feel guilty about it."
                    : relationshipType === 'workplace'
                    ? "My boss takes credit for my work in meetings. When I brought it up privately, they said I was being 'too sensitive.'"
                    : relationshipType === 'self'
                    ? "I keep sabotaging good things in my life. Every time something starts going well, I find a way to ruin it. Am I the problem?"
                    : "I feel like an outsider in every group. I contribute, show up, but never feel like I truly belong."
                }
                className="w-full min-h-[160px] rounded-xl bg-black/40 border border-slate-700/40 text-slate-100 placeholder:text-slate-600 p-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none resize-none text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-600">{message.length}/3000</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={requestClarity}
              disabled={message.trim().length < 10 || loading}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-slate-200 via-blue-200 to-slate-300 text-slate-900 font-semibold shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition hover:shadow-xl hover:shadow-blue-500/15 hover:scale-[1.01]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Get Clarity'
              )}
            </button>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Response */}
            {result && (
              <div className="space-y-4">
                {/* Mode Badge + Analysis Summary */}
                <div className="rounded-2xl border border-slate-700/30 bg-[#0d0d12]/90 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {modeConfig && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${modeConfig.color}`}>
                          {modeConfig.label} Mode
                        </span>
                      )}
                      {result.analysis?.primary_emotion && (
                        <span className="text-xs text-slate-500">
                          Primary emotion: <span className="text-slate-300">{result.analysis.primary_emotion}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600">
                      {new Date(result.requestedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Analysis chips */}
                  <div className="flex flex-wrap gap-2">
                    {result.analysis?.mechanism && (
                      <span className="px-2 py-1 rounded-md bg-white/5 border border-slate-700/30 text-[11px] text-slate-400">
                        {result.analysis.mechanism.replace(/_/g, ' ')}
                      </span>
                    )}
                    {result.analysis?.emotional_intensity && (
                      <span className={`px-2 py-1 rounded-md border text-[11px] ${
                        result.analysis.emotional_intensity === 'high' || result.analysis.emotional_intensity === 'overwhelming'
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-white/5 border-slate-700/30 text-slate-400'
                      }`}>
                        intensity: {result.analysis.emotional_intensity}
                      </span>
                    )}
                    {result.analysis?.boundary_needed && (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400">
                        boundary needed
                      </span>
                    )}
                    {result.analysis?.safety_concern && (
                      <span className="px-2 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-[11px] text-red-300 font-semibold">
                        safety concern
                      </span>
                    )}
                  </div>
                </div>

                {/* Structured Sections */}
                {result.sections && Object.keys(result.sections).length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(result.sections)
                      .filter(([key]) => !key.startsWith('_'))
                      .map(([key, content]) => {
                        if (!content || content.trim().length === 0) return null
                        const config = SECTION_CONFIG[key] || {
                          title: key,
                          icon: '📌',
                          gradient: 'from-slate-500/20 to-slate-500/10',
                        }
                        const isActive = activeSection === key

                        return (
                          <div
                            key={key}
                            className={`rounded-xl border border-slate-700/25 overflow-hidden transition-all duration-300 ${
                              isActive ? 'shadow-lg shadow-blue-500/5' : ''
                            }`}
                          >
                            <button
                              onClick={() => setActiveSection(isActive ? null : key)}
                              className={`w-full p-4 flex items-center justify-between bg-gradient-to-r ${config.gradient} hover:opacity-90 transition`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{config.icon}</span>
                                <span className="font-medium text-slate-200">{config.title}</span>
                              </div>
                              <svg
                                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div
                              className={`overflow-hidden transition-all duration-300 ${
                                isActive ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="p-5 bg-black/30">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {content}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {/* Full Response */}
                <details className="rounded-xl border border-slate-700/25 bg-black/30 overflow-hidden">
                  <summary className="p-4 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-300 transition">
                    View full response
                  </summary>
                  <div className="px-5 pb-5">
                    <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                      {result.response}
                    </div>
                  </div>
                </details>

                <NextStepLink suggestion={suggestion} />
              </div>
            )}
          </section>

          {/* Right: Sidebar */}
          <section className="space-y-4">
            {/* Selected Type */}
            {selectedRelType && (
              <div className="rounded-2xl border border-slate-700/30 bg-[#0d0d12]/90 p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedRelType.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-200">{selectedRelType.label}</h3>
                    <p className="text-xs text-slate-500">{selectedRelType.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="rounded-2xl border border-slate-700/30 bg-[#0c0c10]/90 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">How It Works</h3>
              <ol className="space-y-3 text-sm text-slate-400">
                {[
                  'You describe your situation in plain language',
                  'Engine detects the mode (conflict, boundary, repair, decision, pattern, courage)',
                  'Identifies the psychological mechanism at play',
                  'Delivers: precise emotion, what\'s happening, hard truth, action step, and script',
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700/50 text-xs font-bold text-slate-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Modes Reference */}
            <div className="rounded-2xl border border-slate-700/30 bg-[#0c0c10]/90 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Six Modes</h3>
              <div className="space-y-2">
                {Object.entries(MODE_CONFIG).map(([id, config]) => (
                  <div key={id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-slate-800/30">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-500">{config.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Principles */}
            <div className="rounded-2xl border border-slate-700/30 bg-[#0c0c10]/90 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Core Principles</h3>
              <ul className="space-y-2 text-xs text-slate-500 leading-relaxed">
                <li>Act without attachment to their response.</li>
                <li>Preserve dignity over approval.</li>
                <li>Regulate before reacting.</li>
                <li>Compassionate, not submissive.</li>
                <li>Steady in praise and blame.</li>
                <li>Courage over avoidance.</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="rounded-2xl border border-slate-600/20 bg-gradient-to-br from-slate-500/5 to-transparent p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Not therapy.</strong> This tool provides clarity, not clinical intervention.
                It never takes sides. If you&apos;re experiencing abuse or a mental health crisis,
                please reach out to a professional.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/relationship-compass"
                className="px-4 py-2 rounded-xl bg-white/5 border border-slate-700/30 text-slate-400 text-xs font-semibold hover:border-slate-500/50 transition"
              >
                Gita-Grounded Compass
              </Link>
              <Link
                href="/kiaan/chat"
                className="px-4 py-2 rounded-xl bg-white/5 border border-slate-700/30 text-slate-400 text-xs font-semibold hover:border-slate-500/50 transition"
              >
                Talk to KIAAN
              </Link>
              <Link
                href="/viyog"
                className="px-4 py-2 rounded-xl bg-white/5 border border-slate-700/30 text-slate-400 text-xs font-semibold hover:border-slate-500/50 transition"
              >
                Detachment Coach
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
