/**
 * ChapterNav — Refined chapter selector for the 18 Gita chapters.
 *
 * Shows Sanskrit names and English labels in a clean grid.
 * Selecting a chapter loads the intro via KIAAN AI.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import { kiaanverseService } from '@/services/kiaanverseService'

const CHAPTERS = [
  { ch: 1, name: 'Arjuna Vishada Yoga', label: 'The Grief of Arjuna' },
  { ch: 2, name: 'Sankhya Yoga', label: 'The Yoga of Knowledge' },
  { ch: 3, name: 'Karma Yoga', label: 'The Yoga of Action' },
  { ch: 4, name: 'Jnana Karma Sannyasa Yoga', label: 'Renunciation of Action in Knowledge' },
  { ch: 5, name: 'Karma Sannyasa Yoga', label: 'The Yoga of Renunciation' },
  { ch: 6, name: 'Dhyana Yoga', label: 'The Yoga of Meditation' },
  { ch: 7, name: 'Jnana Vijnana Yoga', label: 'Knowledge and Wisdom' },
  { ch: 8, name: 'Aksara Brahma Yoga', label: 'The Imperishable Brahman' },
  { ch: 9, name: 'Raja Vidya Raja Guhya Yoga', label: 'The Royal Secret' },
  { ch: 10, name: 'Vibhuti Yoga', label: 'Divine Manifestations' },
  { ch: 11, name: 'Vishwarupa Darshana Yoga', label: 'The Cosmic Vision' },
  { ch: 12, name: 'Bhakti Yoga', label: 'The Yoga of Devotion' },
  { ch: 13, name: 'Kshetra Kshetrajna Vibhaga Yoga', label: 'The Field and the Knower' },
  { ch: 14, name: 'Gunatraya Vibhaga Yoga', label: 'The Three Gunas' },
  { ch: 15, name: 'Purushottama Yoga', label: 'The Supreme Person' },
  { ch: 16, name: 'Daivasura Sampad Vibhaga Yoga', label: 'Divine and Demonic Natures' },
  { ch: 17, name: 'Shraddhatraya Vibhaga Yoga', label: 'The Three Divisions of Faith' },
  { ch: 18, name: 'Moksha Sannyasa Yoga', label: 'Liberation Through Renunciation' },
]

export default function ChapterNav() {
  const showChapterNav = useKiaanverseStore((s) => s.showChapterNav)
  const toggleChapterNav = useKiaanverseStore((s) => s.toggleChapterNav)
  const currentChapter = useKiaanverseStore((s) => s.currentChapter)
  const setChapter = useKiaanverseStore((s) => s.setChapter)
  const setSubtitleText = useKiaanverseStore((s) => s.setSubtitleText)
  const setKrishnaState = useKiaanverseStore((s) => s.setKrishnaState)

  const handleSelect = async (ch: number) => {
    setChapter(ch)
    toggleChapterNav()
    try {
      const intro = await kiaanverseService.getChapterIntro(ch)
      setSubtitleText(intro.intro_text)
      setKrishnaState('speaking')
    } catch {
      setSubtitleText(`Welcome to Chapter ${ch} of the Bhagavad Gita.`)
    }
  }

  return (
    <AnimatePresence>
      {showChapterNav && (
        <>
          <motion.div
            key="chapter-backdrop"
            className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Close chapter navigation"
            onClick={toggleChapterNav}
            onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') toggleChapterNav() }}
          />

          <motion.div
            key="chapter-panel"
            role="dialog"
            aria-label="Chapter navigation"
            aria-modal="true"
            className="absolute inset-x-4 top-14 z-50 max-h-[78vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/75 p-5 backdrop-blur-2xl md:inset-x-[10%]"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="mb-5 text-center text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/50">
              Bhagavad Gita — 18 Chapters
            </h2>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {CHAPTERS.map(({ ch, name, label }) => (
                <button
                  key={ch}
                  onClick={() => handleSelect(ch)}
                  className={`rounded-xl px-3.5 py-2.5 text-left transition-all ${
                    ch === currentChapter
                      ? 'border border-amber-400/20 bg-amber-500/10 text-amber-200'
                      : 'border border-transparent text-amber-100/45 hover:bg-amber-500/[0.06] hover:text-amber-100/80'
                  }`}
                >
                  <span className="text-[10px] font-light tracking-wider text-amber-400/35">Chapter {ch}</span>
                  <p className="text-[13px] font-light">{label}</p>
                  <p className="text-[9px] font-light italic tracking-wide text-amber-300/25">{name}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
