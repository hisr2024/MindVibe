'use client'

/**
 * KarmaCategorySelector — 6 category cards in a 2×3 grid.
 * Each card represents a karma type (action, speech, thought, etc.)
 * with Sanskrit label, English description, and category-specific color.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { KarmaCategory, KarmaCategoryConfig } from '../types'
import { KARMA_CATEGORIES } from '../types'

interface KarmaCategorySelectorProps {
  selected: KarmaCategory | null
  onSelect: (category: KarmaCategory) => void
}

export function KarmaCategorySelector({ selected, onSelect }: KarmaCategorySelectorProps) {
  const { triggerHaptic } = useHapticFeedback()

  const handleSelect = (cat: KarmaCategoryConfig) => {
    triggerHaptic('light')
    onSelect(cat.id)
  }

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: 'var(--sacred-text-muted, #6B6355)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          marginBottom: 10,
        }}
      >
        What kind of karma are you bringing?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {KARMA_CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id
          return (
            <motion.button
              key={cat.id}
              onClick={() => handleSelect(cat)}
              whileTap={{ scale: 0.97 }}
              animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              aria-label={`Select ${cat.label} karma category — ${cat.description}`}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '12px 14px',
                minHeight: 80,
                borderRadius: 16,
                border: isSelected
                  ? `1px solid ${cat.color}80`
                  : '1px solid rgba(255,255,255,0.06)',
                borderTop: isSelected
                  ? `2px solid ${cat.color}`
                  : '1px solid rgba(255,255,255,0.06)',
                background: isSelected
                  ? cat.bg
                  : 'linear-gradient(145deg, rgba(22,26,66,0.6), rgba(17,20,53,0.7))',
                boxShadow: isSelected
                  ? `0 0 16px ${cat.color}33`
                  : 'none',
                textAlign: 'left',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontStyle: 'italic',
                  fontSize: 20,
                  color: isSelected ? cat.color : `${cat.color}99`,
                  lineHeight: 1.2,
                }}
              >
                {cat.sanskrit}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  fontWeight: 500,
                  fontSize: 12,
                  color: 'var(--sacred-text-secondary, #B8AE98)',
                  marginTop: 2,
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  fontWeight: 300,
                  fontSize: 10,
                  color: 'var(--sacred-text-muted, #6B6355)',
                  marginTop: 1,
                }}
              >
                {cat.description}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
