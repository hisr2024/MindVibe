'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type TriggerEntry = {
  trigger: string
  intensity: number
  timestamp: string
  note?: string
}

const intensityLevels = [
  { value: 1, label: 'Mild', color: 'bg-green-500' },
  { value: 2, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 3, label: 'Strong', color: 'bg-orange-500' },
  { value: 4, label: 'Intense', color: 'bg-red-500' },
  { value: 5, label: 'Overwhelming', color: 'bg-purple-500' },
]

export default function TriggerFactorPage() {
  const [trigger, setTrigger] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [note, setNote] = useState('')
  const [logged, setLogged] = useState(false)
  const [entries, setEntries] = useState<TriggerEntry[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('trigger_entries')
        if (stored) {
          setEntries(JSON.parse(stored))
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [])

  function handleLog() {
    const trimmedTrigger = trigger.trim()
    if (!trimmedTrigger) return

    const entry: TriggerEntry = {
      trigger: trimmedTrigger,
      intensity,
      timestamp: new Date().toISOString(),
      note: note.trim() || undefined
    }

    const updatedEntries = [entry, ...entries].slice(0, 50)
    setEntries(updatedEntries)

    try {
      localStorage.setItem('trigger_entries', JSON.stringify(updatedEntries))
    } catch {
      // Ignore storage errors
    }

    setLogged(true)
  }

  function handleReset() {
    setTrigger('')
    setIntensity(3)
    setNote('')
    setLogged(false)
  }

  // Calculate pattern insights
  const recentEntries = entries.slice(0, 10)
  const avgIntensity = recentEntries.length > 0
    ? (recentEntries.reduce((sum, e) => sum + e.intensity, 0) / recentEntries.length).toFixed(1)
    : '—'
  
  // Find most common trigger words
  const triggerWords = entries.slice(0, 20).flatMap(e => 
    e.trigger.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  )
  const wordCounts: Record<string, number> = {}
  triggerWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })
  const topPatterns = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Trigger Factor
              </h1>
              <p className="text-sm text-orange-100/70 mt-1">Identify and track your triggers</p>
            </div>
            <Link href="/" className="text-sm text-orange-100/60 hover:text-orange-200 transition">
              ← Home
            </Link>
          </div>
        </header>

        {!logged ? (
          <>
            {/* Trigger Input */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-2">
                What triggered you?
              </label>
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Describe the trigger..."
                className="w-full rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 px-4 py-3 focus:ring-2 focus:ring-orange-400/50 outline-none"
              />
            </section>

            {/* Intensity Selector */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h2 className="text-sm font-semibold text-orange-100 mb-4">Intensity Level</h2>
              <div className="grid grid-cols-5 gap-2">
                {intensityLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setIntensity(level.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl p-3 border transition ${
                      intensity === level.value
                        ? 'border-orange-400/60 bg-gradient-to-br from-orange-500/20 to-transparent'
                        : 'border-orange-500/15 bg-black/40 hover:border-orange-400/40'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${level.color}`} />
                    <span className="text-xs text-orange-100/80">{level.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Optional Note */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-2">
                Additional notes (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any context or thoughts..."
                className="w-full h-20 rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-3 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
              />
            </section>

            {/* Log Button */}
            <button
              onClick={handleLog}
              disabled={!trigger.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.01]"
            >
              Log Trigger
            </button>
          </>
        ) : (
          <>
            {/* Success State */}
            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <span className="text-5xl block mb-3">✓</span>
              <h2 className="text-xl font-semibold text-emerald-50 mb-2">Trigger Logged</h2>
              <p className="text-sm text-emerald-100/80">
                Recognizing your triggers is the first step to managing them.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/15 transition"
              >
                Log Another
              </button>
            </section>
          </>
        )}

        {/* Pattern Insights */}
        {entries.length > 0 && (
          <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h2 className="text-lg font-semibold text-orange-50 mb-3">Pattern Insights</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-black/40 border border-orange-500/15 p-4">
                <p className="text-xs text-orange-100/60 mb-1">Logged triggers</p>
                <p className="text-2xl font-bold text-orange-50">{entries.length}</p>
              </div>
              <div className="rounded-xl bg-black/40 border border-orange-500/15 p-4">
                <p className="text-xs text-orange-100/60 mb-1">Avg intensity</p>
                <p className="text-2xl font-bold text-orange-50">{avgIntensity}</p>
              </div>
            </div>

            {topPatterns.length > 0 && (
              <div className="rounded-xl bg-black/30 border border-orange-500/10 p-4">
                <p className="text-xs text-orange-100/60 mb-2">Common patterns</p>
                <div className="flex flex-wrap gap-2">
                  {topPatterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="px-3 py-1 rounded-full bg-orange-500/20 text-sm text-orange-100"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Recent Triggers */}
        {entries.length > 0 && (
          <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h2 className="text-lg font-semibold text-orange-50 mb-3">Recent Triggers</h2>
            <div className="space-y-2">
              {entries.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-black/30 border border-orange-500/10 p-3">
                  <span className={`h-3 w-3 rounded-full ${intensityLevels[entry.intensity - 1]?.color || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-50 truncate">{entry.trigger}</p>
                    {entry.note && (
                      <p className="text-xs text-orange-100/60 truncate">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-orange-100/40">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
