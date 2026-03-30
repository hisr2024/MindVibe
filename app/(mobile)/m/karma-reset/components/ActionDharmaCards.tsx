'use client'

/**
 * ActionDharmaCards — 3 practice cards for the next 24 hours.
 * Each shows a Sanskrit concept, its meaning, a specific practice,
 * Gita reference, and a "mark as committed" toggle.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface ActionDharma {
  concept: string
  meaning: string
  practice: string
  gitaRef: string
}

interface ActionDharmaCardsProps {
  actions: ActionDharma[]
  onCommit?: (committed: string[]) => void
}

export function ActionDharmaCards({ actions, onCommit }: ActionDharmaCardsProps) {
  const [committed, setCommitted] = useState<Set<number>>(new Set())
  const { triggerHaptic } = useHapticFeedback()

  const toggleCommit = (index: number) => {
    triggerHaptic('light')
    setCommitted((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
    // Compute committed list after state update
    const next = new Set(committed)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onCommit?.(actions.filter((_, i) => next.has(i)).map((a) => a.concept))
  }

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          color: 'var(--sacred-text-muted, #6B6355)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          marginBottom: 10,
        }}
      >
        Practices for Today
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map((action, i) => {
          const isCommitted = committed.has(i)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              style={{
                background: isCommitted
                  ? 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(30,26,53,0.98))'
                  : 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                borderLeft: '4px solid #F97316',
                borderRadius: '0 16px 16px 0',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                      fontWeight: 500,
                      fontSize: 18,
                      color: '#F0C040',
                    }}
                  >
                    {action.concept}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                      fontWeight: 300,
                      fontSize: 11,
                      color: 'var(--sacred-text-muted, #6B6355)',
                    }}
                  >
                    ({action.meaning})
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                    fontSize: 13,
                    color: 'var(--sacred-text-primary, #EDE8DC)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {action.practice}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                    fontSize: 10,
                    color: '#D4A017',
                    textAlign: 'right',
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  {action.gitaRef}
                </p>
              </div>

              {/* Commit toggle */}
              <button
                onClick={() => toggleCommit(i)}
                aria-label={isCommitted ? 'Uncommit practice' : 'Commit to this practice'}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${isCommitted ? '#D4A017' : 'rgba(212,160,23,0.4)'}`,
                  background: isCommitted ? '#D4A017' : 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {isCommitted && (
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#050714" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
