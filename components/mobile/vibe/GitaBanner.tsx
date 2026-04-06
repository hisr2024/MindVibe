/**
 * GitaBanner — The crown of the KIAAN Vibe library.
 *
 * Full-width sacred card that serves as the gateway to the complete
 * Bhagavad Gita. Shows chapter preview circles with Devanagari numerals,
 * stat pills, and a CTA to the chapter browser.
 */

'use client'

import { motion } from 'framer-motion'
import { SanskritReveal } from './SanskritReveal'
import {
  GITA_STATS,
  GITA_MOBILE_CHAPTERS,
  DEVANAGARI_NUMERALS,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface GitaBannerProps {
  onPress: () => void
}

export function GitaBanner({ onPress }: GitaBannerProps) {
  const { triggerHaptic } = useHapticFeedback()
  const totalHours = Math.round(GITA_STATS.totalDurationMinutes / 60)

  const stats = [
    `${GITA_STATS.totalChapters} Chapters`,
    `${GITA_STATS.totalVerses} Verses`,
    `${GITA_STATS.voices.length} Divine Voices`,
    `~${totalHours} hours`,
  ]

  return (
    <motion.button
      onClick={() => { triggerHaptic('medium'); onPress() }}
      className="w-full text-left mb-6"
      whileTap={{ scale: 0.985 }}
    >
      <div
        className="relative rounded-[20px] overflow-hidden px-5 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(27,79,187,0.25), rgba(5,7,20,0.97))',
          border: '1px solid rgba(212,160,23,0.35)',
          borderTop: '3px solid rgba(212,160,23,0.8)',
        }}
      >
        {/* Top row: dharma chakra + badge */}
        <div className="flex items-center justify-between mb-3">
          <motion.span
            className="text-[22px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {'\u2638\uFE0F'}
          </motion.span>
          <span
            className="text-[9px] tracking-[0.15em] uppercase font-[family-name:var(--font-ui)]"
            style={{ color: '#D4A017' }}
          >
            COMPLETE GITA
          </span>
        </div>

        {/* Title */}
        <SanskritReveal
          text={'\u0936\u094D\u0930\u0940\u092E\u0926\u094D \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E'}
          staggerMs={60}
          style={{
            fontSize: 28,
            fontWeight: 300,
            marginBottom: 6,
            textShadow: '0 0 20px rgba(212,160,23,0.4)',
          }}
        />

        {/* Subtitle */}
        <p
          className="font-[family-name:var(--font-scripture)] italic text-[13px] mb-4"
          style={{ color: '#B8AE98' }}
        >
          The complete Bhagavad Gita — every verse, multiple divine voices
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {stats.map(stat => (
            <span
              key={stat}
              className="text-[9px] tracking-[0.05em] px-2.5 py-1 rounded-full font-[family-name:var(--font-ui)]"
              style={{
                color: '#D4A017',
                background: 'rgba(212,160,23,0.1)',
                border: '1px solid rgba(212,160,23,0.25)',
              }}
            >
              {stat}
            </span>
          ))}
        </div>

        {/* Chapter preview circles */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none">
          {GITA_MOBILE_CHAPTERS.slice(0, 6).map(ch => (
            <div
              key={ch.number}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: ch.color + '25',
                border: `1px solid ${ch.color}40`,
              }}
            >
              <span
                className="text-[11px] font-[family-name:var(--font-divine)]"
                style={{ color: ch.color }}
              >
                {DEVANAGARI_NUMERALS[ch.number]}
              </span>
            </div>
          ))}
          <span className="text-[10px] ml-1 font-[family-name:var(--font-ui)]" style={{ color: '#6B6355' }}>
            +12 more
          </span>
        </div>

        {/* CTA */}
        <p
          className="text-[12px] text-right font-[family-name:var(--font-ui)]"
          style={{ color: '#D4A017' }}
        >
          Browse All 18 Chapters {'\u2192'}
        </p>
      </div>
    </motion.button>
  )
}

export default GitaBanner
