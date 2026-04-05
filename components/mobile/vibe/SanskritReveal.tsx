/**
 * SanskritReveal — Character-by-character Devanagari text reveal.
 *
 * Uses Intl.Segmenter for proper grapheme cluster boundaries so that
 * conjunct consonants like "क्ष" are treated as a single akshara.
 * Line breaks are inserted at daṇḍa characters (।।).
 */

'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface SanskritRevealProps {
  text: string
  staggerMs?: number
  className?: string
  style?: React.CSSProperties
  onComplete?: () => void
}

function splitIntoAksharas(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    // Intl.Segmenter is available in all modern browsers but not in all TS libs
    const SegmenterCtor = (Intl as Record<string, unknown>).Segmenter as new (
      locale: string,
      opts: { granularity: string }
    ) => { segment: (text: string) => Iterable<{ segment: string }> }
    const segmenter = new SegmenterCtor('hi', { granularity: 'grapheme' })
    return [...segmenter.segment(text)].map(s => s.segment)
  }
  // Fallback: spread handles most Unicode correctly
  return [...text]
}

function formatSanskritLines(text: string): string[][] {
  // Split at double daṇḍa (verse end) or single daṇḍa (line end)
  const lines = text.split(/।{1,2}\s*/).filter(Boolean)
  return lines.map(line => splitIntoAksharas(line.trim()))
}

export function SanskritReveal({
  text,
  staggerMs = 70,
  className,
  style,
  onComplete,
}: SanskritRevealProps) {
  const lines = useMemo(() => formatSanskritLines(text), [text])
  const totalChars = useMemo(() => lines.reduce((sum, l) => sum + l.length, 0), [lines])
  const [revealed, setRevealed] = useState(false)

  const handleComplete = useCallback(() => {
    if (!revealed) {
      setRevealed(true)
      onComplete?.()
    }
  }, [revealed, onComplete])

  // Reset revealed state when text changes
  useEffect(() => {
    setRevealed(false)
  }, [text])

  let globalIndex = 0

  return (
    <div className={className} style={style}>
      {lines.map((aksharas, lineIdx) => (
        <div key={lineIdx} style={{ marginBottom: lineIdx < lines.length - 1 ? 4 : 0 }}>
          {aksharas.map((akshara, charIdx) => {
            const idx = globalIndex++
            const isLast = idx === totalChars - 1

            return (
              <motion.span
                key={`${lineIdx}-${charIdx}`}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{
                  delay: idx * (staggerMs / 1000),
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                onAnimationComplete={isLast ? handleComplete : undefined}
                style={{
                  fontFamily: 'var(--font-devanagari), var(--font-divine), Cormorant Garamond, Georgia, serif',
                  fontSize: 'inherit',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: '#F0C040',
                  lineHeight: 1.8,
                  letterSpacing: '0.04em',
                }}
              >
                {akshara}
              </motion.span>
            )
          })}
          {lineIdx < lines.length - 1 && (
            <span style={{ color: '#F0C040', opacity: 0.5 }}> ।</span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * WordByWordReveal — Word-by-word text reveal for KIAAN insights.
 */
export function WordByWordReveal({
  text,
  staggerMs = 50,
  className,
  style,
  onComplete,
}: SanskritRevealProps) {
  const words = useMemo(() => text.split(/\s+/), [text])

  return (
    <span className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * (staggerMs / 1000),
            duration: 0.25,
            ease: 'easeOut',
          }}
          onAnimationComplete={i === words.length - 1 ? onComplete : undefined}
          style={{ display: 'inline' }}
        >
          {word}{i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  )
}

export default SanskritReveal
