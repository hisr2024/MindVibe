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

// Devanagari font stack — guarantees proper conjunct shaping on Android WebView.
// Without these the OS may fall back to a font that breaks ligatures like द्ध, र्म, ष्य.
const DEVANAGARI_FONT_STACK =
  '"Noto Sans Devanagari", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", "Sanskrit Text", "Mangal", var(--font-divine, Cormorant Garamond), serif'

/**
 * Split a Devanagari verse into reveal-friendly tokens while preserving
 * intra-word grapheme clusters. Each whitespace run becomes its own token
 * so we can animate words individually but the shaper still sees a full
 * word and renders the conjuncts correctly.
 */
function splitVerseTokens(text: string): Array<{ word: string; isBreak: boolean }> {
  const tokens: Array<{ word: string; isBreak: boolean }> = []
  // Keep newlines as explicit breaks; split everything else on whitespace.
  const lines = text.split(/(\n+)/)
  for (const line of lines) {
    if (!line) continue
    if (/^\n+$/.test(line)) {
      tokens.push({ word: line, isBreak: true })
      continue
    }
    const parts = line.split(/(\s+)/)
    for (const part of parts) {
      if (!part) continue
      tokens.push({ word: part, isBreak: false })
    }
  }
  return tokens
}

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

      {/* Sanskrit — word-by-word reveal that preserves Devanagari conjuncts.
          Splitting into individual graphemes was breaking ligatures like
          द्ध, र्म, ष्य and forcing line wraps mid-word. We now render each
          whitespace-delimited word as a single shaped run. */}
      <div
        lang="sa"
        style={{
          fontFamily: DEVANAGARI_FONT_STACK,
          fontSize: 22,
          fontStyle: 'normal',
          fontWeight: 500,
          color: '#F0C040',
          lineHeight: 1.85,
          marginBottom: 14,
          wordBreak: 'keep-all',
          overflowWrap: 'normal',
        }}
      >
        {revealed
          ? splitVerseTokens(sanskrit).map((token, i) => {
              if (token.isBreak) {
                return (
                  <React.Fragment key={`br-${i}`}>
                    {Array.from({ length: token.word.length }).map((_, j) => (
                      <br key={j} />
                    ))}
                  </React.Fragment>
                )
              }
              if (/^\s+$/.test(token.word)) {
                return <span key={i}>{token.word}</span>
              }
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: i * 0.12, duration: 0.35 }}
                  style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                >
                  {token.word}
                </motion.span>
              )
            })
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
