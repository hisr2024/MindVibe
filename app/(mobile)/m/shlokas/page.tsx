'use client'

/**
 * Sacred Wisdom Library — Bhagavad Gita Shloka Browser for Kiaanverse
 *
 * Two views:
 * 1. Chapter Grid: 18 chapters displayed as sacred cards in a 2-column grid
 * 2. Verse View: Full-screen immersive shloka display with navigation
 *
 * Fetches chapter/verse data from the API with graceful fallback to
 * a static chapter list when the API is unavailable.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { VerseRevelation } from '@/components/sacred/VerseRevelation'
import { SacredCard } from '@/components/sacred/SacredCard'
import { apiFetch } from '@/lib/api'

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface Chapter {
  number: number
  name: string
  sanskrit: string
  verseCount: number
}

interface Verse {
  number: number
  sanskrit?: string
  transliteration?: string
  meaning?: string
}

/* ---------------------------------------------------------------------------
 * Fallback data — used when the API is unavailable
 * --------------------------------------------------------------------------- */

const FALLBACK_CHAPTERS: Chapter[] = [
  { number: 1, name: 'Arjuna Vishada Yoga', sanskrit: 'अर्जुनविषादयोग', verseCount: 47 },
  { number: 2, name: 'Sankhya Yoga', sanskrit: 'सांख्ययोग', verseCount: 72 },
  { number: 3, name: 'Karma Yoga', sanskrit: 'कर्मयोग', verseCount: 43 },
  { number: 4, name: 'Jnana Karma Sanyasa Yoga', sanskrit: 'ज्ञानकर्मसन्न्यासयोग', verseCount: 42 },
  { number: 5, name: 'Karma Sanyasa Yoga', sanskrit: 'कर्मसन्न्यासयोग', verseCount: 29 },
  { number: 6, name: 'Atma Samyama Yoga', sanskrit: 'आत्मसंयमयोग', verseCount: 47 },
  { number: 7, name: 'Jnana Vijnana Yoga', sanskrit: 'ज्ञानविज्ञानयोग', verseCount: 30 },
  { number: 8, name: 'Aksara Brahma Yoga', sanskrit: 'अक्षरब्रह्मयोग', verseCount: 28 },
  { number: 9, name: 'Raja Vidya Raja Guhya Yoga', sanskrit: 'राजविद्याराजगुह्ययोग', verseCount: 34 },
  { number: 10, name: 'Vibhuti Yoga', sanskrit: 'विभूतियोग', verseCount: 42 },
  { number: 11, name: 'Vishwarupa Darshana Yoga', sanskrit: 'विश्वरूपदर्शनयोग', verseCount: 55 },
  { number: 12, name: 'Bhakti Yoga', sanskrit: 'भक्तियोग', verseCount: 20 },
  { number: 13, name: 'Kshetra Kshetrajna Vibhaga Yoga', sanskrit: 'क्षेत्रक्षेत्रज्ञविभागयोग', verseCount: 35 },
  { number: 14, name: 'Gunatraya Vibhaga Yoga', sanskrit: 'गुणत्रयविभागयोग', verseCount: 27 },
  { number: 15, name: 'Purushottama Yoga', sanskrit: 'पुरुषोत्तमयोग', verseCount: 20 },
  { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', sanskrit: 'दैवासुरसम्पद्विभागयोग', verseCount: 24 },
  { number: 17, name: 'Shraddhatraya Vibhaga Yoga', sanskrit: 'श्रद्धात्रयविभागयोग', verseCount: 28 },
  { number: 18, name: 'Moksha Sanyasa Yoga', sanskrit: 'मोक्षसन्न्यासयोग', verseCount: 78 },
]

/** Cycle through three accent colors for chapter cards */
const ACCENT_COLORS = [
  'var(--sacred-peacock-teal, #2dd4bf)',
  'var(--sacred-krishna-blue, #60a5fa)',
  'var(--sacred-divine-gold, #d4a017)',
] as const

function accentForChapter(chapterNumber: number): string {
  return ACCENT_COLORS[(chapterNumber - 1) % ACCENT_COLORS.length]
}

/* ---------------------------------------------------------------------------
 * Chapter Grid View
 * --------------------------------------------------------------------------- */

function ChapterGrid({
  chapters,
  onSelectChapter,
}: {
  chapters: Chapter[]
  onSelectChapter: (chapterNumber: number) => void
}) {
  return (
    <div className="px-4 pb-6">
      {/* Page header */}
      <div className="pt-2 pb-5 text-center">
        <h1 className="sacred-text-divine text-2xl text-[var(--sacred-divine-gold)]">
          Sacred Wisdom Library
        </h1>
        <p className="sacred-text-scripture text-sm text-[var(--sacred-text-secondary,#a1a1aa)] mt-1">
          Explore the 18 chapters of the Bhagavad Gita
        </p>
        <div className="sacred-divider mx-auto mt-3 w-24" />
      </div>

      {/* Chapter grid — 2 columns */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {chapters.map((chapter) => {
          const accent = accentForChapter(chapter.number)
          return (
            <motion.div
              key={chapter.number}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <SacredCard
                interactive
                className="cursor-pointer min-h-[140px] flex flex-col justify-between"
                onClick={() => onSelectChapter(chapter.number)}
                style={{ borderTopColor: accent }}
              >
                {/* Chapter number */}
                <span
                  className="sacred-text-divine text-3xl leading-none"
                  style={{ color: accent }}
                >
                  {chapter.number}
                </span>

                {/* Chapter names */}
                <div className="mt-2 space-y-0.5">
                  <p className="sacred-text-scripture text-xs text-[var(--sacred-text-secondary,#a1a1aa)] leading-tight">
                    {chapter.sanskrit}
                  </p>
                  <p className="text-sm font-medium text-[var(--sacred-text-primary,#e4e4e7)] leading-snug">
                    {chapter.name}
                  </p>
                </div>

                {/* Verse count */}
                <p className="sacred-label text-[10px] mt-2" style={{ color: accent }}>
                  {chapter.verseCount} verses
                </p>
              </SacredCard>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Verse View — full-screen immersive shloka display
 * --------------------------------------------------------------------------- */

function VerseView({
  chapterNumber,
  chapterName,
  onBack,
}: {
  chapterNumber: number
  chapterName: string
  onBack: () => void
}) {
  const [verses, setVerses] = useState<Verse[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchVerses() {
      setLoading(true)
      setError(null)

      try {
        const res = await apiFetch(`/api/gita/verses?chapter=${chapterNumber}`)
        if (!res.ok) {
          throw new Error(`Failed to load verses (status ${res.status})`)
        }
        const data = await res.json()
        if (!cancelled) {
          const parsed: Verse[] = Array.isArray(data) ? data : data.verses ?? []
          setVerses(parsed)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Unable to load verses right now'
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVerses()
    return () => { cancelled = true }
  }, [chapterNumber])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, verses.length - 1))
  }, [verses.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  /** Handle swipe gestures for verse navigation */
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const swipeThreshold = 50
      if (info.offset.x < -swipeThreshold || info.velocity.x < -500) {
        goNext()
      } else if (info.offset.x > swipeThreshold || info.velocity.x > 500) {
        goPrev()
      }
    },
    [goNext, goPrev]
  )

  const currentVerse = verses[currentIndex]

  return (
    <div className="flex flex-col h-full min-h-[80dvh] bg-[var(--sacred-cosmic-void,#050510)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[var(--sacred-divine-gold)] text-sm"
          aria-label="Back to chapters"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Chapters</span>
        </button>
        <div className="ml-auto text-right">
          <p className="sacred-text-divine text-sm text-[var(--sacred-divine-gold)]">
            Chapter {chapterNumber}
          </p>
          <p className="sacred-label text-[10px] text-[var(--sacred-text-secondary,#a1a1aa)]">
            {chapterName}
          </p>
        </div>
      </div>

      <div className="sacred-divider mx-4" />

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 overflow-hidden">
        {loading && (
          <SacredOMLoader size={56} message="Revealing sacred wisdom..." />
        )}

        {!loading && error && (
          <div className="text-center space-y-3 px-6">
            <p className="sacred-text-scripture text-[var(--sacred-text-secondary,#a1a1aa)] text-sm">
              {error}
            </p>
            <p className="sacred-label text-xs">
              Please check your connection and try again
            </p>
          </div>
        )}

        {!loading && !error && verses.length === 0 && (
          <p className="sacred-text-scripture text-[var(--sacred-text-secondary,#a1a1aa)] text-sm text-center">
            No verses found for this chapter.
          </p>
        )}

        {!loading && !error && currentVerse && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              <VerseRevelation
                sanskrit={currentVerse.sanskrit}
                transliteration={currentVerse.transliteration}
                meaning={currentVerse.meaning}
                reference={`${chapterNumber}.${currentVerse.number}`}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom navigation */}
      {!loading && !error && verses.length > 0 && (
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full text-[var(--sacred-divine-gold)] disabled:opacity-30 transition-opacity"
            aria-label="Previous verse"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <p className="sacred-label text-xs text-[var(--sacred-text-secondary,#a1a1aa)]">
            Verse {currentIndex + 1} of {verses.length}
          </p>

          <button
            onClick={goNext}
            disabled={currentIndex === verses.length - 1}
            className="p-2 rounded-full text-[var(--sacred-divine-gold)] disabled:opacity-30 transition-opacity"
            aria-label="Next verse"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Main Page Component
 * --------------------------------------------------------------------------- */

export default function ShlokasPage() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>(FALLBACK_CHAPTERS)
  const [loading, setLoading] = useState(true)

  /** Fetch chapters from API; fall back to static data on failure */
  useEffect(() => {
    let cancelled = false

    async function fetchChapters() {
      try {
        const res = await apiFetch('/api/gita/chapters')
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        if (!cancelled) {
          const parsed: Chapter[] = Array.isArray(data) ? data : data.chapters ?? []
          if (parsed.length > 0) {
            setChapters(parsed)
          }
          // If parsed is empty, keep fallback data
        }
      } catch {
        // Silently use fallback chapters — no disruption to the user
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchChapters()
    return () => { cancelled = true }
  }, [])

  /** Resolve chapter name for the verse view header */
  const selectedChapterData = selectedChapter
    ? chapters.find((c) => c.number === selectedChapter)
    : null

  return (
    <MobileAppShell
      title={selectedChapter ? `Chapter ${selectedChapter}` : 'Shlokas'}
      subtitle={selectedChapter ? selectedChapterData?.name : 'Bhagavad Gita'}
      showBack={selectedChapter !== null}
      onBack={selectedChapter !== null ? () => setSelectedChapter(null) : undefined}
      showTabBar={selectedChapter === null}
    >
      {loading && !selectedChapter && (
        <div className="flex-1 flex items-center justify-center py-20">
          <SacredOMLoader size={56} message="Loading sacred chapters..." />
        </div>
      )}

      {!loading && !selectedChapter && (
        <ChapterGrid
          chapters={chapters}
          onSelectChapter={setSelectedChapter}
        />
      )}

      {selectedChapter !== null && (
        <VerseView
          chapterNumber={selectedChapter}
          chapterName={selectedChapterData?.name ?? `Chapter ${selectedChapter}`}
          onBack={() => setSelectedChapter(null)}
        />
      )}
    </MobileAppShell>
  )
}
