'use client'

import { motion } from 'framer-motion'
import type { KarmaReport } from '@/types/karmalytix.types'

interface Props {
  report: KarmaReport
  onRefresh: () => void
  isRefreshing: boolean
}

function deltaColor(delta: number): string {
  if (delta > 0) return '16,185,129'
  if (delta < 0) return '239,68,68'
  return '107,99,85'
}

function deltaTextColor(delta: number): string {
  if (delta > 0) return '#6EE7B7'
  if (delta < 0) return '#FCA5A5'
  return '#6B6355'
}

export const WeeklyInsightCard: React.FC<Props> = ({ report, onRefresh, isRefreshing }) => {
  const delta = report.comparison_to_previous?.overall_delta ?? 0
  const words = report.kiaan_insight?.split(' ') ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Insight card */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(212,160,23,0.1), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.25)',
          borderTop: '3px solid rgba(212,160,23,0.8)',
          borderRadius: 18,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: '#D4A017',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {'\u2726'} KIAAN&apos;s Insight &middot; Week of {report.period_start}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'radial-gradient(#1B4FBB, #050714)',
              border: '1.5px solid rgba(212,160,23,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#D4A017',
            }}
          >
            {'\u0950'}
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#D4A017', letterSpacing: '0.1em' }}>
              Sakha speaks
            </div>
            <div style={{ fontSize: 9, color: '#6B6355' }}>Sacred karma reflection</div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              borderRadius: 10,
              background: `rgba(${deltaColor(delta)}, 0.12)`,
              border: `1px solid rgba(${deltaColor(delta)}, 0.3)`,
              fontSize: 11,
              color: deltaTextColor(delta),
            }}
          >
            {delta > 0 ? '\u2191' : delta < 0 ? '\u2193' : '\u2192'}
            {delta !== 0 ? ` ${Math.abs(delta)} pts` : ' stable'}
          </div>
        </div>

        {isRefreshing ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                fontSize: 24,
                animation: 'spin 2s linear infinite',
                display: 'inline-block',
                color: '#D4A017',
              }}
            >
              {'\u0950'}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#B8AE98',
                marginTop: 8,
                fontStyle: 'italic',
                fontFamily: '"Crimson Text", serif',
              }}
            >
              Asking KIAAN for sacred wisdom...
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: '"Crimson Text", Georgia, serif',
              fontSize: 16,
              fontStyle: 'italic',
              color: '#EDE8DC',
              lineHeight: 1.85,
            }}
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                {w}{' '}
              </motion.span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={onRefresh}
            style={{
              flex: 1,
              height: 36,
              background: 'none',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 18,
              color: '#D4A017',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Outfit',
            }}
          >
            {'\u21BB'} Refresh Wisdom
          </button>
        </div>
      </div>

      {/* Recommended verses */}
      {report.recommended_verses.length > 0 && (
        <div
          style={{
            background:
              'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.12)',
            borderTop: '2px solid rgba(212,160,23,0.4)',
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#D4A017',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Sacred Verses for You
          </div>
          {report.recommended_verses.map((v, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom:
                  i < report.recommended_verses.length - 1
                    ? '1px solid rgba(255,255,255,0.05)'
                    : 'none',
              }}
            >
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: 'rgba(212,160,23,0.1)',
                  border: '1px solid rgba(212,160,23,0.2)',
                  fontSize: 9,
                  color: '#D4A017',
                  flexShrink: 0,
                }}
              >
                BG {v.chapter}.{v.verse}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: '#B8AE98',
                  fontFamily: '"Crimson Text", serif',
                }}
              >
                {v.theme}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
