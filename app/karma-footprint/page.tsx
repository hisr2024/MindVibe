'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { ToolHeader, ToolActionCard, KarmicTreeClient } from '@/components/tools'

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
        const parsed = JSON.parse(item)
        setState(parsed)
      }
    } catch (error) {
      console.warn(`Failed to load localStorage key "${key}":`, error)
    }
    setIsHydrated(true)
  }, [key])

  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.warn(`Failed to save localStorage key "${key}":`, error)
    }
  }, [key, state, isHydrated])

  return [state, setState]
}

interface DailyAction {
  id: string
  action: string
  impact: 'positive' | 'neutral' | 'growth'
  reflection?: string
  timestamp: string
}

interface FootprintResult {
  response: string
  requestedAt: string
}

const impactOptions = [
  { value: 'positive', label: 'Positive', emoji: '🌟', description: 'Helped someone or did good' },
  { value: 'neutral', label: 'Neutral', emoji: '⚖️', description: 'Neither good nor bad' },
  { value: 'growth', label: 'Growth', emoji: '🌱', description: 'A learning moment' },
] as const

export default function KarmaFootprintPage() {
  const [action, setAction] = useState('')
  const [impact, setImpact] = useState<'positive' | 'neutral' | 'growth'>('positive')
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<FootprintResult | null>('karma_footprint_result', null)
  const [todayActions, setTodayActions] = useLocalState<DailyAction[]>('karma_footprint_today', [])

  useEffect(() => {
    if (error) setError(null)
  }, [action, error])

  async function analyzeFootprint() {
    const trimmedAction = sanitizeInput(action.trim())
    if (!trimmedAction) return

    setLoading(true)
    setError(null)

    const systemPrompt = `Role:
You are Karma Footprint Analyzer, a calm, wise assistant that helps users reflect on their daily actions and their karmic impact. You help users understand the ripple effects of their choices without judgment, encouraging mindful awareness of how actions affect themselves and others.

Core purpose:
- Help users reflect on daily actions and their impact
- Identify positive patterns and growth opportunities
- Connect small actions to larger patterns of behavior
- Encourage mindful, intentional living
- Never judge or shame - only illuminate and guide

Tone: warm, non-judgmental, insightful, grounded, brief

Output structure:
1. Action Acknowledged (brief recognition of what they did)
2. Ripple Effect (how this action might affect themselves/others)
3. Pattern Insight (what this reveals about values or habits)
4. Mindful Step (one small thing to carry forward)

Boundaries:
- Do not provide therapy or crisis support
- Do not make moral judgments
- Keep responses brief and actionable
- Focus on awareness, not guilt`

    const request = `${systemPrompt}

Action: "${trimmedAction}"
Impact type: ${impact}
${reflection ? `User reflection: "${sanitizeInput(reflection)}"` : ''}

Respond using the four-part format with brief, grounded insights.`

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: request }),
      })

      const data = await response.json()
      const newResult = { response: data.response, requestedAt: new Date().toISOString() }
      setResult(newResult)

      // Save today's action - use fallback for older browsers
      const actionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const newAction: DailyAction = {
        id: actionId,
        action: trimmedAction,
        impact,
        reflection: reflection.trim() || undefined,
        timestamp: new Date().toISOString(),
      }
      setTodayActions([newAction, ...todayActions.slice(0, 9)])

      // Clear form
      setAction('')
      setReflection('')
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const clearTodayActions = () => {
    setTodayActions([])
    setResult(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <ToolHeader
          icon="👣"
          title="Karma Footprint"
          subtitle="Track your daily actions and understand their ripple effects. Build awareness of how small choices shape your path."
          backLink={{ label: 'Back to dashboard', href: '/dashboard' }}
        />

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input and Response */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label
                htmlFor="action-input"
                className="text-sm font-semibold text-orange-100 block mb-3"
              >
                What action do you want to reflect on?
              </label>
              <textarea
                id="action-input"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Example: I helped my colleague with their project today..."
                className="w-full min-h-[100px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none"
                aria-describedby="action-hint"
              />
              <p id="action-hint" className="sr-only">
                Describe an action from your day
              </p>

              {/* Impact Selection */}
              <div className="mt-4">
                <label className="text-sm font-semibold text-orange-100 block mb-2">
                  How would you describe this action?
                </label>
                <div
                  className="grid gap-2 sm:grid-cols-3"
                  role="radiogroup"
                  aria-label="Action impact type"
                >
                  {impactOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setImpact(option.value)}
                      role="radio"
                      aria-checked={impact === option.value}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        impact === option.value
                          ? 'border-orange-400/60 bg-orange-500/15 text-orange-50 shadow-lg shadow-orange-500/15'
                          : 'border-orange-400/25 bg-black/30 text-orange-100/80 hover:border-orange-300/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.emoji}</span>
                        <span className="text-sm font-semibold">{option.label}</span>
                      </div>
                      <div className="text-xs text-orange-100/60 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Reflection */}
              <div className="mt-4">
                <label
                  htmlFor="reflection-input"
                  className="text-sm font-semibold text-orange-100 block mb-2"
                >
                  Any additional thoughts? (optional)
                </label>
                <input
                  id="reflection-input"
                  type="text"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="What was going through your mind?"
                  className="w-full rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/50 p-3 focus:ring-2 focus:ring-orange-400/50 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={analyzeFootprint}
                  disabled={!action.trim() || loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02]"
                >
                  {loading ? <span>Analyzing...</span> : <span>Analyze Footprint</span>}
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
                  <span className="font-semibold text-orange-50">Karma Footprint Analysis</span>
                  <span>{new Date(result.requestedAt).toLocaleString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">
                  {result.response}
                </div>
              </div>
            )}

            {/* Today's Actions */}
            {todayActions.length > 0 && (
              <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-orange-50">Today&apos;s Footprints</h3>
                  <button
                    onClick={clearTodayActions}
                    className="text-xs text-orange-100/60 hover:text-orange-100 transition"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="space-y-2">
                  {todayActions.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 rounded-lg bg-black/30 p-3 border border-orange-500/10"
                    >
                      <span className="text-lg">
                        {item.impact === 'positive'
                          ? '🌟'
                          : item.impact === 'growth'
                            ? '🌱'
                            : '⚖️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-orange-50 truncate">{item.action}</p>
                        <p className="text-xs text-orange-100/50">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Right: Info and Tree */}
          <section className="space-y-4">
            {/* Karmic Tree Widget */}
            <KarmicTreeClient className="h-fit" />

            {/* About */}
            <ToolActionCard
              title="About Karma Footprint"
              description="Your daily actions create ripples that extend far beyond the moment. This tool helps you track and reflect on those ripples, building awareness of how your choices shape your life and the lives of others."
              variant="orange"
            >
              <div className="mt-3 p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <h4 className="text-xs font-semibold text-orange-50 mb-2">What gets tracked?</h4>
                <ul className="space-y-1 text-xs text-orange-100/70">
                  <li className="flex items-center gap-2">
                    <span>🌟</span> Positive actions that helped others
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⚖️</span> Neutral moments worth noting
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🌱</span> Growth opportunities and learnings
                  </li>
                </ul>
              </div>
            </ToolActionCard>

            {/* Links */}
            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <h4 className="text-xs font-semibold text-orange-50 mb-3">Related Tools</h4>
              <div className="space-y-2">
                <Link
                  href="/karma-reset"
                  className="flex items-center gap-2 text-sm text-orange-100/80 hover:text-orange-50 transition"
                >
                  <span>🔧</span> Karma Reset Ritual
                </Link>
                <Link
                  href="/karmic-tree"
                  className="flex items-center gap-2 text-sm text-orange-100/80 hover:text-orange-50 transition"
                >
                  <span>🌳</span> Full Karmic Tree View
                </Link>
                <Link
                  href="/sacred-reflections"
                  className="flex items-center gap-2 text-sm text-orange-100/80 hover:text-orange-50 transition"
                >
                  <span>📝</span> Sacred Reflections Journal
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
