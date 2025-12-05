'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const BREATHING_STEPS = [
  { phase: 'inhale', duration: 4, instruction: 'Breathe in slowly...' },
  { phase: 'hold', duration: 4, instruction: 'Hold gently...' },
  { phase: 'exhale', duration: 6, instruction: 'Release slowly...' },
  { phase: 'rest', duration: 2, instruction: 'Rest...' },
]

const GROUNDING_PROMPTS = [
  "Notice your feet on the ground.",
  "Feel your shoulders drop.",
  "Unclench your jaw.",
  "Soften your gaze.",
  "Notice five things you can see.",
  "Feel three textures around you.",
  "Listen to two sounds nearby.",
  "Take one more slow breath.",
]

export default function ClarityPausePage() {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(60)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [journalEntry, setJournalEntry] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)

  const currentStep = BREATHING_STEPS[currentStepIndex]
  const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100

  const handleComplete = useCallback(() => {
    setIsActive(false)
    setCompleted(true)
    
    // Save completion to localStorage
    if (typeof window !== 'undefined') {
      try {
        const completions = JSON.parse(localStorage.getItem('clarity_pause_completions') || '[]')
        completions.push({
          timestamp: new Date().toISOString(),
          duration: totalSeconds,
          journalEntry: journalEntry.trim() || null
        })
        localStorage.setItem('clarity_pause_completions', JSON.stringify(completions.slice(-50)))
      } catch {
        // Ignore storage errors
      }
    }
  }, [totalSeconds, journalEntry])

  useEffect(() => {
    if (!isActive || isPaused) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })

      setStepProgress((prev) => {
        const newProgress = prev + 1
        if (newProgress >= currentStep.duration) {
          setCurrentStepIndex((idx) => (idx + 1) % BREATHING_STEPS.length)
          return 0
        }
        return newProgress
      })

      // Change grounding prompt every 8 seconds
      if (timeRemaining % 8 === 0) {
        setPromptIndex((prev) => (prev + 1) % GROUNDING_PROMPTS.length)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, isPaused, currentStep.duration, timeRemaining, handleComplete])

  function handleStart() {
    setIsActive(true)
    setIsPaused(false)
    setCompleted(false)
    setTimeRemaining(totalSeconds)
    setCurrentStepIndex(0)
    setStepProgress(0)
    setPromptIndex(0)
    setJournalEntry('')
  }

  function handlePauseResume() {
    setIsPaused(!isPaused)
  }

  function handleStop() {
    setIsActive(false)
    setTimeRemaining(totalSeconds)
    setCurrentStepIndex(0)
    setStepProgress(0)
  }

  function handleReset() {
    setCompleted(false)
    setJournalEntry('')
    setTimeRemaining(totalSeconds)
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const phaseColors = {
    inhale: 'from-sky-400 to-cyan-400',
    hold: 'from-purple-400 to-violet-400',
    exhale: 'from-orange-400 to-amber-400',
    rest: 'from-emerald-400 to-teal-400'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Clarity Pause
              </h1>
              <p className="text-sm text-orange-100/70 mt-1">A guided breathing moment</p>
            </div>
            <Link href="/" className="text-sm text-orange-100/60 hover:text-orange-200 transition">
              ← Home
            </Link>
          </div>
        </header>

        {!isActive && !completed ? (
          <>
            {/* Duration Selector */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h2 className="text-lg font-semibold text-orange-50 mb-4">Select Duration</h2>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 120].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setTotalSeconds(seconds)}
                    className={`py-4 rounded-xl border font-semibold transition ${
                      totalSeconds === seconds
                        ? 'border-orange-400/60 bg-gradient-to-br from-orange-500/20 to-transparent text-orange-50'
                        : 'border-orange-500/20 bg-black/40 text-orange-100/70 hover:border-orange-400/40'
                    }`}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </button>
                ))}
              </div>
            </section>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-bold text-lg shadow-lg shadow-orange-500/25 transition hover:scale-[1.01]"
            >
              Start Pause
            </button>

            {/* Info */}
            <section className="rounded-2xl border border-orange-500/10 bg-[#0d0d10]/60 p-4">
              <p className="text-sm text-orange-100/60 leading-relaxed">
                This guided pause uses a 4-4-6-2 breathing pattern: inhale for 4 seconds, hold for 4, exhale for 6, then rest for 2. Combined with grounding prompts to help you find clarity.
              </p>
            </section>
          </>
        ) : isActive && !completed ? (
          <>
            {/* Active Session */}
            <section className="rounded-3xl border border-orange-500/20 bg-[#0d0d10]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.15)] text-center space-y-6">
              {/* Timer */}
              <div className="text-6xl font-bold text-orange-50 tabular-nums">
                {formatTime(timeRemaining)}
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Breathing Circle */}
              <div className="flex justify-center">
                <div
                  className={`relative rounded-full bg-gradient-to-br ${phaseColors[currentStep.phase as keyof typeof phaseColors]} transition-all duration-1000 ease-in-out flex items-center justify-center`}
                  style={{
                    width: currentStep.phase === 'inhale' ? '180px' : currentStep.phase === 'hold' ? '180px' : currentStep.phase === 'exhale' ? '100px' : '120px',
                    height: currentStep.phase === 'inhale' ? '180px' : currentStep.phase === 'hold' ? '180px' : currentStep.phase === 'exhale' ? '100px' : '120px',
                    boxShadow: `0 0 60px rgba(255, 179, 71, 0.3)`
                  }}
                >
                  <span className="text-slate-950 font-semibold text-sm uppercase tracking-wide">
                    {currentStep.phase}
                  </span>
                </div>
              </div>

              {/* Instruction */}
              <p className="text-xl text-orange-100/90">{currentStep.instruction}</p>

              {/* Grounding Prompt */}
              <div className="rounded-xl bg-black/40 border border-orange-500/20 p-4">
                <p className="text-sm text-orange-100/70">{GROUNDING_PROMPTS[promptIndex]}</p>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handlePauseResume}
                  className="px-6 py-3 rounded-xl border border-orange-500/30 text-orange-100 font-medium hover:bg-white/5 transition"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleStop}
                  className="px-6 py-3 rounded-xl border border-red-500/30 text-red-200 font-medium hover:bg-red-500/10 transition"
                >
                  Stop
                </button>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Completion State */}
            <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center space-y-4">
              <span className="text-6xl block">✨</span>
              <h2 className="text-2xl font-bold text-emerald-50">Pause Complete</h2>
              <p className="text-sm text-emerald-100/70">
                Well done. Take a moment to notice how you feel now.
              </p>
            </section>

            {/* Optional Journal Entry */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-2">
                Reflection (optional)
              </label>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How do you feel? Any insights?"
                className="w-full h-28 rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
              />
            </section>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25"
              >
                Another Pause
              </button>
              <Link
                href="/"
                className="flex-1 py-4 rounded-2xl border border-orange-500/30 text-orange-100 font-semibold text-center hover:bg-white/5 transition"
              >
                Done
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
