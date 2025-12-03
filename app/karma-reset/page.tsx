'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { KiaanResetResponse, ResetStep, RepairType } from '@/types/karma-reset.types'
import { REPAIR_ACTIONS, RESET_STEP_ORDER } from '@/types/karma-reset.types'

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\\/g, '') // Remove backslashes
    .slice(0, 2000) // Limit length
}

export default function KarmaResetPage() {
  // User inputs
  const [misstep, setMisstep] = useState('')
  const [impact, setImpact] = useState('')
  const [repairType, setRepairType] = useState<RepairType>(REPAIR_ACTIONS[0].value)
  
  // Reset flow state
  const [currentStep, setCurrentStep] = useState<ResetStep>('input')
  const [loading, setLoading] = useState(false)
  const [kiaanResponse, setKiaanResponse] = useState<KiaanResetResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        // Auto-advance to pause step after breathing is complete
        setCurrentStep('pause')
      }
    }, 900)
    return () => clearInterval(id)
  }, [breathActive])

  const breathPhase = ['Inhale gently', 'Hold softly', 'Exhale slowly', 'Rest in calm'][breathTick % 4] ?? 'Inhale gently'
  const breathsDone = Math.min(4, Math.floor(breathTick / 4))

  // Generate KIAAN reset guidance
  const generateResetGuidance = useCallback(async () => {
    setLoading(true)
    setError(null)

    const sanitizedMisstep = sanitizeInput(misstep) || 'A brief misstep or moment that felt off'
    const sanitizedImpact = sanitizeInput(impact) || 'Someone I care about'

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/karma-reset/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_happened: sanitizedMisstep,
          who_felt_it: sanitizedImpact,
          repair_type: repairType
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.reset_guidance) {
          setKiaanResponse(data.reset_guidance)
          // Start the breathing exercise
          setCurrentStep('breathing')
          setBreathActive(true)
        } else {
          setError('KIAAN returned an unexpected response. Please try again.')
        }
      } else {
        setError('KIAAN is having trouble connecting. Please try again in a moment.')
      }
    } catch {
      setError('Unable to reach KIAAN. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [misstep, impact, repairType])

  // Handle step progression
  const advanceStep = () => {
    const currentIndex = RESET_STEP_ORDER.indexOf(currentStep)
    if (currentIndex < RESET_STEP_ORDER.length - 1) {
      setCurrentStep(RESET_STEP_ORDER[currentIndex + 1])
    }
  }

  // Reset the flow
  const resetFlow = () => {
    setCurrentStep('input')
    setMisstep('')
    setImpact('')
    setRepairType(REPAIR_ACTIONS[0].value)
    setKiaanResponse(null)
    setError(null)
    setBreathActive(false)
    setBreathTick(0)
  }

  // Check if step is completed
  const isStepCompleted = (step: ResetStep): boolean => {
    return RESET_STEP_ORDER.indexOf(step) < RESET_STEP_ORDER.indexOf(currentStep)
  }

  // Check if step is active
  const isStepActive = (step: ResetStep): boolean => currentStep === step

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Gentle Course Correction</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Karma Reset Guide
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                A calm, focused reset ritual. One cohesive flow to return to your values.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                20-40 second practice
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Input Step */}
        {currentStep === 'input' && (
          <section 
            className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)] space-y-5 animate-fade-in"
            role="region"
            aria-label="Reset input form"
          >
            <h2 className="text-lg font-semibold text-orange-50">Tell KIAAN what happened</h2>

            {/* What happened */}
            <div>
              <label htmlFor="misstep-input" className="text-xs text-orange-100/80 font-semibold">
                What happened?
              </label>
              <textarea
                id="misstep-input"
                value={misstep}
                onChange={e => setMisstep(e.target.value)}
                placeholder="A brief slip or tone that felt off..."
                className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none resize-none"
                rows={2}
                aria-describedby="misstep-hint"
              />
              <p id="misstep-hint" className="sr-only">Describe what happened briefly</p>
            </div>

            {/* Who felt it */}
            <div>
              <label htmlFor="impact-input" className="text-xs text-orange-100/80 font-semibold">
                Who felt the ripple?
              </label>
              <input
                id="impact-input"
                value={impact}
                onChange={e => setImpact(e.target.value)}
                placeholder="A teammate, friend, or even myself"
                className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none"
                aria-describedby="impact-hint"
              />
              <p id="impact-hint" className="sr-only">Who was affected by this moment</p>
            </div>

            {/* Choose the repair */}
            <div>
              <label className="text-xs text-orange-100/80 font-semibold">Choose the repair</label>
              <div className="mt-2 space-y-2" role="radiogroup" aria-label="Repair type selection">
                {REPAIR_ACTIONS.map(action => (
                  <button
                    key={action.value}
                    onClick={() => setRepairType(action.value)}
                    role="radio"
                    aria-checked={repairType === action.value}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      repairType === action.value
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

            {/* Error display */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-400/30 p-3 text-sm text-red-200" role="alert">
                {error}
              </div>
            )}

            {/* Start Reset Button */}
            <button
              onClick={generateResetGuidance}
              disabled={loading}
              className="w-full px-5 py-4 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 transition hover:scale-[1.02]"
              aria-label={loading ? 'Starting reset...' : 'Start Reset'}
            >
              {loading ? 'Starting reset...' : 'Begin Reset Ritual'}
            </button>
          </section>
        )}

        {/* Four Reset Cards */}
        {currentStep !== 'input' && (
          <div className="space-y-4">
            {/* Card 1: Pause and Breathe (Orange) */}
            <div
              className={`rounded-2xl border p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] transition-all duration-500 ${
                isStepCompleted('pause') || isStepActive('pause') || isStepActive('breathing')
                  ? 'border-orange-400/40 bg-gradient-to-br from-orange-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85'
                  : 'border-orange-500/10 bg-[#0d0d10]/50 opacity-50'
              }`}
              role="region"
              aria-label="Pause and Breathe step"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isStepCompleted('pause') ? 'bg-green-500/30 text-green-50 border border-green-300' :
                  isStepActive('pause') || isStepActive('breathing') ? 'bg-orange-500/30 text-orange-50 border border-orange-400' :
                  'bg-white/5 text-orange-100/50 border border-orange-500/20'
                }`}>
                  {isStepCompleted('pause') ? '✓' : '1'}
                </span>
                <h3 className="text-lg font-semibold text-orange-50">Pause and Breathe</h3>
              </div>

              {/* Breathing animation (only when active) */}
              {(isStepActive('breathing') || (isStepActive('pause') && !isStepCompleted('pause'))) && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-orange-500/20 via-[#ffb347]/20 to-transparent flex items-center justify-center">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ff9933]/20 to-orange-200/10 shadow-inner shadow-orange-500/30 ${breathActive ? 'animate-ping' : 'animate-pulse'}`} />
                    <div className="absolute inset-1 rounded-full border border-orange-400/30" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-semibold text-orange-50">{breathPhase}</div>
                    <div className="text-xs text-orange-100/70">{Math.min(4, breathsDone + 1)} / 4 breaths</div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-[#ffb347] transition-all duration-300"
                        style={{ width: `${(Math.min(breathTick, 16) / 16) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* KIAAN pause response */}
              {(isStepCompleted('pause') || isStepActive('pause')) && kiaanResponse?.pause && (
                <div className="kiaan-response text-sm text-orange-100/90 italic bg-black/30 rounded-lg p-3 border border-orange-500/15">
                  &ldquo;{kiaanResponse.pause}&rdquo;
                </div>
              )}

              {isStepActive('pause') && !breathActive && (
                <button
                  onClick={advanceStep}
                  className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500/20 text-orange-50 hover:bg-orange-500/30 transition"
                  aria-label="Continue to next step"
                >
                  Next →
                </button>
              )}
            </div>

            {/* Card 2: Name the Ripple (Purple) */}
            <div
              className={`rounded-2xl border p-5 shadow-[0_15px_60px_rgba(167,139,250,0.08)] transition-all duration-500 ${
                isStepCompleted('ripple') || isStepActive('ripple')
                  ? 'border-purple-400/40 bg-gradient-to-br from-purple-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85'
                  : 'border-purple-500/10 bg-[#0d0d10]/50 opacity-50'
              }`}
              role="region"
              aria-label="Name the Ripple step"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isStepCompleted('ripple') ? 'bg-green-500/30 text-green-50 border border-green-300' :
                  isStepActive('ripple') ? 'bg-purple-500/30 text-purple-50 border border-purple-400' :
                  'bg-white/5 text-purple-100/50 border border-purple-500/20'
                }`}>
                  {isStepCompleted('ripple') ? '✓' : '2'}
                </span>
                <h3 className="text-lg font-semibold text-purple-50">Name the Ripple</h3>
              </div>

              {/* KIAAN ripple response */}
              {(isStepCompleted('ripple') || isStepActive('ripple')) && kiaanResponse?.ripple && (
                <div className="kiaan-response space-y-2 bg-black/30 rounded-lg p-3 border border-purple-500/15">
                  <p className="text-sm text-purple-100/90">
                    <strong className="text-purple-200">What happened:</strong> {kiaanResponse.ripple.what_happened}
                  </p>
                  <p className="text-sm text-purple-100/90">
                    <strong className="text-purple-200">Ripple:</strong> {kiaanResponse.ripple.impact}
                  </p>
                </div>
              )}

              {isStepActive('ripple') && (
                <button
                  onClick={advanceStep}
                  className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-500/20 text-purple-50 hover:bg-purple-500/30 transition"
                  aria-label="Continue to next step"
                >
                  Next →
                </button>
              )}
            </div>

            {/* Card 3: Choose the Repair (Green) */}
            <div
              className={`rounded-2xl border p-5 shadow-[0_15px_60px_rgba(74,222,128,0.08)] transition-all duration-500 ${
                isStepCompleted('repair') || isStepActive('repair')
                  ? 'border-green-400/40 bg-gradient-to-br from-green-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85'
                  : 'border-green-500/10 bg-[#0d0d10]/50 opacity-50'
              }`}
              role="region"
              aria-label="Choose the Repair step"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isStepCompleted('repair') ? 'bg-green-500/30 text-green-50 border border-green-300' :
                  isStepActive('repair') ? 'bg-green-500/30 text-green-50 border border-green-400' :
                  'bg-white/5 text-green-100/50 border border-green-500/20'
                }`}>
                  {isStepCompleted('repair') ? '✓' : '3'}
                </span>
                <h3 className="text-lg font-semibold text-green-50">Choose the Repair</h3>
              </div>

              {/* KIAAN repair response */}
              {(isStepCompleted('repair') || isStepActive('repair')) && kiaanResponse?.repair && (
                <div className="kiaan-response space-y-2 bg-black/30 rounded-lg p-3 border border-green-500/15">
                  <p className="text-xs text-green-300/80 uppercase tracking-wide">
                    {kiaanResponse.repair.type === 'apology' && '💚 Apology'}
                    {kiaanResponse.repair.type === 'clarification' && '💬 Clarification'}
                    {kiaanResponse.repair.type === 'calm_followup' && '🕊️ Calm Follow-up'}
                  </p>
                  <p className="text-sm text-green-100/90">{kiaanResponse.repair.action}</p>
                </div>
              )}

              {isStepActive('repair') && (
                <button
                  onClick={advanceStep}
                  className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-green-500/20 text-green-50 hover:bg-green-500/30 transition"
                  aria-label="Continue to next step"
                >
                  Next →
                </button>
              )}
            </div>

            {/* Card 4: Move With Intention (Blue) */}
            <div
              className={`rounded-2xl border p-5 shadow-[0_15px_60px_rgba(96,165,250,0.08)] transition-all duration-500 ${
                isStepCompleted('intention') || isStepActive('intention')
                  ? 'border-blue-400/40 bg-gradient-to-br from-blue-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85'
                  : 'border-blue-500/10 bg-[#0d0d10]/50 opacity-50'
              }`}
              role="region"
              aria-label="Move With Intention step"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isStepCompleted('intention') ? 'bg-green-500/30 text-green-50 border border-green-300' :
                  isStepActive('intention') ? 'bg-blue-500/30 text-blue-50 border border-blue-400' :
                  'bg-white/5 text-blue-100/50 border border-blue-500/20'
                }`}>
                  {isStepCompleted('intention') ? '✓' : '4'}
                </span>
                <h3 className="text-lg font-semibold text-blue-50">Move With Intention</h3>
              </div>

              {/* KIAAN intention response */}
              {(isStepCompleted('intention') || isStepActive('intention')) && kiaanResponse?.intention && (
                <div className="kiaan-response text-sm text-blue-100/90 italic bg-black/30 rounded-lg p-3 border border-blue-500/15">
                  &ldquo;{kiaanResponse.intention}&rdquo;
                </div>
              )}

              {isStepActive('intention') && (
                <button
                  onClick={advanceStep}
                  className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-500/20 text-blue-50 hover:bg-blue-500/30 transition"
                  aria-label="Complete reset ritual"
                >
                  Complete ✓
                </button>
              )}
            </div>
          </div>
        )}

        {/* Final Summary (shown after complete) */}
        {currentStep === 'complete' && kiaanResponse && (
          <section 
            className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/5 via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.15)] animate-fade-in"
            role="region"
            aria-label="Reset summary"
          >
            <h3 className="text-sm font-semibold text-orange-50 mb-3 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-green-500/30 text-green-50 flex items-center justify-center text-xs">✓</span>
              Reset Complete
            </h3>
            <div className="text-sm text-orange-100/80 space-y-1 bg-black/30 rounded-lg p-4 border border-orange-500/15">
              <p><strong className="text-orange-200">Ripple:</strong> {kiaanResponse.ripple.what_happened}</p>
              <p><strong className="text-orange-200">Impact:</strong> {kiaanResponse.ripple.impact}</p>
              <p><strong className="text-orange-200">Repair:</strong> {kiaanResponse.repair.action}</p>
              <p><strong className="text-orange-200">Intention:</strong> {kiaanResponse.intention}</p>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={resetFlow}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500/20 text-orange-50 hover:bg-orange-500/30 transition"
                aria-label="Start a new reset"
              >
                New Reset
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-orange-400/25 text-orange-50 hover:bg-white/5 transition"
              >
                Return Home
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
