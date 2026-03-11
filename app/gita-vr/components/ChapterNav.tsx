/**
 * ChapterNav — Chapter selector overlay for navigating the 18 chapters.
 *
 * Opens as a slide-down panel. Each chapter shows its Sanskrit name.
 * Selecting a chapter updates the store and closes the panel.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

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
  const showChapterNav = useGitaVRStore((s) => s.showChapterNav)
  const toggleChapterNav = useGitaVRStore((s) => s.toggleChapterNav)
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const setChapter = useGitaVRStore((s) => s.setChapter)

  const handleSelect = (ch: number) => {
    setChapter(ch)
    toggleChapterNav()
  }

  return (
    <AnimatePresence>
      {showChapterNav && (
        <>
          {/* Backdrop */}
          <motion.div
            key="chapter-backdrop"
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Close chapter navigation"
            onClick={toggleChapterNav}
            onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') toggleChapterNav() }}
          />

          {/* Panel */}
          <motion.div
            key="chapter-panel"
            role="dialog"
            aria-label="Chapter navigation"
            aria-modal="true"
            className="absolute inset-x-4 top-16 z-50 max-h-[75vh] overflow-y-auto rounded-2xl border border-amber-400/15 bg-black/70 p-4 backdrop-blur-xl md:inset-x-[10%]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-amber-400/70">
              Bhagavad Gita — 18 Chapters
            </h2>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CHAPTERS.map(({ ch, name, label }) => (
                <button
                  key={ch}
                  onClick={() => handleSelect(ch)}
                  className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                    ch === currentChapter
                      ? 'border border-amber-400/30 bg-amber-500/15 text-amber-200'
                      : 'border border-transparent text-amber-100/60 hover:bg-amber-500/10 hover:text-amber-100/90'
                  }`}
                >
                  <span className="text-xs text-amber-400/50">Chapter {ch}</span>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[10px] italic text-amber-300/40">{name}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
