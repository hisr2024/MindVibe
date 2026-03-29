'use client'

/**
 * MobileSanskritReveal — Character-by-character Devanagari text reveal.
 * Each akshara fades in with a blur-to-sharp transition and golden glow.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MobileSanskritRevealProps {
  text: string
  /** Callback when full reveal is complete */
  onComplete?: () => void
  /** Stagger delay between characters in ms */
  stagger?: number
  className?: string
}

export function MobileSanskritReveal({
  text,
  onComplete,
  stagger = 80,
  className = '',
}: MobileSanskritRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const characters = Array.from(text)

  useEffect(() => {
    const totalTime = characters.length * stagger + 600
    const timer = setTimeout(() => {
      setRevealed(true)
      onComplete?.()
    }, totalTime)
    return () => clearTimeout(timer)
  }, [characters.length, stagger, onComplete])

  return (
    <div className={`text-center ${className}`}>
      <p
        className="font-[family-name:var(--font-divine)] text-2xl leading-[1.8] tracking-[0.05em]"
        style={{ color: '#F0C040' }}
      >
        {characters.map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 0.4,
              delay: i * (stagger / 1000),
              ease: 'easeOut',
            }}
            style={{
              display: 'inline-block',
              textShadow: '0 0 12px rgba(212,160,23,0.4)',
              minWidth: char === ' ' ? '0.3em' : undefined,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
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
