'use client'

/**
 * DhyanMovement — Movement IV: The Sacred Meditation
 *
 * A guided visualization that displays meditation script lines one at a time,
 * personalised with the user's separation context. Supports auto-advance
 * (5s per line) and manual tap-to-advance. Includes a breathing indicator
 * and minimal navigation controls.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { SacredTextReveal } from '../../shared/SacredTextReveal'
import { DHYAN_SCRIPTS } from '../data/dhyanScripts'

interface DhyanMovementProps {
  separationType: string
  separatedFromName: string
  onComplete: () => void
}

const LINE_DURATION_MS = 5000

export function DhyanMovement({
  separationType,
  separatedFromName,
  onComplete,
}: DhyanMovementProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const completedRef = useRef(false)

  // Resolve script lines, replacing {name} with the user's input
  const rawLines = DHYAN_SCRIPTS[separationType] ?? DHYAN_SCRIPTS['death'] ?? []
  const displayName = separatedFromName || 'them'
  const lines = rawLines.map((line) => line.replace(/\{name\}/g, displayName))

  const totalLines = lines.length
  // 5 progress dots — each represents a segment of lines
  const dotsCount = 5
  const linesPerDot = Math.max(1, Math.ceil(totalLines / dotsCount))
  const activeDots = Math.min(dotsCount, Math.floor(currentLineIndex / linesPerDot) + 1)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  const advanceLine = useCallback(() => {
    setCurrentLineIndex((prev) => {
      const next = prev + 1
      if (next >= totalLines) {
        // Schedule completion on next tick to avoid state update during render
        setTimeout(handleComplete, 0)
        return prev
      }
      return next
    })
  }, [totalLines, handleComplete])

  const goBack = useCallback(() => {
    setCurrentLineIndex((prev) => Math.max(0, prev - 1))
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance) return
    const timer = setTimeout(advanceLine, LINE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [currentLineIndex, autoAdvance, advanceLine])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ background: '#020510' }}
      onClick={advanceLine}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') advanceLine()
        if (e.key === 'ArrowLeft') goBack()
      }}
      aria-label="Tap to advance meditation"
    >
      {/* Meditation text — centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <SacredTextReveal
          lines={lines}
          currentIndex={currentLineIndex}
        />
      </div>

      {/* Breathing indicator — gentle golden arc */}
      <div className="mb-8 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{
            width: 24,
            height: 12,
            borderBottom: '2px solid rgba(212, 160, 23, 0.5)',
            borderRadius: '0 0 50% 50%',
          }}
          animate={{
            scaleX: [1, 1.5, 1],
            scaleY: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: dotsCount }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: i < activeDots
                ? 'rgba(212, 160, 23, 0.8)'
                : 'rgba(212, 160, 23, 0.15)',
            }}
          />
        ))}
      </div>

      {/* Minimal controls */}
      <div
        className="flex items-center justify-between w-full max-w-[280px] mb-8 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="font-ui text-[11px] text-[var(--sacred-text-muted)] hover:text-[#B8AE98]
            transition-colors py-2 px-3"
          onClick={goBack}
          disabled={currentLineIndex === 0}
          aria-label="Previous line"
        >
          &larr; Back
        </button>

        <button
          className="font-ui text-[11px] text-[var(--sacred-text-muted)] hover:text-[#B8AE98]
            transition-colors py-2 px-3"
          onClick={() => setAutoAdvance((prev) => !prev)}
          aria-label={autoAdvance ? 'Switch to manual advance' : 'Switch to auto advance'}
        >
          {autoAdvance ? 'Auto' : 'Manual'}
        </button>

        <button
          className="font-ui text-[11px] text-[var(--sacred-text-muted)] hover:text-[#B8AE98]
            transition-colors py-2 px-3"
          onClick={handleComplete}
          aria-label="End meditation"
        >
          End
        </button>
      </div>
    </div>
  )
}

export default DhyanMovement
