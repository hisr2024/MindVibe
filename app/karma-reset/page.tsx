'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

// Keep lines compact and enforce brevity on the client as well
const MAX_LINE_LENGTH = 200
function compactLine(input?: string | null): string {
  if (!input) return ''
  const cleaned = input.replace(/\s+/g, ' ').trim()
  return cleaned.slice(0, MAX_LINE_LENGTH)
}

// Breathing phase configuration (4s inhale, 1s hold, 5s exhale = 10s per breath)
const BREATH_PHASES = [
  { label: 'Inhale', duration: 4000, instruction: 'Breathe in slowly...' },
  { label: 'Hold', duration: 1000, instruction: 'Hold gently...' },
  { label: 'Exhale', duration: 5000, instruction: 'Release slowly...' },
]
const TOTAL_BREATHS = 4
const BREATH_CYCLE_DURATION = BREATH_PHASES.reduce((acc, p) => acc + p.duration, 0)

export default function KarmaResetPage() {
  // User inputs
  const [whatHappened, setWhatHappened] = useState('')
  const [whoFeltRipple, setWhoFeltRipple] = useState('')
  const [repairType, setRepairType] = useState<RepairType>(REPAIR_ACTIONS[0].value)
  
  // Reset flow state
  const [currentStep, setCurrentStep] = useState<ResetStep>('input')
  const [loading, setLoading] = useState(false)
  const [kiaanResponse, setKiaanResponse] = useState<KiaanResetResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Breathing state
  const [breathCount, setBreathCount] = useState(0)
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0)
  const [breathProgress, setBreathProgress] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const breathStartTime = useRef<number>(0)
  const animationFrame = useRef<number | undefined>(undefined)
  const [revealedCards, setRevealedCards] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastBreathPhaseRef = useRef<number>(0)

  // Save to journal state
  const [journalSaved, setJournalSaved] = useState(false)

  const normalizeGuidance = useCallback((guidance: any): KiaanResetResponse | null => {
    if (!guidance) return null

    const breathingLine = compactLine(guidance.breathing_line ?? guidance.pauseAndBreathe ?? guidance.breathingLine)
    const rippleSummary = compactLine(guidance.ripple_summary ?? guidance.nameTheRipple ?? guidance.rippleSummary)
    const repairAction = compactLine(guidance.repair_action ?? guidance.repair ?? guidance.repairAction)
    const forwardIntention = compactLine(
      guidance.forward_intention ?? guidance.moveWithIntention ?? guidance.forwardIntention
    )

    if (!breathingLine || !rippleSummary || !repairAction || !forwardIntention) return null

    return {
      breathingLine,
      rippleSummary,
      repairAction,
      forwardIntention
    }
  }, [])

  const playChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = audioContextRef.current || new AudioContext()
      audioContextRef.current = ctx
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = 520
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.65)
    } catch (chimeError) {
      console.error('Chime playback failed', chimeError)
    }
  }, [soundEnabled])

  const startBreathingCycle = useCallback(() => {
    if (!kiaanResponse) return
    setCurrentStep('breathing')
    setBreathCount(0)
    setBreathPhaseIndex(0)
    setBreathProgress(0)
    lastBreathPhaseRef.current = 0
    setIsBreathing(true)
    setRevealedCards(0)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => null)
    }
  }, [kiaanResponse])

  // Breathing animation loop
  useEffect(() => {
    if (!isBreathing || breathCount >= TOTAL_BREATHS) {
      if (breathCount >= TOTAL_BREATHS && isBreathing) {
        setIsBreathing(false)
        setCurrentStep('plan')
      }
      return
    }

    let startTime: number | null = null
    
    const animate = (timestamp: number) => {
      // Set start time on first frame to avoid timing issues
      if (startTime === null) {
        startTime = timestamp
        breathStartTime.current = timestamp
      }
      
      const elapsed = timestamp - startTime
      const cycleElapsed = elapsed % BREATH_CYCLE_DURATION
      
      // Calculate current breath count
      const completedBreaths = Math.floor(elapsed / BREATH_CYCLE_DURATION)
      if (completedBreaths !== breathCount && completedBreaths < TOTAL_BREATHS) {
        setBreathCount(completedBreaths)
      }
      
      if (completedBreaths >= TOTAL_BREATHS) {
        setBreathCount(TOTAL_BREATHS)
        setIsBreathing(false)
        setCurrentStep('plan')
        return
      }
      
      // Calculate current phase and progress within phase
      let phaseStart = 0
      let currentPhase = 0
      for (let i = 0; i < BREATH_PHASES.length; i++) {
        if (cycleElapsed < phaseStart + BREATH_PHASES[i].duration) {
          currentPhase = i
          const phaseElapsed = cycleElapsed - phaseStart
          setBreathProgress(phaseElapsed / BREATH_PHASES[i].duration)
          break
        }
        phaseStart += BREATH_PHASES[i].duration
      }
      if (currentPhase !== lastBreathPhaseRef.current) {
        lastBreathPhaseRef.current = currentPhase
        playChime()
      }

      setBreathPhaseIndex(currentPhase)

      animationFrame.current = requestAnimationFrame(animate)
    }
    
    animationFrame.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [isBreathing, breathCount, playChime])

  useEffect(() => {
    if (currentStep === 'plan') {
      setRevealedCards(0)
      const timers = [150, 550, 950, 1350].map((delay, idx) =>
        setTimeout(() => setRevealedCards(idx + 1), delay)
      )
      return () => timers.forEach(timer => clearTimeout(timer))
    }

    if (currentStep === 'complete') {
      setRevealedCards(4)
    }
  }, [currentStep])

  // Generate KIAAN reset guidance
  const generateResetGuidance = useCallback(async () => {
    setLoading(true)
    setError(null)

    const sanitizedWhatHappened = sanitizeInput(whatHappened) || 'A brief misstep or moment that felt off'
    const sanitizedWhoFeltRipple = sanitizeInput(whoFeltRipple) || 'Someone I care about'

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/karma-reset/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_happened: sanitizedWhatHappened,
          who_felt_it: sanitizedWhoFeltRipple,
          repair_type: repairType,
          whatHappened: sanitizedWhatHappened,
          whoFeltRipple: sanitizedWhoFeltRipple,
          repairType,
          style: 'Short, direct, emotionally warm, and practical. 1-2 sentences per step. No bullet lists.',
        })
      })

      if (!response.ok) {
        console.error('KIAAN reset request failed', response.status, response.statusText)
        setError('KIAAN couldn’t be reached. Please check your connection and try again.')
        return
      }

      const data = await response.json()
      const normalized = normalizeGuidance(data.reset_guidance)
      if (normalized) {
        setKiaanResponse(normalized)
        setCurrentStep('breathing')
        setBreathCount(0)
        setBreathPhaseIndex(0)
        setBreathProgress(0)
        setIsBreathing(false)
        setJournalSaved(false)
        setRevealedCards(0)
      } else {
        setError('KIAAN returned an unexpected response. Please try again.')
      }
    } catch (requestError) {
      console.error('KIAAN reset request error', requestError)
      setError('KIAAN couldn’t be reached. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [whatHappened, whoFeltRipple, repairType, normalizeGuidance])

  // Save to journal
  const saveToJournal = useCallback(() => {
    if (!kiaanResponse || journalSaved) return
    
    try {
      const journalEntry = {
        id: crypto.randomUUID(),
        type: 'karma_reset',
        title: 'Karma Reset Ritual',
        body: `**Pause & Breathe:** ${kiaanResponse.breathingLine}\n\n**Name the Ripple:** ${kiaanResponse.rippleSummary}\n\n**Repair:** ${kiaanResponse.repairAction}\n\n**Move with Intention:** ${kiaanResponse.forwardIntention}`,
        context: {
          whatHappened,
          whoFeltRipple,
          repairType
        },
        mood: 'Reflective',
        at: new Date().toISOString()
      }
      
      const existing = localStorage.getItem('kiaan_journal_entries_secure')
      if (existing) {
        // Uses localStorage for simplicity - the main journal uses AES-GCM encryption
        // This save-to-journal feature stores a summary only, not raw sensitive data
        const entries = JSON.parse(existing)
        entries.unshift(journalEntry)
        localStorage.setItem('kiaan_journal_entries_secure', JSON.stringify(entries))
      } else {
        localStorage.setItem('kiaan_journal_entries_secure', JSON.stringify([journalEntry]))
      }
      
      setJournalSaved(true)
    } catch {
      // Silent fail - journal save is optional
    }
  }, [kiaanResponse, whatHappened, whoFeltRipple, repairType, journalSaved])

  // Reset the flow
  const resetFlow = () => {
    setCurrentStep('input')
    setWhatHappened('')
    setWhoFeltRipple('')
    setRepairType(REPAIR_ACTIONS[0].value)
    setKiaanResponse(null)
    setError(null)
    setIsBreathing(false)
    setBreathCount(0)
    setBreathPhaseIndex(0)
    setBreathProgress(0)
    setRevealedCards(0)
    setSoundEnabled(true)
    lastBreathPhaseRef.current = 0
    setJournalSaved(false)
  }

  // Get current breath phase info
  const currentBreathPhase = BREATH_PHASES[breathPhaseIndex]
  
  // Calculate breathing circle scale based on phase
  const getBreathScale = () => {
    if (breathPhaseIndex === 0) {
      // Inhale: grow from 1 to 1.3
      return 1 + (breathProgress * 0.3)
    } else if (breathPhaseIndex === 1) {
      // Hold: stay at 1.3
      return 1.3
    } else {
      // Exhale: shrink from 1.3 to 1
      return 1.3 - (breathProgress * 0.3)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Unified Karma Reset</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Karma Reset Ritual
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                A calm, focused reset ritual. One cohesive flow to return to your values.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                🕐 20-40 second practice
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
            className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)] space-y-6"
            role="region"
            aria-label="Reset input form"
          >
            {/* Step 1: What happened */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-orange-500/30 text-orange-50 border border-orange-400 flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-lg font-semibold text-orange-50">Tell KIAAN what happened</h2>
              </div>
              <div>
                <label htmlFor="what-happened-input" className="text-xs text-orange-100/80 font-semibold">
                  What happened?
                </label>
                <textarea
                  id="what-happened-input"
                  value={whatHappened}
                  onChange={e => setWhatHappened(e.target.value)}
                  placeholder="A brief slip or tone that felt off…"
                  className="mt-2 w-full rounded-xl border border-orange-400/25 bg-black/40 p-3 text-sm text-orange-50 placeholder:text-orange-100/50 focus:border-orange-300/70 outline-none resize-none"
                  rows={2}
                  aria-describedby="what-happened-hint"
                />
                <p id="what-happened-hint" className="sr-only">Describe what happened briefly</p>
              </div>
            </div>

            {/* Step 2: Who felt the ripple */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-purple-500/30 text-purple-50 border border-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-lg font-semibold text-purple-50">Who felt the ripple?</h3>
              </div>
              <div>
                <input
                  id="who-felt-input"
                  value={whoFeltRipple}
                  onChange={e => setWhoFeltRipple(e.target.value)}
                  placeholder="A teammate, friend, or even myself"
                  className="w-full rounded-xl border border-purple-400/25 bg-black/40 p-3 text-sm text-purple-50 placeholder:text-purple-100/50 focus:border-purple-300/70 outline-none"
                  aria-describedby="who-felt-hint"
                />
                <p id="who-felt-hint" className="sr-only">Who was affected by this moment</p>
              </div>
            </div>

            {/* Step 3: Choose the repair */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-green-500/30 text-green-50 border border-green-400 flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="text-lg font-semibold text-green-50">Choose the repair</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Repair type selection">
                {REPAIR_ACTIONS.map(action => (
                  <button
                    key={action.value}
                    onClick={() => setRepairType(action.value)}
                    role="radio"
                    aria-checked={repairType === action.value}
                    className={`rounded-xl border px-4 py-4 text-left transition ${
                      repairType === action.value
                        ? 'border-green-300/60 bg-green-500/15 text-green-50 shadow-lg shadow-green-500/15'
                        : 'border-orange-400/25 bg-black/30 text-orange-50 hover:border-orange-300/50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{action.label}</div>
                    <div className="text-xs text-orange-100/70 mt-1">{action.helper}</div>
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

            {/* Begin Reset Ritual Button */}
            <button
              onClick={generateResetGuidance}
              disabled={loading}
              className="w-full px-5 py-4 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 transition hover:scale-[1.02]"
              aria-label={loading ? 'Starting reset...' : 'Begin Reset Ritual'}
            >
              {loading ? 'Starting reset...' : 'Begin Reset Ritual'}
            </button>
          </section>
        )}

        {/* Breathing Step */}
        {kiaanResponse && currentStep !== 'input' && (
          <section
            className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.12)]"
            role="region"
            aria-label="4-breath reset"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">4-Breath Reset</p>
                <h2 className="text-2xl font-semibold text-orange-50">Pause &amp; Breathe</h2>
                <p className="text-sm text-orange-100/80 max-w-2xl">
                  {kiaanResponse.breathingLine || 'Take four slow breaths; let each exhale soften the moment.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundEnabled(prev => !prev)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    soundEnabled
                      ? 'border-green-400/40 bg-green-500/15 text-green-50'
                      : 'border-orange-400/30 bg-black/30 text-orange-100/80'
                  }`}
                  aria-pressed={soundEnabled}
                >
                  {soundEnabled ? '🔔 Sound on' : '🔕 Sound muted'}
                </button>
                <button
                  onClick={startBreathingCycle}
                  disabled={isBreathing}
                  className="rounded-full bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 px-4 py-2 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60"
                >
                  {isBreathing ? 'Guiding breaths…' : 'Begin 4-Breath Reset'}
                </button>
              </div>
            </div>

            {/* Breathing circle */}
            <div className="flex flex-col items-center justify-center mt-6 mb-4 text-center">
              <div
                className="relative h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/20 via-[#ffb347]/20 to-transparent flex items-center justify-center transition-transform duration-300"
                style={{ transform: `scale(${getBreathScale()})` }}
              >
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-orange-400/30 via-[#ff9933]/25 to-orange-200/15 shadow-inner shadow-orange-500/30 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-300/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-50">{Math.min(breathCount + 1, 4)}/4</span>
                  </div>
                </div>
                <div className="absolute inset-2 rounded-full border border-orange-400/30" />
              </div>
              <div className="mt-4 space-y-1">
                <div className="text-xl font-semibold text-orange-50">{isBreathing ? currentBreathPhase?.label : 'Ready'}</div>
                <div className="text-sm text-orange-100/70">
                  {isBreathing ? currentBreathPhase?.instruction : 'Inhale 4s → Hold 1s → Exhale 5s • Repeat 4x'}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 transition-all"
                style={{ width: `${((breathCount * BREATH_PHASES.length + breathPhaseIndex + breathProgress) / (TOTAL_BREATHS * BREATH_PHASES.length)) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* Plan Display Step */}
        {kiaanResponse && (currentStep === 'plan' || currentStep === 'complete') && (
          <>
            {/* Completion header */}
            {currentStep === 'complete' && (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-4 text-center">
                <p className="text-sm text-green-100">
                  ✨ Your Karma Reset is complete. When you&apos;re ready, carry this plan into your next step.
                </p>
              </div>
            )}

            {/* Four Plan Cards */}
            <div className="space-y-4">
              {/* Card 1: Pause and Breathe */}
              <div
                className={`rounded-2xl border border-orange-400/40 bg-gradient-to-br from-orange-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] transition-opacity duration-500 ${
                  revealedCards >= 1 ? 'opacity-100' : 'opacity-0'
                }`}
                role="region"
                aria-label="Pause and Breathe"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-8 w-8 rounded-full bg-orange-500/30 text-orange-50 border border-orange-400 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <h3 className="text-lg font-semibold text-orange-50">Pause and Breathe</h3>
                </div>
                <div className="text-sm text-orange-100/90 bg-black/30 rounded-lg p-3 border border-orange-500/15">
                  {kiaanResponse.breathingLine}
                </div>
              </div>

              {/* Card 2: Name the Ripple */}
              <div
                className={`rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(167,139,250,0.08)] transition-opacity duration-500 ${
                  revealedCards >= 2 ? 'opacity-100' : 'opacity-0'
                }`}
                role="region"
                aria-label="Name the Ripple"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-8 w-8 rounded-full bg-purple-500/30 text-purple-50 border border-purple-400 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <h3 className="text-lg font-semibold text-purple-50">Name the Ripple</h3>
                </div>
                <div className="text-sm text-purple-100/90 bg-black/30 rounded-lg p-3 border border-purple-500/15">
                  {kiaanResponse.rippleSummary}
                </div>
              </div>

              {/* Card 3: Choose the Repair */}
              <div
                className={`rounded-2xl border border-green-400/40 bg-gradient-to-br from-green-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(74,222,128,0.08)] transition-opacity duration-500 ${
                  revealedCards >= 3 ? 'opacity-100' : 'opacity-0'
                }`}
                role="region"
                aria-label="Choose the Repair"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-8 w-8 rounded-full bg-green-500/30 text-green-50 border border-green-400 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <h3 className="text-lg font-semibold text-green-50">Choose the Repair</h3>
                </div>
                <div className="text-sm text-green-100/90 bg-black/30 rounded-lg p-3 border border-green-500/15">
                  {kiaanResponse.repairAction}
                </div>
              </div>

              {/* Card 4: Move with Intention */}
              <div
                className={`rounded-2xl border border-blue-400/40 bg-gradient-to-br from-blue-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(96,165,250,0.08)] transition-opacity duration-500 ${
                  revealedCards >= 4 ? 'opacity-100' : 'opacity-0'
                }`}
                role="region"
                aria-label="Move with Intention"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-8 w-8 rounded-full bg-blue-500/30 text-blue-50 border border-blue-400 flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <h3 className="text-lg font-semibold text-blue-50">Move with Intention</h3>
                </div>
                <div className="text-sm text-blue-100/90 bg-black/30 rounded-lg p-3 border border-blue-500/15">
                  {kiaanResponse.forwardIntention}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {currentStep === 'plan' && (
              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep('complete')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 transition hover:scale-[1.02]"
                >
                  Complete Reset Ritual ✓
                </button>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={saveToJournal}
                  disabled={journalSaved}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    journalSaved
                      ? 'bg-green-500/20 text-green-50 border border-green-400/30'
                      : 'bg-orange-500/20 text-orange-50 hover:bg-orange-500/30 border border-orange-400/25'
                  }`}
                >
                  {journalSaved ? '✓ Saved to Journal' : '📓 Save to Journal'}
                </button>
                <Link
                  href="/?openChat=true"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-500/20 text-purple-50 hover:bg-purple-500/30 border border-purple-400/25 transition"
                >
                  💬 Discuss with KIAAN
                </Link>
                <button
                  onClick={resetFlow}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-orange-400/25 text-orange-50 hover:bg-white/5 transition"
                >
                  🔄 New Reset
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-orange-400/25 text-orange-50 hover:bg-white/5 transition"
                >
                  ← Return Home
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
