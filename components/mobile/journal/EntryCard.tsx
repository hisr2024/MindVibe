'use client'

import { motion } from 'framer-motion'
import { findMood } from './constants'
import type { JournalEntrySummary } from '@/hooks/useJournalEntries'

interface Props {
  entry: JournalEntrySummary
  index: number
  onOpen: (id: string) => void
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export const EntryCard: React.FC<Props> = ({ entry, index, onOpen }) => {
  const mood = findMood(entry.mood)
  const accent = mood?.color ?? '#D4A017'

  const previewBits: string[] = []
  if (entry.tags.length > 0) previewBits.push(entry.tags.map((t) => `#${t}`).join(' '))
  const preview = previewBits.join(' · ') || 'Encrypted reflection · only you can read its words'

  return (
    <motion.button
      type="button"
      role="article"
      aria-label={`${entry.title} · ${formatDate(entry.createdAt)}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(entry.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'rgba(22,26,66,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: '0 14px 14px 0',
        padding: '12px 14px',
        marginBottom: 10,
        cursor: 'pointer',
        touchAction: 'manipulation',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#6B6355', fontFamily: 'Outfit, sans-serif' }}>
          {formatDate(entry.createdAt)}
        </span>
        {mood && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: mood.color,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <span>{mood.emoji}</span>
            <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {mood.label}
            </span>
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 17,
          color: '#EDE8DC',
          lineHeight: 1.3,
          marginTop: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.title || 'Untitled reflection'}
      </div>
      <div
        style={{
          fontFamily: '"Crimson Text", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: '#B8AE98',
          lineHeight: 1.5,
          marginTop: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {preview}
      </div>
    </motion.button>
  )
}
