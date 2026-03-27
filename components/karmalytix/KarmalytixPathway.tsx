'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Compass, BookOpen } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

type JournalEntry = {
  id: string
  title?: string
  body: string
  mood?: string
  at: string
}

type PathwayStep = {
  title: string
  description: string
  practice: string
  gita_principle: string
}

type Pathway = {
  pathway_name: string
  pathway_subtitle: string
  pathway_description: string
  steps: PathwayStep[]
}

type ApiResponse = {
  success: boolean
  source?: string
  pathway?: Pathway
  verse_refs?: string[]
  error?: string
}

interface KarmalytixPathwayProps {
  entries: JournalEntry[]
  encryptionReady: boolean
  isOpen: boolean
  onClose: () => void
}

// ─── Journal Mood → WisdomCore Mood Key ─────────────────────────────────

const MOOD_KEY_MAP: Record<string, string> = {
  peaceful: 'peaceful',
  happy: 'happy',
  neutral: 'neutral',
  charged: 'excited',
  open: 'hopeful',
  grateful: 'grateful',
  reflective: 'neutral',
  determined: 'excited',
  tender: 'sad',
  tired: 'stressed',
  anxious: 'anxious',
  heavy: 'overwhelmed',
}

// ─── Mood Analysis ──────────────────────────────────────────────────────

function analyzeMoods(entries: JournalEntry[]) {
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const recentEntries = entries.filter(
    (e) => new Date(e.at) >= fourteenDaysAgo,
  )

  if (recentEntries.length < 2) {
    return null
  }

  const moodCounts: Record<string, number> = {}
  for (const entry of recentEntries) {
    const mood = entry.mood ?? 'Unspecified'
    moodCounts[mood] = (moodCounts[mood] ?? 0) + 1
  }

  // Find dominant mood (highest count, exclude Unspecified)
  let dominantMood = 'Neutral'
  let maxCount = 0
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (mood !== 'Unspecified' && count > maxCount) {
      maxCount = count
      dominantMood = mood
    }
  }

  // Map to WisdomCore mood key
  const wisdomCoreMood = MOOD_KEY_MAP[dominantMood.toLowerCase()] ?? 'neutral'

  return {
    dominant_mood: wisdomCoreMood,
    mood_counts: moodCounts,
    entry_count: recentEntries.length,
    days_analyzed: 14,
    dominant_mood_label: dominantMood,
  }
}

// ─── Animation Variants ─────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const panelVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 28, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
}

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
      delay: 0.2 + i * 0.12,
    },
  }),
}

// ─── Component ──────────────────────────────────────────────────────────

export default function KarmalytixPathway({
  entries,
  encryptionReady,
  isOpen,
  onClose,
}: KarmalytixPathwayProps) {
  const [pathway, setPathway] = useState<Pathway | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastMoodKeyRef = useRef<string | null>(null)

  const moodAnalysis = useMemo(() => analyzeMoods(entries), [entries])

  const fetchPathway = useCallback(async () => {
    if (!moodAnalysis) return

    const moodKey = JSON.stringify(moodAnalysis.mood_counts)

    // Reuse cached pathway if mood hasn't changed
    if (lastMoodKeyRef.current === moodKey && pathway) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/karmalytix/pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood_summary: {
            dominant_mood: moodAnalysis.dominant_mood,
            mood_counts: moodAnalysis.mood_counts,
            entry_count: moodAnalysis.entry_count,
            days_analyzed: moodAnalysis.days_analyzed,
          },
        }),
        signal: AbortSignal.timeout(25000),
      })

      const data: ApiResponse = await response.json()

      if (data.success && data.pathway) {
        setPathway(data.pathway)
        lastMoodKeyRef.current = moodKey
        setError(null)
      } else {
        setError(
          data.error ??
            'KIAAN could not illuminate your pathway right now. Please try again shortly.',
        )
      }
    } catch {
      setError(
        'Connection issue. Please check your network and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [moodAnalysis, pathway])

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen && encryptionReady && moodAnalysis) {
      fetchPathway()
    }
  }, [isOpen, encryptionReady, moodAnalysis, fetchPathway])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // ─── Render Helpers ─────────────────────────────────────────────────

  const renderNotEnoughEntries = () => (
    <div className="text-center py-12 px-6">
      <div className="text-4xl mb-4">
        <BookOpen className="mx-auto h-10 w-10 text-[#d4a44c]/60" />
      </div>
      <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">
        Your Path Is Forming
      </h3>
      <p className="text-sm text-[#f5f0e8]/70 leading-relaxed max-w-md mx-auto">
        KIAAN needs at least two journal reflections from the past 14 days to
        illuminate your pathway. Keep writing, and your divine path will
        reveal itself.
      </p>
    </div>
  )

  const renderLoading = () => (
    <div className="text-center py-16 px-6">
      <div className="mb-6 flex justify-center">
        <Sparkles className="h-8 w-8 text-[#e8b54a] animate-pulse" />
      </div>
      <p className="text-sm text-[#f5f0e8]/80 font-semibold">
        KIAAN is illuminating your path...
      </p>
      <p className="text-xs text-[#f5f0e8]/50 mt-2">
        Drawing from ancient wisdom to craft your personal pathway
      </p>
    </div>
  )

  const renderError = () => (
    <div className="text-center py-12 px-6">
      <p className="text-sm text-[#f5f0e8]/80 mb-4">{error}</p>
      <button
        onClick={fetchPathway}
        className="px-4 py-2 rounded-xl bg-[#d4a44c]/20 border border-[#d4a44c]/40 text-[#f5f0e8] text-sm font-semibold hover:bg-[#d4a44c]/30 transition-all"
      >
        Try Again
      </button>
    </div>
  )

  const renderPathway = () => {
    if (!pathway) return null

    return (
      <>
        {/* Pathway Header */}
        <div className="mb-6">
          <p className="text-[#e8b54a]/70 text-xs uppercase tracking-[0.2em] font-semibold mb-1">
            Your Divine Pathway
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f5f0e8] mb-1">
            {pathway.pathway_name}
          </h2>
          <p className="text-sm italic text-[#e8b54a]">
            {pathway.pathway_subtitle}
          </p>
          <p className="text-sm text-[#f5f0e8]/75 mt-3 leading-relaxed">
            {pathway.pathway_description}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {pathway.steps.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              className="rounded-2xl bg-black/40 border border-[#d4a44c]/20 p-4 sm:p-5"
            >
              {/* Step Number + Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[#d4a44c]/20">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-[#f5f0e8] text-base">
                    {step.title}
                  </h3>
                  <span className="text-xs text-[#e8b54a]/60 italic">
                    {step.gita_principle}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#f5f0e8]/80 leading-relaxed mb-3 ml-11">
                {step.description}
              </p>

              {/* Practice Box */}
              <div className="ml-11 rounded-xl bg-[#d4a44c]/8 border border-[#d4a44c]/15 p-3 flex items-start gap-2">
                <Compass className="h-4 w-4 text-[#e8b54a] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[#e8b54a] uppercase tracking-wider">
                    Daily Practice
                  </span>
                  <p className="text-sm text-[#f5f0e8]/75 mt-1 leading-relaxed">
                    {step.practice}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#f5f0e8]/50 italic">
            Begin where you are. Each step deepens the last.
          </p>
        </div>
      </>
    )
  }

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Karmalytix Divine Pathway"
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl my-4 sm:my-8 rounded-3xl border border-[#d4a44c]/20 bg-[#0d0d10]/95 backdrop-blur-xl p-5 sm:p-7 shadow-[0_20px_80px_rgba(255,115,39,0.15)]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-white/5 transition-all"
              aria-label="Close Karmalytix"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Karmalytix Badge */}
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-5 w-5 text-[#e8b54a]" />
              <span className="text-sm font-bold text-[#e8b54a] uppercase tracking-[0.15em]">
                Karmalytix
              </span>
            </div>

            {/* Content */}
            {!encryptionReady ? (
              <div className="text-center py-12 px-6">
                <p className="text-sm text-[#f5f0e8]/70">
                  Enter your encryption passphrase to unlock Karmalytix insights.
                </p>
              </div>
            ) : !moodAnalysis ? (
              renderNotEnoughEntries()
            ) : loading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : pathway ? (
              renderPathway()
            ) : (
              renderLoading()
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
