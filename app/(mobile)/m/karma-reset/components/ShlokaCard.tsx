'use client'

/**
 * ShlokaCard — Category-colored warm variant of the Gita verse display.
 * Features character-by-character Sanskrit reveal with blur effect,
 * transliteration, English translation, and optional voice playback.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { VoiceResponseButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import type { KarmaCategory } from '../types'
import { CATEGORY_COLORS } from '../types'

interface ShlokaCardProps {
  sanskrit: string
  transliteration: string
  english: string
  chapter: number
  verse: number
  chapterName: string
  category: KarmaCategory
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function ShlokaCard({
  sanskrit,
  transliteration,
  english,
  chapter,
  verse,
  chapterName,
  category,
}: ShlokaCardProps) {
  const [revealed, setRevealed] = useState(false)
  const { language } = useLanguage()
  const color = CATEGORY_COLORS[category]
  const rgb = hexToRgb(color)

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(100% at 50% 50%)' }}
      transition={{ duration: 0.6, ease: [0, 0.8, 0.2, 1] }}
      onAnimationComplete={() => setRevealed(true)}
      style={{
        background: `radial-gradient(ellipse at 50% 30%, rgba(${rgb},0.12), rgba(17,20,53,0.98))`,
        border: `1px solid rgba(${rgb},0.25)`,
        borderTop: `3px solid rgba(${rgb},0.8)`,
        borderRadius: 24,
        padding: 20,
        position: 'relative',
      }}
    >
      {/* Reference badge */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.15em',
          color: '#D4A017',
          textTransform: 'uppercase' as const,
          marginBottom: 12,
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
        }}
      >
        CH.{chapter} · V.{verse} · {chapterName}
      </div>

      {/* Sanskrit — character by character with blur */}
      <div
        style={{
          fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
          fontSize: 22,
          fontStyle: 'italic',
          fontWeight: 300,
          color: '#F0C040',
          lineHeight: 1.8,
          marginBottom: 14,
        }}
      >
        {revealed
          ? sanskrit.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
              >
                {char}
              </motion.span>
            ))
          : <span style={{ opacity: 0 }}>{sanskrit}</span>}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${rgb},0.4), transparent)`,
          margin: '12px 0',
        }}
      />

      {/* Transliteration */}
      <div
        style={{
          fontFamily: 'var(--font-scripture, Crimson Text, serif)',
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--sacred-text-secondary, #B8AE98)',
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        {transliteration}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)',
          margin: '12px 0',
        }}
      />

      {/* English translation */}
      <div
        style={{
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          fontSize: 15,
          color: 'var(--sacred-text-primary, #EDE8DC)',
          lineHeight: 1.75,
          marginBottom: 12,
        }}
      >
        {english}
      </div>

      {/* Voice playback */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <VoiceResponseButton
          text={`${english}. Chapter ${chapter}, Verse ${verse}.`}
          language={language}
          size="sm"
          variant="minimal"
        />
      </div>
    </motion.div>
  )
}
