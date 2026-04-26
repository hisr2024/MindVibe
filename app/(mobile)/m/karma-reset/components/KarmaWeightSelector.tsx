'use client'

/**
 * KarmaWeightSelector — 4 flame levels arranged horizontally.
 * User taps the flame that matches the weight they feel.
 * Not a slider, not radio buttons — flame metaphor.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { DharmaFlameIcon } from '../visuals/DharmaFlameIcon'
import type { KarmaWeight } from '../types'
import { KARMA_WEIGHTS } from '../types'

interface KarmaWeightSelectorProps {
  selected: KarmaWeight | null
  onSelect: (weight: KarmaWeight) => void
  categoryColor?: string
}

export function KarmaWeightSelector({
  selected,
  onSelect,
  categoryColor = '#D4A017',
}: KarmaWeightSelectorProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: 'var(--sacred-text-muted, #6B6355)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          marginBottom: 12,
        }}
      >
        How heavy does this feel?
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          padding: '0 8px',
        }}
      >
        {KARMA_WEIGHTS.map((w, idx) => {
          const isSelected = selected === w.id
          const otherSelected = selected !== null && !isSelected
          return (
            <motion.button
              key={w.id}
              onClick={() => {
                triggerHaptic('light')
                onSelect(w.id)
              }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Select weight: ${w.label}`}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                opacity: otherSelected ? 0.45 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Every diya is alive — staggered phase keeps them out of sync */}
              <DharmaFlameIcon
                size={w.flameSize}
                intensity={isSelected ? 'bright' : otherSelected ? 'dim' : 'normal'}
                color={isSelected ? categoryColor : '#D4A017'}
                animate
                phase={idx}
              />
              <span
                style={{
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontStyle: 'italic',
                  fontSize: 11,
                  color: isSelected
                    ? categoryColor
                    : 'var(--sacred-text-muted, #6B6355)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {w.sanskrit}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  fontSize: 9,
                  color: isSelected
                    ? 'var(--sacred-text-secondary, #B8AE98)'
                    : 'var(--sacred-text-muted, #6B6355)',
                  textAlign: 'center',
                }}
              >
                {w.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
