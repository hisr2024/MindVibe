/**
 * VerseCard — Displays a referenced Gita verse as a refined overlay.
 *
 * Shows Sanskrit, transliteration, and English translation
 * when a specific verse is referenced. Slides in from right.
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
          className="absolute right-4 top-16 z-40 w-80 max-w-[88vw]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rounded-2xl border border-white/[0.06] bg-black/45 p-5 backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-light uppercase tracking-[0.2em] text-amber-400/50">
                Chapter {verse.chapter}, Verse {verse.verse}
              </span>
              <button
                onClick={() => setActiveVerse(null)}
                className="text-amber-200/30 transition-colors hover:text-amber-200/60"
                aria-label="Close verse"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sanskrit */}
            {verse.sanskrit && (
              <p className="mb-2.5 font-serif text-base font-light leading-relaxed text-amber-200/75">
                {verse.sanskrit}
              </p>
            )}

            {/* Transliteration */}
            {verse.transliteration && (
              <p className="mb-2.5 text-[11px] font-light italic tracking-wide text-amber-300/35">
                {verse.transliteration}
              </p>
            )}

            {/* Divider */}
            <div className="my-3.5 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

            {/* Translation */}
            <p className="text-[13px] font-light leading-relaxed tracking-wide text-amber-50/65">
              {verse.translation}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
