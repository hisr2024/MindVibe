/**
 * ChapterCard — A single chapter card in the 2-column grid.
 *
 * Shows Devanagari numeral, Sanskrit name, English name,
 * verse count, duration, and yoga type indicator strip.
 */

'use client'

import { motion } from 'framer-motion'
import type { GitaMobileChapter } from '@/lib/kiaan-vibe/gita-library'
import { DEVANAGARI_NUMERALS, YOGA_TYPE_COLORS } from '@/lib/kiaan-vibe/gita-library'

interface ChapterCardProps {
  chapter: GitaMobileChapter
  onPress: () => void
}

export function ChapterCard({ chapter, onPress }: ChapterCardProps) {
  const yogaColor = YOGA_TYPE_COLORS[chapter.yogaType]

  return (
    <motion.button
      onClick={onPress}
      className="relative rounded-[18px] overflow-hidden text-left w-full"
      style={{
        background: `linear-gradient(180deg, ${chapter.color}15, #050714)`,
        border: `1px solid ${chapter.color}30`,
        borderTop: `2px solid ${chapter.color}`,
        height: 160,
      }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex flex-col justify-between h-full p-3.5">
        {/* Chapter number in Devanagari */}
        <span
          className="text-[38px] leading-none"
          style={{ color: chapter.color, fontWeight: 300, fontFamily: 'var(--font-devanagari), var(--font-divine), Cormorant Garamond, Georgia, serif' }}
        >
          {DEVANAGARI_NUMERALS[chapter.number]}
        </span>

        {/* Sanskrit + English names */}
        <div className="mt-auto">
          <p
            className="italic text-[14px] leading-tight line-clamp-2"
            style={{ color: chapter.color, fontFamily: 'var(--font-devanagari), var(--font-scripture), Crimson Text, Georgia, serif' }}
          >
            {chapter.sanskrit}
          </p>
          <p
            className="text-[11px] text-[#B8AE98] truncate mt-0.5 font-[family-name:var(--font-ui)]"
          >
            {chapter.english}
          </p>

          {/* Bottom row: verse count + duration */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-[#6B6355] font-[family-name:var(--font-ui)]">
              {chapter.verseCount} verses
            </span>
            <span className="text-[9px] text-[#6B6355] font-[family-name:var(--font-ui)]">
              ~{chapter.durationMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Yoga type strip at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: yogaColor }}
      />
    </motion.button>
  )
}

export default ChapterCard
