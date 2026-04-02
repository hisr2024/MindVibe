'use client'

/**
 * MobileSanskritReveal — Grapheme-cluster-by-cluster Devanagari text reveal.
 * Uses Intl.Segmenter to correctly split Devanagari into aksharas (grapheme
 * clusters), keeping base characters + combining marks together so they
 * render as proper conjuncts without orphaned dotted circles.
 */

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

interface MobileSanskritRevealProps {
  text: string
  /** Callback when full reveal is complete */
  onComplete?: () => void
  /** Stagger delay between grapheme clusters in ms */
  stagger?: number
  className?: string
}

/**
 * Split text into grapheme clusters using Intl.Segmenter.
 * Falls back to splitting on spaces (word-by-word) if Segmenter is unavailable.
 * This prevents Devanagari combining marks (matras, virama) from being
 * separated from their base characters.
 */
function splitIntoGraphemes(text: string): string[] {
  // Use Intl.Segmenter for correct Devanagari grapheme cluster splitting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IntlAny = Intl as any
  if (typeof Intl !== 'undefined' && IntlAny.Segmenter) {
    const segmenter = new IntlAny.Segmenter('hi', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s: any) => s.segment as string)
  }
  // Fallback: split on word boundaries so combining marks stay grouped
  return text.split(/(\s+)/).filter(Boolean)
}

export function MobileSanskritReveal({
  text,
  onComplete,
  stagger = 80,
  className = '',
}: MobileSanskritRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const graphemes = useMemo(() => splitIntoGraphemes(text), [text])

  useEffect(() => {
    const totalTime = graphemes.length * stagger + 600
    const timer = setTimeout(() => {
      setRevealed(true)
      onComplete?.()
    }, totalTime)
    return () => clearTimeout(timer)
  }, [graphemes.length, stagger, onComplete])

  return (
    <div className={`text-center relative ${className}`}>
      <p
        className="font-[family-name:var(--font-divine)] text-2xl leading-[1.8] tracking-[0.05em]"
        style={{ color: '#F0C040' }}
      >
        {graphemes.map((grapheme, i) => {
          const isSpace = /^\s+$/.test(grapheme)
          return (
            <motion.span
              key={`${i}-${grapheme}`}
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{
                duration: 0.4,
                delay: i * (stagger / 1000),
                ease: 'easeOut',
              }}
              style={{
                display: 'inline',
                textShadow: '0 0 12px rgba(212,160,23,0.4)',
                ...(isSpace ? { whiteSpace: 'pre' } : {}),
              }}
            >
              {isSpace ? '\u00A0' : grapheme}
            </motion.span>
          )
        })}
      </p>

      {/* Golden glow pulse after full reveal */}
      {revealed && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(240,192,64,0.15), transparent 70%)',
          }}
        />
      )}
    </div>
  )
}
