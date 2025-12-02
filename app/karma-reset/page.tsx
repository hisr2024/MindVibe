'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Constants
const PLAN_PREVIEW_LENGTH = 200

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

const resetSteps = [
  { title: '4-breath reset', detail: 'Take 4 slow breaths to let the nervous system settle.' },
  { title: 'Pause and breathe', detail: 'Create space between trigger and response.' },
  { title: 'Name the ripple', detail: 'What happened? Who was impacted? Acknowledge without self-blame.' },
  { title: 'Choose the repair', detail: 'Pick one caring action: apology, clarification, or calm follow-up.' },
  { title: 'Move with intention', detail: 'Return to your values; act in a way future-you will respect.' }
]

const repairActions = [
  { label: 'Apology', helper: 'Offer a sincere apology that stays brief and grounded.' },
  { label: 'Clarification', helper: 'Gently clarify what you meant and invite understanding.' },
  { label: 'Calm follow-up', helper: 'Return with a warm note that re-centers the conversation.' }
]

export default function KarmaResetPage() {
  const [misstep, setMisstep] = useState('')
  const [impact, setImpact] = useState('')
  const [repairAction, setRepairAction] = useState(repairActions[0].label)
  const [intention, setIntention] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [savedPlans, setSavedPlans] = useLocalState<string[]>('karma_reset_plans', [])

  // Breathing animation state
  const [breathActive, setBreathActive] = useState(false)
  const [breathTick, setBreathTick] = useState(0)

  useEffect(() => {
    if (!breathActive) return
    setBreathTick(0)
    let current = 0
    const id = setInterval(() => {
      current += 1
      setBreathTick(current)
      if (current >= 16) {
        setBreathActive(false)
        clearInterval(id)
      }
    }, 900)
    return () => clearInterval(id)
  }, [breathActive])

  const breathPhase = ['Inhale gently', 'Hold softly', 'Exhale slowly', 'Rest in calm'][breathTick % 4] ?? 'Inhale gently'
  const breathsDone = Math.min(4, Math.floor(breathTick / 4))

  async function buildPlan() {
    setLoading(true)

    const sanitizedMisstep = sanitizeInput(misstep) || 'A brief misstep or moment that felt off'
    const sanitizedImpact = sanitizeInput(impact) || 'Someone I care about'
    const sanitizedIntention = sanitizeInput(intention) || 'Stay kind, steady, and clear'
    
    const context = `Help me create a gentle karma reset plan based on this situation:

What happened: ${sanitizedMisstep}
Who felt it: ${sanitizedImpact}
Repair choice: ${repairAction}
My intention moving forward: ${sanitizedIntention}

Please provide a structured, warm, non-judgmental plan that includes:
1. A brief acknowledgment of the situation
2. A grounding breath reminder
3. A specific repair action based on my choice
4. Words I could use for the repair
5. A closing intention to carry forward

Keep the tone calm, supportive, and free of guilt or shame. Format it clearly.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: context })
      })

      if (response.ok) {
        const data = await response.json()
        setPlan(data.response)
      } else {
        setPlan('KIAAN is having trouble connecting. Please try again in a moment.')
      }
    } catch {
      setPlan('Unable to reach KIAAN. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function savePlanToJournal() {
    if (plan) {
      setSavedPlans([`[${new Date().toLocaleString()}]\n${plan}`, ...savedPlans])
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Gentle Course Correction</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Karma Reset Guide
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                A calm checklist to reset after small missteps while keeping KIAAN's warm, non-judgmental tone intact.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                Keeps conversations kind
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Reset Plan Steps */}
          <section className="space-y-4">
            {/* Breathing Exercise */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-orange-50">4-breath reset</h2>
                  <p className="text-xs text-orange-100/70">Let the guided breathing lead you.</p>
                </div>
                <button
                  onClick={() => setBreathActive(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-[#ffb347] text-slate-950 shadow-lg shadow-orange-500/25 transition hover:scale-105"
                >
                  {breathActive ? 'In progress...' : breathsDone >= 4 ? 'Replay' : 'Begin'}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/20 via-[#ffb347]/20 to-transparent flex items-center justify-center">
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ff9933]/20 to-orange-200/10 shadow-inner shadow-orange-500/30 ${breathActive ? 'animate-ping' : 'animate-pulse'}`} />
                  <div className="absolute inset-2 rounded-full border border-orange-400/30" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="text-sm font-semibold text-orange-50">{breathPhase}</div>
                  <div className="text-xs text-orange-100/70">{Math.min(4, breathsDone + 1)} / 4 breaths</div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-[#ffb347] transition-all duration-300"
                      style={{ width: `${(Math.min(breathTick, 16) / 16) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Steps Checklist */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h2 className="text-lg font-semibold text-orange-50 mb-4">Reset Checklist</h2>
              <div className="space-y-3">
                {resetSteps.map(step => (
                  <button
                    key={step.title}
                    onClick={() => setCompletedSteps(prev => ({ ...prev, [step.title]: !prev[step.title] }))}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      completedSteps[step.title]
                        ? 'border-green-300/50 bg-green-500/10'
                        : 'border-orange-500/20 bg-black/30 hover:border-orange-300/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs ${
                        completedSteps[step.title]
                          ? 'border-green-300 bg-green-500/30 text-green-50'
                          : 'border-orange-400/60 text-orange-100'
                      }`}>
                        {completedSteps[step.title] ? '✓' : '○'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-orange-50">{step.title}</p>
                        <p className="text-xs text-orange-100/70">{step.detail}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Plan Display */}
            {plan && (
              <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-orange-50">Your Reset Plan</h2>
                  <button
                    onClick={savePlanToJournal}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-400/30 text-orange-100 hover:bg-orange-500/10 transition"
                  >
                    Save to Journal
                  </button>
                </div>
                <div className="text-sm text-orange-100/90 whitespace-pre-wrap leading-relaxed bg-black/40 rounded-xl p-4 border border-orange-500/15">
                  {plan}
                </div>
              </div>
            )}
          </section>

          {/* Right: Talk it through form */}
          <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-orange-50">Talk it through with KIAAN</h2>
              <span className="text-xs text-orange-100/60 bg-white/5 border border-orange-500/20 rounded-full px-3 py-1">
                Quick fill
              </span>
            </div>

            {/* What happened */}
            <div>
              <label className="text-xs text-orange-100/80 font-semibold">What happened?</label>
              <textarea
                value={misstep}
                onChange={e => setMisstep(e.target.value)}
                placeholder="A brief slip or tone that felt off..."
                className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none"
                rows={3}
              />
            </div>

            {/* Who felt it */}
            <div>
              <label className="text-xs text-orange-100/80 font-semibold">Who felt the ripple?</label>
              <input
                value={impact}
                onChange={e => setImpact(e.target.value)}
                placeholder="A teammate, friend, or even myself"
                className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none"
              />
            </div>

            {/* Choose the repair */}
            <div>
              <label className="text-xs text-orange-100/80 font-semibold">Choose the repair</label>
              <div className="mt-2 space-y-2">
                {repairActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => setRepairAction(action.label)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      repairAction === action.label
                        ? 'border-green-300/60 bg-green-500/10 text-green-50 shadow-lg shadow-green-500/10'
                        : 'border-orange-400/25 bg-black/30 text-orange-50 hover:border-orange-300/50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{action.label}</div>
                    <div className="text-xs text-orange-100/70">{action.helper}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Intention */}
            <div>
              <label className="text-xs text-orange-100/80 font-semibold">Move with intention</label>
              <textarea
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="How do you want to show up next?"
                className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={buildPlan}
                disabled={loading}
                className="flex-1 min-w-[140px] px-5 py-3 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 transition hover:scale-[1.02]"
              >
                {loading ? 'Building plan...' : 'Build Reset Plan'}
              </button>
              <Link
                href="/#kiaan-chat"
                className="px-5 py-3 rounded-xl border border-orange-400/25 bg-white/5 text-sm font-semibold text-orange-50 hover:border-orange-300/50 transition text-center"
              >
                Send to KIAAN
              </Link>
            </div>
          </section>
        </div>

        {/* Saved Plans */}
        {savedPlans.length > 0 && (
          <section className="rounded-2xl border border-orange-500/15 bg-black/30 p-5">
            <h3 className="text-sm font-semibold text-orange-50 mb-3">Saved Plans</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedPlans.map((savedPlan, idx) => (
                <div key={idx} className="text-xs text-orange-100/70 bg-black/40 rounded-lg p-3 whitespace-pre-wrap">
                  {savedPlan.slice(0, PLAN_PREVIEW_LENGTH)}...
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
