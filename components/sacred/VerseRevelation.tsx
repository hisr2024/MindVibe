'use client'

/**
 * VerseRevelation — Word-by-word stagger animation for Gita shlokas
 *
 * Each word appears one by one as if being spoken by Krishna.
 * Sanskrit text gets golden text-shadow, transliteration in italic.
 */

import { useReducedMotion } from 'framer-motion'

interface VerseRevelationProps {
  /** Sanskrit text (Devanagari) */
  sanskrit?: string
  /** Transliteration (Latin script) */
  transliteration?: string
  /** English meaning */
  meaning?: string
  /** Chapter and verse reference (e.g., "2.47") */
  reference?: string
  /** Stagger delay per word in ms */
  staggerMs?: number
  className?: string
}

export function VerseRevelation({
  sanskrit,
  transliteration,
  meaning,
  reference,
  staggerMs = 80,
  className = '',
}: VerseRevelationProps) {
  const reduceMotion = useReducedMotion()

  const renderWords = (text: string, baseClass: string) => {
    if (reduceMotion) {
      return <span className={baseClass}>{text}</span>
    }

    return text.split(/\s+/).map((word, i) => (
      <span
        key={`${word}-${i}`}
        className={`sacred-verse-word ${baseClass}`}
        style={{ animationDelay: `${i * staggerMs}ms` }}
      >
        {word}{' '}
      </span>
    ))
  }

  return (
    <div className={`sacred-shloka-card space-y-3 ${className}`}>
      {sanskrit && (
        <div className="sacred-text-divine text-lg text-[var(--sacred-divine-gold)] leading-relaxed"
          style={{ textShadow: '0 0 8px rgba(212, 160, 23, 0.3)' }}
        >
          {renderWords(sanskrit, '')}
        </div>
      )}

      {transliteration && (
        <div className="sacred-text-scripture text-sm italic text-[var(--sacred-text-secondary)]">
          {renderWords(transliteration, '')}
        </div>
      )}

      {meaning && (
        <div className="sacred-text-ui text-sm text-[var(--sacred-text-primary)] leading-relaxed">
          {renderWords(meaning, '')}
        </div>
      )}

      {reference && (
        <p className="sacred-label text-right mt-2">
          Chapter {reference}
        </p>
      )}
    </div>
  )
}

export default VerseRevelation
