'use client'

/**
 * VerseCitationChip — Tappable golden pill for Bhagavad Gita verse references.
 *
 * Renders "BG {chapter}.{verse}" as a shimmering golden chip.
 * On tap: haptic feedback + opens a Modal with the full verse
 * (Sanskrit, transliteration, English, Hindi, themes).
 *
 * Uses existing getVerse() from gitaVerses.ts — gracefully handles
 * verses not found in the KEY_VERSES collection.
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { getVerse, CHAPTERS } from '@/data/gitaVerses'
import { hapticVerse } from '@/utils/voice/hapticFeedback'

interface VerseCitationChipProps {
  chapter: number
  verse: number
}

export function VerseCitationChip({ chapter, verse }: VerseCitationChipProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleTap = useCallback(() => {
    hapticVerse()
    setIsModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const verseData = isModalOpen ? getVerse(chapter, verse) : null
  const chapterInfo = isModalOpen
    ? CHAPTERS.find(c => c.number === chapter)
    : null

  return (
    <>
      <motion.button
        type="button"
        onClick={handleTap}
        className="inline-flex items-center gap-1 rounded-full border border-[#d4a44c]/60 bg-[#d4a44c]/10 px-3 py-1 text-xs font-medium text-[#e8b54a] transition-colors hover:bg-[#d4a44c]/20 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/40 animate-shimmer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`View Bhagavad Gita chapter ${chapter}, verse ${verse}`}
        style={{
          backgroundImage:
            'linear-gradient(110deg, transparent 30%, rgba(212,164,76,0.15) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
        }}
      >
        <span aria-hidden="true" className="text-[10px]">📿</span>
        BG {chapter}.{verse}
      </motion.button>

      <Modal
        open={isModalOpen}
        onClose={handleClose}
        title={
          verseData
            ? `Bhagavad Gita ${chapter}.${verse}`
            : `BG ${chapter}.${verse}`
        }
        size="lg"
      >
        <div className="space-y-5 p-1">
          {/* Chapter header */}
          {chapterInfo && (
            <div className="text-center">
              <p className="text-sm text-[#a89e8e]">
                Chapter {chapterInfo.number} — {chapterInfo.name}
              </p>
              <p className="font-serif text-base text-[#e8b54a]">
                {chapterInfo.sanskritName}
              </p>
            </div>
          )}

          {verseData ? (
            <>
              {/* Sanskrit */}
              <div className="rounded-lg border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-4 text-center">
                <p className="mb-1 text-xs uppercase tracking-wider text-[#a89e8e]">
                  Sanskrit
                </p>
                <p className="font-serif text-lg leading-relaxed text-[#f5f0e8]">
                  {verseData.sanskrit}
                </p>
              </div>

              {/* Transliteration */}
              {verseData.transliteration && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-[#a89e8e]">
                    Transliteration
                  </p>
                  <p className="text-sm italic leading-relaxed text-[#d4c4a8]">
                    {verseData.transliteration}
                  </p>
                </div>
              )}

              {/* English translation */}
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-[#a89e8e]">
                  English
                </p>
                <p className="text-sm leading-relaxed text-[#f5f0e8]">
                  {verseData.english}
                </p>
              </div>

              {/* Hindi translation */}
              {verseData.hindi && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-[#a89e8e]">
                    Hindi
                  </p>
                  <p className="text-sm leading-relaxed text-[#f5f0e8]">
                    {verseData.hindi}
                  </p>
                </div>
              )}

              {/* Themes */}
              {verseData.themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {verseData.themes.map(theme => (
                    <span
                      key={theme}
                      className="rounded-full border border-[#d4a44c]/30 bg-[#d4a44c]/10 px-2 py-0.5 text-xs text-[#e8b54a]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {/* Reflection */}
              {verseData.reflection && (
                <div className="rounded-lg border border-[#e8b54a]/10 bg-[#e8b54a]/5 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wider text-[#a89e8e]">
                    Reflection
                  </p>
                  <p className="text-sm italic leading-relaxed text-[#d4c4a8]">
                    {verseData.reflection}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-[#a89e8e]">
                This verse is not yet in our collection.
              </p>
              <p className="mt-1 text-xs text-[#7a7060]">
                Bhagavad Gita Chapter {chapter}, Verse {verse}
              </p>
            </div>
          )}
        </div>
      </Modal>

    </>
  )
}
