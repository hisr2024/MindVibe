'use client'

import { motion } from 'framer-motion'
import type { KarmaDashboard, DimensionKey } from '@/types/karmalytix.types'
import { DIMENSIONS } from '@/types/karmalytix.types'

const DIMENSION_DETAILS: Record<
  DimensionKey,
  { description: string; gitaRef: string }
> = {
  emotional_balance: {
    description: 'How steady your inner state remains across different moods and experiences.',
    gitaRef: 'BG 2.70 \u2014 undisturbed like the ocean',
  },
  spiritual_growth: {
    description: 'Your trajectory of growth compared to previous periods of practice.',
    gitaRef: 'BG 6.35 \u2014 abhyasa + vairagya',
  },
  consistency: {
    description: 'The regularity and depth of your journaling and spiritual practice.',
    gitaRef: 'BG 6.17 \u2014 regularity in all things',
  },
  self_awareness: {
    description: 'Your ability to identify, name, and explore your inner states.',
    gitaRef: 'BG 6.5 \u2014 be your own friend',
  },
  wisdom_integration: {
    description: 'How actively you engage with Gita wisdom through bookmarks and assessments.',
    gitaRef: 'BG 18.66 \u2014 surrender to wisdom',
  },
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export const MobileKarmaDimensions: React.FC<{ dashboard: KarmaDashboard | null }> = ({
  dashboard,
}) => {
  const score = dashboard?.score
  const deltas = dashboard?.latest_report?.comparison_to_previous?.dimension_deltas ?? {}

  if (!score) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: '"Crimson Text", serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: '#6B6355',
            lineHeight: 1.7,
          }}
        >
          Start journaling to see your 5 karma dimensions analyzed here.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(Object.entries(DIMENSIONS) as [DimensionKey, (typeof DIMENSIONS)[DimensionKey]][]).map(
        ([key, dim], idx) => {
          const val = (score[key] as number) ?? 0
          const delta = (deltas as Record<string, number>)[key] ?? 0
          const detail = DIMENSION_DETAILS[key]

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              style={{
                background:
                  'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                border: `1px solid rgba(${hexToRgb(dim.color)}, 0.2)`,
                borderLeft: `3px solid ${dim.color}`,
                borderRadius: '0 14px 14px 0',
                padding: 14,
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
                      fontSize: 13,
                      color: dim.color,
                      lineHeight: 2.0,
                    }}
                  >
                    {dim.icon} {dim.sa}
                  </div>
                  <div style={{ fontSize: 10, color: '#B8AE98', marginTop: 1 }}>{dim.en}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {delta !== 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: delta > 0 ? '#6EE7B7' : '#FCA5A5',
                      }}
                    >
                      {delta > 0 ? `\u2191+${delta}` : `\u2193${delta}`}
                    </span>
                  )}
                  <div
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 28,
                      fontWeight: 300,
                      color: dim.color,
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + idx * 0.08 }}
                  style={{ height: '100%', background: dim.color, borderRadius: 3 }}
                />
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 12,
                  color: '#B8AE98',
                  fontFamily: '"Crimson Text", serif',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                {detail.description}
              </div>
              <div style={{ fontSize: 9, color: '#D4A017' }}>{detail.gitaRef}</div>
            </motion.div>
          )
        }
      )}
    </div>
  )
}
