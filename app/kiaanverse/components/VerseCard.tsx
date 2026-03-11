/**
 * VerseCard — Displays a referenced Gita verse overlay.
 *
 * Shows Sanskrit, transliteration, and English translation
 * when Krishna references a specific verse. Slides in from right.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

export default function VerseCard() {
  const verse = useKiaanverseStore((s) => s.activeVerse)
  const setActiveVerse = useKiaanverseStore((s) => s.setActiveVerse)

  return (
    <AnimatePresence>
      {verse && (
        <motion.div
          className="absolute right-4 top-20 z-40 w-80 max-w-[90vw]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rounded-xl border border-amber-400/25 bg-black/60 p-5 backdrop-blur-xl">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-amber-400/70">
                Chapter {verse.chapter}, Verse {verse.verse}
              </span>
              <button
                onClick={() => setActiveVerse(null)}
                className="text-amber-200/40 transition-colors hover:text-amber-200/80"
                aria-label="Close verse"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sanskrit */}
            {verse.sanskrit && (
              <p className="mb-2 font-serif text-base leading-relaxed text-amber-200/80">
                {verse.sanskrit}
              </p>
            )}

            {/* Transliteration */}
            {verse.transliteration && (
              <p className="mb-2 text-xs italic text-amber-300/50">
                {verse.transliteration}
              </p>
            )}

            {/* Divider */}
            <div className="my-3 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            {/* Translation */}
            <p className="text-sm leading-relaxed text-amber-50/75">
              {verse.translation}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
