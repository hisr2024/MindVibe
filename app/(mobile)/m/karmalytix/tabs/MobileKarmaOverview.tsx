'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { KarmaDashboard, DimensionKey } from '@/types/karmalytix.types'
import { DIMENSIONS } from '@/types/karmalytix.types'

function MobileKarmaEmptyState() {
  return (
    <div
      style={{
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 60, animation: 'glow 3s ease-in-out infinite' }}>
        {'\u{1FAB7}'}
      </div>
      <div
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 22,
          color: '#EDE8DC',
          fontStyle: 'italic',
        }}
      >
        Your Karma Story is Beginning
      </div>
      <div
        style={{
          fontFamily: '"Crimson Text", serif',
          fontStyle: 'italic',
          fontSize: 15,
          color: '#B8AE98',
          lineHeight: 1.7,
          maxWidth: 280,
        }}
      >
        Journal for a few days. Set your moods. Bookmark a verse. Then return here &mdash; and Sakha
        will reflect your dharmic journey.
      </div>
    </div>
  )
}

export const MobileKarmaOverview: React.FC<{ dashboard: KarmaDashboard | null }> = ({
  dashboard,
}) => {
  const [displayScore, setDisplayScore] = useState(0)
  const score = dashboard?.score
  const overall = score?.overall_score ?? 0
  const delta = dashboard?.latest_report?.comparison_to_previous?.overall_delta ?? 0

  useEffect(() => {
    const dur = 1200
    const t0 = Date.now()
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - t0) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayScore(Math.round(eased * overall))
      if (p >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [overall])

  const size = 148
  const r = 58
  const circ = 2 * Math.PI * r
  const offset = circ - (overall / 100) * circ

  if (!score) return <MobileKarmaEmptyState />

  function deltaColor(d: number): string {
    if (d > 0) return '16,185,129'
    if (d < 0) return '239,68,68'
    return '107,99,85'
  }

  function deltaTextColor(d: number): string {
    if (d > 0) return '#6EE7B7'
    if (d < 0) return '#FCA5A5'
    return '#6B6355'
  }

  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Score ring hero */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(212,160,23,0.12), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.25)',
          borderTop: '3px solid rgba(212,160,23,0.8)',
          borderRadius: 20,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#D4A017',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {'\u0915\u0930\u094D\u092E'} &middot; This Week
        </div>

        {/* SVG ring */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(212,160,23,0.1)"
              strokeWidth={10}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#D4A017"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: [0, 0, 0.2, 1] }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(212,160,23,0.5))' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 48,
                fontWeight: 300,
                color: '#F0C040',
                lineHeight: 1,
              }}
            >
              {displayScore}
            </div>
            <div style={{ fontSize: 9, color: '#6B6355', letterSpacing: '0.1em' }}>KARMA</div>
          </div>
        </div>

        {/* Delta badge */}
        <div
          style={{
            padding: '4px 14px',
            borderRadius: 12,
            background: `rgba(${deltaColor(delta)}, 0.12)`,
            border: `1px solid rgba(${deltaColor(delta)}, 0.3)`,
            fontSize: 11,
            color: deltaTextColor(delta),
            fontFamily: 'Outfit',
          }}
        >
          {delta > 0
            ? `\u2191 +${delta}`
            : delta === 0
              ? '\u2192 stable'
              : `\u2193 ${delta}`}{' '}
          from last week
        </div>
      </div>

      {/* 5 dimension bars */}
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.12)',
          borderTop: '2px solid rgba(212,160,23,0.4)',
          borderRadius: 16,
          padding: 14,
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
          5 Karma Dimensions
        </div>
        {(Object.entries(DIMENSIONS) as [DimensionKey, (typeof DIMENSIONS)[DimensionKey]][]).map(
          ([key, dim]) => {
            const val = (score[key] as number) ?? 0
            return (
              <div
                key={key}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
              >
                <div style={{ width: 80, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
                      fontSize: 10,
                      color: dim.color,
                      lineHeight: 2.0,
                    }}
                  >
                    {dim.sa}
                  </span>
                  <span style={{ fontSize: 8, color: '#6B6355', lineHeight: 1.2 }}>{dim.en}</span>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    style={{ height: '100%', background: dim.color, borderRadius: 3 }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: dim.color,
                    fontFamily: 'Outfit',
                    fontWeight: 500,
                    width: 28,
                    textAlign: 'right',
                  }}
                >
                  {val}
                </span>
              </div>
            )
          }
        )}
      </div>

      {/* Weekly metadata summary */}
      {dashboard?.latest_report && (
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.9), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.08)',
            borderRadius: 14,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#6B6355',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            This Week&apos;s Practice
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { n: 5, l: 'Dimensions tracked' },
              { n: dashboard.patterns.filter((p) => p.is_active).length, l: 'Active patterns' },
              {
                n: dashboard.latest_report.recommended_verses.length,
                l: 'Verses for you',
              },
            ].map(({ n, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 28,
                    fontWeight: 300,
                    color: '#F0C040',
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 9, color: '#6B6355', lineHeight: 1.3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
