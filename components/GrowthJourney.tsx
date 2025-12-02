'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type MoodCheckIn = {
  mood: string
  timestamp: string
}

type JournalEntry = {
  id: string
  title: string
  body: string
  mood: string
  at: string
}

const MOOD_CHECK_INS_KEY = 'mood_check_ins'
const JOURNAL_ENTRY_STORAGE = 'kiaan_journal_entries_secure'
const JOURNAL_KEY_STORAGE = 'kiaan_journal_key'

// Mood categories
const positiveMoods = new Set(['Peaceful', 'Happy', 'Grateful', 'Open', 'Charged', 'Determined'])
const challengingMoods = new Set(['Anxious', 'Sad', 'Heavy', 'Worried', 'Anger', 'Depressed', 'Loneliness', 'Tired', 'Tender'])

// Encryption helpers (matching existing implementation)
function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function getEncryptionKey() {
  const cached = typeof window !== 'undefined' ? window.localStorage.getItem(JOURNAL_KEY_STORAGE) : null
  if (!cached) return null
  const rawKey = fromBase64(cached)
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt'])
}

async function decryptText(payload: string) {
  const [ivPart, dataPart] = payload.split(':')
  if (!ivPart || !dataPart) return ''
  const iv = fromBase64(ivPart)
  const encrypted = fromBase64(dataPart)
  const key = await getEncryptionKey()
  if (!key) return ''
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

type GrowthAnalytics = {
  mostPresentMood: { mood: string; emoji: string } | null
  positiveMoments: number
  challengingDays: number
  emotionalTrend: 'improving' | 'steady' | 'needs_care' | null
  journalStreak: number
}

function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    'Peaceful': '🙏',
    'Happy': '😊',
    'Neutral': '😐',
    'Charged': '⚡',
    'Open': '🌤️',
    'Grateful': '🌿',
    'Reflective': '🪞',
    'Determined': '🔥',
    'Tender': '💙',
    'Tired': '😴',
    'Anxious': '😰',
    'Heavy': '🌧️',
    'Angry': '🔥',
    'Anger': '🔥',
    'Worried': '💭',
    'Sad': '💙',
    'Loneliness': '🤝',
    'Depressed': '💙',
  }
  return emojiMap[mood] || '🌿'
}

export function GrowthJourney() {
  const [analytics, setAnalytics] = useState<GrowthAnalytics>({
    mostPresentMood: null,
    positiveMoments: 0,
    challengingDays: 0,
    emotionalTrend: null,
    journalStreak: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function calculateAnalytics() {
      if (typeof window === 'undefined') return

      const now = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(now.getDate() - 13)
      fourteenDaysAgo.setHours(0, 0, 0, 0)

      // Get mood check-ins
      let moodCheckIns: MoodCheckIn[] = []
      try {
        const stored = localStorage.getItem(MOOD_CHECK_INS_KEY)
        if (stored) {
          moodCheckIns = JSON.parse(stored)
        }
      } catch {
        // Ignore errors
      }

      // Get journal entries (encrypted)
      let journalEntries: JournalEntry[] = []
      try {
        const stored = localStorage.getItem(JOURNAL_ENTRY_STORAGE)
        if (stored) {
          const decrypted = await decryptText(stored)
          if (decrypted) {
            journalEntries = JSON.parse(decrypted)
          }
        }
      } catch {
        // Ignore errors
      }

      // Filter to last 7 days
      const thisWeekMoods = moodCheckIns.filter(m => new Date(m.timestamp) >= sevenDaysAgo)
      const thisWeekJournals = journalEntries.filter(e => new Date(e.at) >= sevenDaysAgo)
      
      // Last week (7-14 days ago) for comparison
      const lastWeekMoods = moodCheckIns.filter(m => {
        const d = new Date(m.timestamp)
        return d >= fourteenDaysAgo && d < sevenDaysAgo
      })
      const lastWeekJournals = journalEntries.filter(e => {
        const d = new Date(e.at)
        return d >= fourteenDaysAgo && d < sevenDaysAgo
      })

      // 1. Most Present Mood This Week
      const allMoods = [...thisWeekMoods.map(m => m.mood), ...thisWeekJournals.map(j => j.mood)]
      const moodCounts: Record<string, number> = {}
      allMoods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1
      })
      const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])
      const topMood = sortedMoods[0]?.[0] || null

      // 2. Positive Moments Logged
      const positiveCheckIns = thisWeekMoods.filter(m => positiveMoods.has(m.mood)).length
      const positiveJournals = thisWeekJournals.filter(j => positiveMoods.has(j.mood)).length
      const positiveMoments = positiveCheckIns + positiveJournals

      // 3. Challenging/Tender Days
      const challengingCheckIns = thisWeekMoods.filter(m => challengingMoods.has(m.mood)).length
      const challengingJournals = thisWeekJournals.filter(j => challengingMoods.has(j.mood)).length
      const challengingDays = challengingCheckIns + challengingJournals

      // 4. Emotional Trend (compare this week vs last week)
      const thisWeekPositive = positiveMoments
      const thisWeekNegative = challengingDays
      const lastWeekPositive = lastWeekMoods.filter(m => positiveMoods.has(m.mood)).length +
                               lastWeekJournals.filter(j => positiveMoods.has(j.mood)).length
      const lastWeekNegative = lastWeekMoods.filter(m => challengingMoods.has(m.mood)).length +
                               lastWeekJournals.filter(j => challengingMoods.has(j.mood)).length

      let emotionalTrend: 'improving' | 'steady' | 'needs_care' | null = null
      if (thisWeekPositive + thisWeekNegative > 0 || lastWeekPositive + lastWeekNegative > 0) {
        const thisWeekScore = thisWeekPositive - thisWeekNegative
        const lastWeekScore = lastWeekPositive - lastWeekNegative
        const diff = thisWeekScore - lastWeekScore
        if (diff > 1) {
          emotionalTrend = 'improving'
        } else if (diff < -1) {
          emotionalTrend = 'needs_care'
        } else {
          emotionalTrend = 'steady'
        }
      }

      // 5. Journal Streak
      let streak = 0
      const journalDates = journalEntries
        .map(e => {
          const d = new Date(e.at)
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        })
        .sort((a, b) => b - a) // Sort newest first

      const uniqueDates = [...new Set(journalDates)]
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let checkDate = today.getTime()
      for (const date of uniqueDates) {
        if (date === checkDate) {
          streak++
          checkDate -= 24 * 60 * 60 * 1000 // Go back one day
        } else if (date < checkDate) {
          // Check if we missed yesterday but have today
          break
        }
      }

      setAnalytics({
        mostPresentMood: topMood ? { mood: topMood, emoji: getMoodEmoji(topMood) } : null,
        positiveMoments,
        challengingDays,
        emotionalTrend,
        journalStreak: streak,
      })
      setIsLoading(false)
    }

    calculateAnalytics()
  }, [])

  const getTrendDisplay = () => {
    switch (analytics.emotionalTrend) {
      case 'improving':
        return { text: 'Improving', icon: '↑', color: 'text-emerald-400' }
      case 'steady':
        return { text: 'Steady', icon: '→', color: 'text-orange-300' }
      case 'needs_care':
        return { text: 'Needs care', icon: '↓', color: 'text-rose-300' }
      default:
        return { text: 'Check in to track', icon: '○', color: 'text-orange-100/60' }
    }
  }

  const trend = getTrendDisplay()

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0c10] via-[#0f100c] to-[#0b0b0f] border border-emerald-500/15 p-6 md:p-7 space-y-5 shadow-[0_20px_80px_rgba(52,211,153,0.12)]">
      {/* Background glow effects */}
      <div className="absolute -right-6 -top-8 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-transparent blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-gradient-to-tr from-[#1f2017]/60 via-emerald-500/10 to-transparent blur-3xl" />

      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-emerald-100/80">Track your wellness</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
            Your Growth Journey
          </h2>
          <p className="text-sm text-emerald-100/70 max-w-2xl mt-1">
            Your Karmic Tree reflects your wellness journey. It grows as you check in, journal, and grow with KIAAN.
          </p>
        </div>
        <div className="text-xs text-emerald-100/70 bg-white/5 border border-emerald-500/20 rounded-full px-3 py-1">
          Weekly overview
        </div>
      </div>

      {/* Growth Analysis Overview */}
      <div className="relative rounded-2xl border border-emerald-500/20 bg-black/40 p-4 shadow-[0_10px_30px_rgba(52,211,153,0.1)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-semibold text-emerald-50">Growth Analysis Overview</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 rounded-full bg-emerald-400/60 animate-pulse" />
          </div>
        ) : (
          <ul className="space-y-3">
            {/* Most Present Mood */}
            <li className="flex items-center gap-3 text-sm">
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-100/80">Most present mood:</span>
              <span className="font-semibold text-emerald-50">
                {analytics.mostPresentMood ? (
                  <>
                    {analytics.mostPresentMood.emoji} {analytics.mostPresentMood.mood}
                  </>
                ) : (
                  <span className="text-emerald-100/60">Check in to track</span>
                )}
              </span>
            </li>

            {/* Positive Moments */}
            <li className="flex items-center gap-3 text-sm">
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-100/80">Positive moments:</span>
              <span className="font-semibold text-emerald-50">{analytics.positiveMoments}</span>
            </li>

            {/* Challenging Days */}
            <li className="flex items-center gap-3 text-sm">
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-100/80">Challenging days:</span>
              <span className="font-semibold text-emerald-50">{analytics.challengingDays}</span>
            </li>

            {/* Emotional Trend */}
            <li className="flex items-center gap-3 text-sm">
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-100/80">Emotional trend:</span>
              <span className={`font-semibold ${trend.color}`}>
                {trend.text} {trend.icon}
              </span>
            </li>

            {/* Journal Streak */}
            <li className="flex items-center gap-3 text-sm">
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-100/80">Journal streak:</span>
              <span className="font-semibold text-emerald-50">
                {analytics.journalStreak > 0 ? (
                  <>
                    {analytics.journalStreak} day{analytics.journalStreak !== 1 ? 's' : ''} 🔥
                  </>
                ) : (
                  <span className="text-emerald-100/60">Start today!</span>
                )}
              </span>
            </li>
          </ul>
        )}
      </div>

      {/* View Karmic Tree Button */}
      <Link
        href="/karmic-tree"
        className="block w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 text-slate-950 font-semibold text-lg text-center shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition"
      >
        🌳 View Karmic Tree
      </Link>
    </section>
  )
}

export default GrowthJourney
