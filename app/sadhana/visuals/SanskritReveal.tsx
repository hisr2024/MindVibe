'use client'

/**
 * SanskritReveal — Character-by-character text animation with golden glow.
 * Reveals text progressively with each character glowing as it appears.
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { splitGraphemes } from '@/lib/splitGraphemes'

interface SanskritRevealProps {
  /** Text to reveal. Pass a different key to the component when text changes to reset animation. */
  text: string
  subtext?: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function SanskritReveal({
  text,
  subtext,
  speed = 60,
  className = '',
  onComplete,
}: SanskritRevealProps) {
  const graphemes = useMemo(() => splitGraphemes(text), [text])
  const [visibleCount, setVisibleCount] = useState(0)
  const [subtextVisible, setSubtextVisible] = useState(false)

  useEffect(() => {
    if (visibleCount >= graphemes.length) {
      const timer = setTimeout(() => {
        setSubtextVisible(true)
        onComplete?.()
      }, 500)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [visibleCount, text, speed, onComplete])

  return (
    <div className={`text-center ${className}`}>
      {/* Main revealed text */}
      <p className="text-2xl md:text-3xl font-light leading-relaxed text-[#FFF8DC]">
        {graphemes.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={
              i < visibleCount
                ? { opacity: 1, filter: 'blur(0px)' }
                : { opacity: 0, filter: 'blur(4px)' }
            }
            transition={{ duration: 0.3 }}
            style={{
              textShadow:
                i === visibleCount - 1
                  ? '0 0 20px rgba(212,164,76,0.8), 0 0 40px rgba(212,164,76,0.4)'
                  : '0 0 8px rgba(212,164,76,0.2)',
            }}
          >
            {char}
          </motion.span>
        ))}
      </p>

      {/* Subtext fade-in */}
      <AnimatePresence>
        {subtextVisible && subtext && (
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg text-[#d4a44c]/70 font-light italic"
          >
            {subtext}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
