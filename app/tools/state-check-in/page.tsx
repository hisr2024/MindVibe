'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type MoodEntry = {
  mood: string
  note: string
  timestamp: string
}

const moods = [
  { label: 'Peaceful', emoji: '🔵', color: 'from-blue-400 to-sky-400' },
  { label: 'Happy', emoji: '🟢', color: 'from-green-400 to-emerald-400' },
  { label: 'Neutral', emoji: '🟡', color: 'from-yellow-400 to-amber-400' },
  { label: 'Anxious', emoji: '🔴', color: 'from-red-400 to-rose-400' },
  { label: 'Sad', emoji: '🟣', color: 'from-purple-400 to-violet-400' },
  { label: 'Other', emoji: '⚪', color: 'from-slate-400 to-gray-400' },
]

const moodResponses: Record<string, string> = {
  'Peaceful': "Wonderful to see you feeling calm. Hold onto this moment of tranquility. 💙",
  'Happy': "It's beautiful when joy visits. Let it linger. ✨",
  'Neutral': "Steady is good. You're present, and that matters. 🌿",
  'Anxious': "Anxiety is temporary. Take a slow breath—I'm here with you. 🌊",
  'Sad': "Sadness is valid. You're not alone in this feeling. 💙",
  'Other': "Thank you for checking in. Every feeling is valid. 🌟",
}

export default function StateCheckInPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [logged, setLogged] = useState(false)
  const [entries, setEntries] = useState<MoodEntry[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mood_check_ins')
        if (stored) {
          setEntries(JSON.parse(stored))
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [])

  function handleLog() {
    if (!selectedMood) return

    const entry: MoodEntry = {
      mood: selectedMood,
      note: note.trim(),
      timestamp: new Date().toISOString()
    }

    const updatedEntries = [entry, ...entries].slice(0, 50)
    setEntries(updatedEntries)

    try {
      localStorage.setItem('mood_check_ins', JSON.stringify(updatedEntries))
    } catch {
      // Ignore storage errors
    }

    setLogged(true)
  }

  function handleReset() {
    setSelectedMood(null)
    setNote('')
    setLogged(false)
  }

  // Calculate insights
  const recentEntries = entries.slice(0, 7)
  const moodCounts = recentEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1
    return acc
  }, {})
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                State Check-In
              </h1>
              <p className="text-sm text-orange-100/70 mt-1">Log your current mood</p>
            </div>
            <Link href="/" className="text-sm text-orange-100/60 hover:text-orange-200 transition">
              ← Home
            </Link>
          </div>
        </header>

        {!logged ? (
          <>
            {/* Mood Selector */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h2 className="text-lg font-semibold text-orange-50 mb-4">How are you feeling?</h2>
              <div className="grid grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setSelectedMood(mood.label)}
                    className={`flex flex-col items-center gap-2 rounded-xl p-4 border transition ${
                      selectedMood === mood.label
                        ? 'border-orange-400/60 bg-gradient-to-br from-orange-500/20 to-transparent shadow-lg shadow-orange-500/20'
                        : 'border-orange-500/15 bg-black/40 hover:border-orange-400/40'
                    }`}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs font-medium text-orange-100/80">{mood.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Quick Note */}
            <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-2">
                Quick note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-24 rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-3 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
              />
            </section>

            {/* Log Button */}
            <button
              onClick={handleLog}
              disabled={!selectedMood}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.01]"
            >
              Log Check-In
            </button>
          </>
        ) : (
          <>
            {/* Success State */}
            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <span className="text-5xl block mb-3">✓</span>
              <h2 className="text-xl font-semibold text-emerald-50 mb-2">Logged Successfully</h2>
              {selectedMood && (
                <p className="text-sm text-emerald-100/80">{moodResponses[selectedMood]}</p>
              )}
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 text-sm font-medium hover:bg-white/15 transition"
              >
                Log Another
              </button>
            </section>
          </>
        )}

        {/* Insights */}
        {entries.length > 0 && (
          <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h2 className="text-lg font-semibold text-orange-50 mb-3">Your Insights</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-black/40 border border-orange-500/15 p-4">
                <p className="text-xs text-orange-100/60 mb-1">Recent entries</p>
                <p className="text-2xl font-bold text-orange-50">{recentEntries.length}</p>
              </div>
              <div className="rounded-xl bg-black/40 border border-orange-500/15 p-4">
                <p className="text-xs text-orange-100/60 mb-1">Top mood</p>
                <p className="text-2xl font-bold text-orange-50">{topMood || '—'}</p>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-orange-100/70">Recent check-ins</p>
              {recentEntries.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-black/30 border border-orange-500/10 p-3">
                  <span className="text-xl">{moods.find(m => m.label === entry.mood)?.emoji || '😐'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-50">{entry.mood}</p>
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
