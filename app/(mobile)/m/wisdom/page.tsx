'use client'

/**
 * Mobile Wisdom Page
 *
 * Daily wisdom from the Bhagavad Gita with verse exploration,
 * curated collections, and KIAAN-powered wisdom insights.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Star,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

interface DailyVerse {
  chapter: number
  verse: number
  sanskrit: string
  translation: string
  commentary: string
  theme: string
}

// Curated wisdom themes
const WISDOM_THEMES = [
  { id: 'peace', label: 'Inner Peace', emoji: '🕊️', gradient: 'from-teal-500/15 to-cyan-500/15', border: 'border-teal-500/20' },
  { id: 'courage', label: 'Courage', emoji: '🦁', gradient: 'from-orange-500/15 to-red-500/15', border: 'border-orange-500/20' },
  { id: 'wisdom', label: 'Wisdom', emoji: '🧘', gradient: 'from-purple-500/15 to-indigo-500/15', border: 'border-purple-500/20' },
  { id: 'devotion', label: 'Devotion', emoji: '🙏', gradient: 'from-pink-500/15 to-rose-500/15', border: 'border-pink-500/20' },
  { id: 'action', label: 'Right Action', emoji: '⚡', gradient: 'from-amber-500/15 to-yellow-500/15', border: 'border-amber-500/20' },
  { id: 'detachment', label: 'Letting Go', emoji: '🍃', gradient: 'from-green-500/15 to-emerald-500/15', border: 'border-green-500/20' },
]

// Fallback verse when API is unavailable
const FALLBACK_VERSE: DailyVerse = {
  chapter: 2,
  verse: 47,
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
  translation: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.',
  commentary: 'This verse teaches us to focus on the effort, not the outcome. When we release attachment to results, we find freedom in every action.',
  theme: 'action',
}

export default function MobileWisdomPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [dailyVerse, setDailyVerse] = useState<DailyVerse>(FALLBACK_VERSE)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  // Fetch daily wisdom
  useEffect(() => {
    const fetchDailyWisdom = async () => {
      try {
        const response = await apiFetch('/api/kiaan/friend/daily-wisdom')
        if (response.ok) {
          const data = await response.json()
          if (data.verse || data.translation) {
            setDailyVerse({
              chapter: data.chapter || data.verse_ref?.chapter || 2,
              verse: data.verse_number || data.verse_ref?.verse || 47,
              sanskrit: data.sanskrit || data.original || FALLBACK_VERSE.sanskrit,
              translation: data.translation || data.meaning || FALLBACK_VERSE.translation,
              commentary: data.commentary || data.insight || FALLBACK_VERSE.commentary,
              theme: data.theme || 'wisdom',
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch daily wisdom:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDailyWisdom()
  }, [])

  // Copy verse to clipboard
  const handleCopy = useCallback(async () => {
    triggerHaptic('success')
    const text = `"${dailyVerse.translation}"\n\n— Bhagavad Gita ${dailyVerse.chapter}.${dailyVerse.verse}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }, [dailyVerse, triggerHaptic])

  // Toggle favorite
  const handleFavorite = useCallback(() => {
    triggerHaptic('success')
    setIsFavorited(!isFavorited)

    if (isAuthenticated) {
      apiFetch('/api/gita/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: dailyVerse.chapter,
          verse: dailyVerse.verse,
        }),
      }).catch(() => {
        // Silently fail - will sync later
      })
    }
  }, [dailyVerse, isAuthenticated, isFavorited, triggerHaptic])

  // Navigate to theme exploration
  const handleThemeSelect = useCallback((themeId: string) => {
    triggerHaptic('selection')
    setSelectedTheme(themeId)
    router.push(`/kiaan-vibe/gita?theme=${themeId}`)
  }, [router, triggerHaptic])

  // Navigate to full Gita explorer
  const handleExploreGita = useCallback(() => {
    triggerHaptic('selection')
    router.push('/kiaan-vibe/gita')
  }, [router, triggerHaptic])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch('/api/kiaan/friend/daily-wisdom')
      if (response.ok) {
        const data = await response.json()
        if (data.verse || data.translation) {
          setDailyVerse({
            chapter: data.chapter || data.verse_ref?.chapter || 2,
            verse: data.verse_number || data.verse_ref?.verse || 47,
            sanskrit: data.sanskrit || data.original || FALLBACK_VERSE.sanskrit,
            translation: data.translation || data.meaning || FALLBACK_VERSE.translation,
            commentary: data.commentary || data.insight || FALLBACK_VERSE.commentary,
            theme: data.theme || 'wisdom',
          })
        }
      }
    } catch (error) {
      console.error('Failed to refresh wisdom:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <MobileAppShell
      title="Wisdom"
      largeTitle
      enablePullToRefresh
      onRefresh={handleRefresh}
    >
      <div className="px-4 pb-safe space-y-6">
        {/* Daily Verse Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-teal-500/10 border border-orange-500/15">
            {/* Daily label */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Today&apos;s Wisdom
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Chapter {dailyVerse.chapter}, Verse {dailyVerse.verse}
              </span>
            </div>

            {/* Sanskrit text */}
            {dailyVerse.sanskrit && (
              <p className="text-base text-orange-300/80 font-serif italic mb-3 leading-relaxed">
                {dailyVerse.sanskrit}
              </p>
            )}

            {/* Translation */}
            <p className="text-base text-white leading-relaxed mb-3">
              &ldquo;{dailyVerse.translation}&rdquo;
            </p>

            {/* Commentary */}
            {dailyVerse.commentary && (
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {dailyVerse.commentary}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFavorite}
                className={`p-2.5 rounded-xl ${
                  isFavorited
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'bg-white/[0.06] text-slate-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCopy}
                className="p-2.5 rounded-xl bg-white/[0.06] text-slate-400"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('selection')
                  if (navigator.share) {
                    navigator.share({
                      title: 'MindVibe Wisdom',
                      text: `"${dailyVerse.translation}"\n\n— Bhagavad Gita ${dailyVerse.chapter}.${dailyVerse.verse}`,
                    }).catch(() => {})
                  }
                }}
                className="p-2.5 rounded-xl bg-white/[0.06] text-slate-400"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>

              <div className="flex-1" />

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic('selection')
                  router.push(`/kiaan-vibe/gita/${dailyVerse.chapter}/${dailyVerse.verse}`)
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 text-orange-400 text-xs font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Read More
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Wisdom Themes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3">Explore by Theme</h2>
          <div className="grid grid-cols-2 gap-3">
            {WISDOM_THEMES.map((theme, index) => (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThemeSelect(theme.id)}
                className={`p-4 rounded-2xl text-left bg-gradient-to-br ${theme.gradient} border ${theme.border}`}
              >
                <span className="text-2xl mb-2 block">{theme.emoji}</span>
                <p className="text-sm font-medium text-white">{theme.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Ask KIAAN about Wisdom */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic('selection')
              router.push('/m/kiaan')
            }}
            className="w-full p-4 rounded-2xl text-left bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Ask KIAAN</p>
                <p className="text-xs text-slate-400 mt-0.5">Get personalized wisdom for your situation</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </motion.button>
        </motion.section>

        {/* Explore Full Gita */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleExploreGita}
            className="w-full p-4 rounded-2xl text-left bg-white/[0.02] border border-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Explore the Bhagavad Gita</p>
                <p className="text-xs text-slate-400 mt-0.5">700+ verses across 18 chapters</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </motion.button>
        </motion.section>
      </div>
    </MobileAppShell>
  )
}
