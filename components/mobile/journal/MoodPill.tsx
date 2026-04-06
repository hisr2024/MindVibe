'use client'

import { motion } from 'framer-motion'
import type { MoodOption } from './constants'

interface Props {
  mood: MoodOption
  isSelected: boolean
  onSelect: () => void
}

export const MoodPill: React.FC<Props> = ({ mood, isSelected, onSelect }) => (
  <motion.button
    type="button"
    role="radio"
    aria-checked={isSelected}
    aria-label={mood.label}
    whileTap={{ scale: 0.95 }}
    onClick={onSelect}
    style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      borderRadius: 22,
      minHeight: 40,
      background: isSelected ? mood.bg : 'rgba(22,26,66,0.4)',
      border: `1px solid ${isSelected ? mood.glow : 'rgba(255,255,255,0.08)'}`,
      color: isSelected ? mood.color : '#B8AE98',
      cursor: 'pointer',
      touchAction: 'manipulation',
      transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
      boxShadow: isSelected ? `0 0 12px ${mood.glow}` : 'none',
    }}
  >
    <span style={{ fontSize: 15 }}>{mood.emoji}</span>
    <span
      style={{
        fontFamily: '"Noto Sans Devanagari", sans-serif',
        fontSize: 11,
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {mood.sanskrit}
    </span>
    <span
      style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: 10,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}
    >
      {mood.label}
    </span>
  </motion.button>
)
