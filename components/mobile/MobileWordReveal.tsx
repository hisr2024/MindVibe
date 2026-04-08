'use client'

/**
 * MobileWordReveal — Divine word-by-word text animation
 *
 * Each word materializes from sacred mist: blur(2px) → blur(0),
 * opacity 0 → 1, translateY 6px → 0. Creates the feeling of
 * someone gently speaking each word into existence.
 *
 * Inspired by the SakhaMessageBubble streaming pattern but
 * designed as a standalone, reusable sacred text reveal.
 */

import { useEffect, useState, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MobileWordRevealProps {
  /** The text to reveal word by word */
  text: string
  /** Delay before starting reveal (ms) */
  delay?: number
  /** Time between each word (ms) */
  speed?: number
  /** Called when all words have been revealed */
  onComplete?: () => void
  /** Additional CSS classes */
  className?: string
  /** Text element type */
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4'
}

export function MobileWordReveal({
  text,
  delay = 0,
  speed = 60,
  onComplete,
  className = '',
  as: Tag = 'p',
}: MobileWordRevealProps) {
  const reduceMotion = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const words = text.split(/\s+/).filter(Boolean)
  const totalWords = words.length

  // Start after delay
  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(totalWords)
      return
    }
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [delay, reduceMotion, totalWords])

  // Reveal words one by one
  useEffect(() => {
    if (!started || visibleCount >= totalWords) return

    const timer = setTimeout(() => {
      setVisibleCount(prev => {
        const next = prev + 1
        if (next >= totalWords) {
          onCompleteRef.current?.()
        }
        return next
      })
    }, speed)

    return () => clearTimeout(timer)
  }, [started, visibleCount, totalWords, speed])

  // Reduced motion: show all text immediately
  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
          animate={
            i < visibleCount
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 6, filter: 'blur(2px)' }
          }
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.0, 1.0], // sacred-ease-divine-in
          }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  )
}

/**
 * MobileSentenceReveal — Sentence-by-sentence reveal
 * For longer text blocks where word-by-word would be too slow.
 */
interface MobileSentenceRevealProps {
  /** Text to reveal sentence by sentence */
  text: string
  /** Delay before starting (ms) */
  delay?: number
  /** Time between each sentence (ms) */
  speed?: number
  /** Called when all sentences have been revealed */
  onComplete?: () => void
  className?: string
}

export function MobileSentenceReveal({
  text,
  delay = 0,
  speed = 400,
  onComplete,
  className = '',
}: MobileSentenceRevealProps) {
  const reduceMotion = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const totalSentences = sentences.length

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(totalSentences)
      return
    }
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [delay, reduceMotion, totalSentences])

  useEffect(() => {
    if (!started || visibleCount >= totalSentences) return

    const timer = setTimeout(() => {
      setVisibleCount(prev => {
        const next = prev + 1
        if (next >= totalSentences) {
          onCompleteRef.current?.()
        }
        return next
      })
    }, speed)

    return () => clearTimeout(timer)
  }, [started, visibleCount, totalSentences, speed])

  if (reduceMotion) {
    return <p className={className}>{text}</p>
  }

  return (
    <div className={className} aria-label={text}>
      {sentences.map((sentence, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={
            i < visibleCount
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 8 }
          }
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {sentence}
        </motion.span>
      ))}
    </div>
  )
}

export default MobileWordReveal
