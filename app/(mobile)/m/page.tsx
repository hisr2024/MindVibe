'use client'

/**
 * Sacred Mobile Home Page — "The Sacred Court"
 *
 * The inner sanctum of Kiaanverse. The user arrives in the presence
 * of the Divine. Features the SAKHA Presence Card, quick sacred actions,
 * Today's Divine Insight, and recent conversations.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, RefreshCw, Globe } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileToolsOverlay } from '@/components/mobile/MobileToolsOverlay'
import { SakhaMandala } from '@/components/sacred/SakhaMandala'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredDivider } from '@/components/sacred/SacredDivider'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { VerseRevelation } from '@/components/sacred/VerseRevelation'
import { OmSymbol } from '@/components/sacred/icons/OmSymbol'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'

// Quick sacred action chips
const SACRED_ACTIONS = [
  { id: 'ask', label: 'Ask Sakha', href: '/m/kiaan' },
  { id: 'shloka', label: "Today's Shloka", href: '/m/wisdom' },
  { id: 'journey', label: 'My Journey', href: '/m/journeys' },
  { id: 'library', label: 'Wisdom Library', href: '/m/shlokas' },
]

// Mood options with sacred colors
const MOOD_OPTIONS = [
  { id: 'great', label: 'Great', emoji: '🙏', color: 'from-emerald-500/30 to-emerald-400/10', score: 2 },
  { id: 'good', label: 'Good', emoji: '☀️', color: 'from-[#D4A017]/30 to-[#D4A017]/10', score: 1 },
  { id: 'okay', label: 'Okay', emoji: '🕉️', color: 'from-[#1B4FBB]/30 to-[#1B4FBB]/10', score: 0 },
  { id: 'low', label: 'Low', emoji: '🪷', color: 'from-purple-500/30 to-indigo-400/10', score: -1 },
  { id: 'struggling', label: 'Seeking', emoji: '🙏', color: 'from-[#0E7490]/30 to-[#06B6D4]/10', score: -2 },
]

interface DashboardData {
  activeJourney?: {
    id: string
    title: string
    progress: number
    currentDay: number
    totalDays: number
  }
  streak: number
  todayMood?: string
  insightsCount: number
  journalEntries: number
}

interface DailyWisdom {
  sanskrit?: string
  transliteration?: string
  translation: string
  chapter: number
  verse: number
}

const FALLBACK_WISDOM: DailyWisdom = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
  transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
  translation: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.',
  chapter: 2,
  verse: 47,
}

export default function SacredMobileHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { triggerHaptic } = useHapticFeedback()
  const { language, config: langConfig } = useLanguage()

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    streak: 0,
    insightsCount: 0,
    journalEntries: 0,
  })
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [moodSaved, setMoodSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyWisdom, setDailyWisdom] = useState<DailyWisdom>(FALLBACK_WISDOM)
  const [hasError, setHasError] = useState(false)
  const [isToolsOverlayOpen, setIsToolsOverlayOpen] = useState(false)

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 5) return 'Late night'
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setHasError(false)
      const [dashboardRes, wisdomRes] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard'),
        apiFetch('/api/kiaan/friend/daily-wisdom'),
      ])

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        const data = await dashboardRes.value.json()
        setDashboardData({
          activeJourney: data.active_journey
            ? {
                id: data.active_journey.id,
                title: data.active_journey.title,
                progress: data.active_journey.progress || 0,
                currentDay: data.active_journey.current_day || data.active_journey.currentDay || 1,
                totalDays: data.active_journey.total_days || data.active_journey.totalDays || 14,
              }
            : undefined,
          streak: data.streak || 0,
          todayMood: data.today_mood || null,
          insightsCount: data.insights_count || 0,
          journalEntries: data.journal_entries || 0,
        })
        if (data.today_mood) setSelectedMood(data.today_mood)
      }

      if (wisdomRes.status === 'fulfilled' && wisdomRes.value.ok) {
        const data = await wisdomRes.value.json()
        if (data.translation || data.insight) {
          setDailyWisdom({
            sanskrit: data.sanskrit || data.sanskrit_text || undefined,
            transliteration: data.transliteration || undefined,
            translation: data.translation || data.insight || FALLBACK_WISDOM.translation,
            chapter: data.chapter || 2,
            verse: data.verse_number || data.verse || 47,
          })
        }
      }
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchDashboardData(), 100)
    return () => clearTimeout(timer)
  }, [fetchDashboardData])

  const handleMoodSelect = useCallback(async (moodId: string) => {
    triggerHaptic('success')
    setSelectedMood(moodId)
    setMoodSaved(true)
    setTimeout(() => setMoodSaved(false), 2000)

    const moodOption = MOOD_OPTIONS.find(m => m.id === moodId)
    if (!moodOption) return

    try {
      await apiFetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: moodOption.score }),
      })
    } catch {
      // Mood will be synced later via offline queue
    }
  }, [triggerHaptic])

  const handleRefresh = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  const handleNavigate = useCallback((href: string) => {
    triggerHaptic('selection')
    if (href === '/m/tools') {
      setIsToolsOverlayOpen(true)
      return
    }
    router.push(href)
  }, [router, triggerHaptic])

  const userName = user?.name || user?.email?.split('@')[0] || 'Friend'

  if (isLoading) {
    return (
      <MobileAppShell title="Sakha" showHeader={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <SacredOMLoader size={64} message="Entering the sacred court..." />
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell title="Sakha" showHeader={false} enablePullToRefresh onRefresh={handleRefresh}>
      <div className="px-5 pt-2 pb-8 space-y-5">

        {/* ── Divine Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-safe-top flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <OmSymbol width={18} height={18} className="text-[var(--sacred-divine-gold)] opacity-70" />
            <span className="sacred-text-divine text-lg tracking-wider text-[var(--sacred-text-secondary)]">
              {getGreeting()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language selector globe */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigate('/m/settings')}
              className="relative w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"
              aria-label={`Language: ${langConfig.name}`}
            >
              <Globe className="w-3.5 h-3.5 text-[var(--sacred-text-secondary)]" />
              <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold sacred-text-ui bg-[var(--sacred-divine-gold)] text-[var(--sacred-cosmic-void)] rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                {language.toUpperCase().slice(0, 2)}
              </span>
            </motion.button>

            {/* Profile gem */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigate('/m/profile')}
              className="w-9 h-9 rounded-full sacred-divine-breath border border-[var(--sacred-divine-gold)]/30 flex items-center justify-center"
              aria-label="Profile"
            >
              <span className="text-sm sacred-text-divine text-[var(--sacred-divine-gold)]">
                {userName.charAt(0).toUpperCase()}
              </span>
            </motion.button>
          </div>
        </motion.header>

        {/* ── SAKHA Presence Card ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SacredCard variant="divine" className="relative overflow-hidden py-8">
            {/* Background aura */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'var(--sacred-gradient-krishna-aura)' }}
            />

            {/* Gold shimmer top border effect */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'var(--sacred-gradient-gold-shimmer)' }}
            />

            <div className="relative flex flex-col items-center gap-4">
              <SakhaMandala size={100} animated glowIntensity="high" />

              <div className="text-center">
                <h2 className="sacred-text-divine text-2xl italic text-[var(--sacred-white)]">
                  Sakha
                </h2>
                <p className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mt-1">
                  Your Divine Companion is Present
                </p>
              </div>

              {/* Scrolling shloka fragment */}
              <div className="w-full overflow-hidden">
                <motion.p
                  animate={{ x: [0, -300, 0] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="sacred-text-scripture text-xs text-[var(--sacred-text-muted)] whitespace-nowrap"
                >
                  ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥
                </motion.p>
              </div>
            </div>
          </SacredCard>
        </motion.section>

        {/* ── Quick Sacred Actions ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SACRED_ACTIONS.map((action) => (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigate(action.href)}
                className="sacred-starter-chip whitespace-nowrap flex-shrink-0"
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Mood Check-in ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SacredCard className="!p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="sacred-label">How are you feeling?</p>
              <AnimatePresence mode="wait">
                {moodSaved && (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xs text-emerald-400 font-medium"
                  >
                    Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex justify-between gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood.id
                return (
                  <motion.button
                    key={mood.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-br ${mood.color} border border-[var(--sacred-divine-gold)]/30`
                        : 'bg-white/[0.03] border border-transparent active:bg-white/[0.06]'
                    }`}
                    aria-label={`I feel ${mood.label}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-xl" role="img" aria-hidden="true">{mood.emoji}</span>
                    <span className={`text-[9px] sacred-text-ui font-medium ${
                      isSelected ? 'text-[var(--sacred-text-primary)]' : 'text-[var(--sacred-text-muted)]'
                    }`}>
                      {mood.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </SacredCard>
        </motion.section>

        {/* ── Sacred Stats ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { label: 'Days of Dharma', value: dashboardData.streak, color: 'var(--sacred-divine-gold)' },
            { label: 'Reflections', value: dashboardData.journalEntries, color: 'var(--sacred-peacock-iridescent)' },
            { label: 'Insights', value: dashboardData.insightsCount, color: 'var(--sacred-peacock-shimmer)' },
          ].map((stat) => (
            <SacredCard key={stat.label} className="!p-3 text-center">
              <p className="text-xl font-bold sacred-text-divine" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[9px] sacred-text-ui text-[var(--sacred-text-muted)] mt-0.5">
                {stat.label}
              </p>
            </SacredCard>
          ))}
        </motion.section>

        <SacredDivider />

        {/* ── Today's Divine Insight ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="sacred-label mb-3">Today&apos;s Shloka</p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigate('/m/wisdom')}
            className="w-full text-left"
          >
            <VerseRevelation
              sanskrit={dailyWisdom.sanskrit}
              transliteration={dailyWisdom.transliteration}
              meaning={dailyWisdom.translation}
              reference={`${dailyWisdom.chapter}.${dailyWisdom.verse}`}
            />
          </motion.button>
        </motion.section>

        {/* ── Active Journey ── */}
        {dashboardData.activeJourney && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <SacredCard
              interactive
              className="cursor-pointer"
              onClick={() => handleNavigate(`/m/journeys/${dashboardData.activeJourney?.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="sacred-label mb-1">Active Journey</p>
                  <h3 className="sacred-text-divine text-base text-[var(--sacred-text-primary)]">
                    {dashboardData.activeJourney.title}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--sacred-text-muted)]" />
              </div>
              <div className="space-y-2">
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardData.activeJourney.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--sacred-krishna-blue), var(--sacred-peacock-teal))',
                    }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sacred-text-ui text-[var(--sacred-text-muted)]">
                    Day {dashboardData.activeJourney.currentDay} of {dashboardData.activeJourney.totalDays}
                  </span>
                  <span className="text-xs sacred-text-ui text-[var(--sacred-peacock-iridescent)]">
                    {dashboardData.activeJourney.progress}%
                  </span>
                </div>
              </div>
            </SacredCard>
          </motion.section>
        )}

        {/* ── Connection error hint ── */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--sacred-divine-gold)]/10 border border-[var(--sacred-divine-gold)]/15"
            >
              <RefreshCw className="w-4 h-4 text-[var(--sacred-divine-gold)] flex-shrink-0" />
              <p className="text-xs sacred-text-ui text-[var(--sacred-divine-gold-bright)]">
                Some data may be outdated. Pull down to refresh.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileToolsOverlay isOpen={isToolsOverlayOpen} onClose={() => setIsToolsOverlayOpen(false)} />
    </MobileAppShell>
  )
}
