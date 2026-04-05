'use client'

import { motion } from 'framer-motion'
import type { KarmaDashboard } from '@/types/karmalytix.types'
import { PATTERNS } from '@/types/karmalytix.types'
import { useKarmaLytixStore } from '@/stores/karmalytixStore'

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export const MobileKarmaInsight: React.FC<{ dashboard: KarmaDashboard | null }> = ({
  dashboard,
}) => {
  const { isRefreshing, refreshInsight } = useKarmaLytixStore()
  const insight = dashboard?.latest_report?.kiaan_insight
  const words = insight?.split(' ') ?? []
  const patterns = dashboard?.patterns ?? []
  const verses = dashboard?.latest_report?.recommended_verses ?? []

  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* KIAAN Insight */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(212,160,23,0.1), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.22)',
          borderTop: '3px solid rgba(212,160,23,0.7)',
          borderRadius: 18,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'radial-gradient(#1B4FBB, #050714)',
              border: '1.5px solid rgba(212,160,23,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#D4A017',
            }}
          >
            {'\u0950'}
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#D4A017', letterSpacing: '0.12em' }}>
              KIAAN REFLECTS
            </div>
            <div style={{ fontSize: 10, color: '#6B6355' }}>Based on your karma patterns</div>
          </div>
        </div>

        {isRefreshing ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                fontSize: 28,
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
        ) : insight ? (
          <div
            style={{
              fontFamily: '"Crimson Text", Georgia, serif',
              fontSize: 17,
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
                transition={{ delay: i * 0.045, duration: 0.25 }}
              >
                {w}{' '}
              </motion.span>
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: 14,
              color: '#6B6355',
              fontStyle: 'italic',
              fontFamily: '"Crimson Text", serif',
              textAlign: 'center',
              padding: '16px 0',
              lineHeight: 1.6,
            }}
          >
            Journal for a few days, set your moods, bookmark a verse &mdash;
            <br />
            then return here for Sakha&apos;s reflection.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={refreshInsight}
            style={{
              flex: 1,
              height: 38,
              background: 'none',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 19,
              color: '#D4A017',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Outfit',
            }}
          >
            {isRefreshing ? '...' : '\u21BB Refresh Wisdom'}
          </button>
        </div>
      </div>

      {/* Patterns */}
      {patterns.filter((p) => p.is_active).length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#6B6355',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            Patterns in Your Practice
          </div>
          {patterns
            .filter((p) => p.is_active)
            .map((p) => {
              const meta = PATTERNS[p.pattern_type as keyof typeof PATTERNS] ?? {
                label: p.pattern_type,
                color: '#D4A017',
              }
              const rgb = hexToRgb(meta.color)
              return (
                <div
                  key={p.id}
                  style={{
                    background:
                      'linear-gradient(145deg, rgba(22,26,66,0.9), rgba(17,20,53,0.98))',
                    border: `1px solid rgba(${rgb}, 0.25)`,
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: '0 14px 14px 0',
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#EDE8DC',
                        fontFamily: 'Outfit',
                      }}
                    >
                      {p.pattern_name}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 8,
                        background: `rgba(${rgb}, 0.15)`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${p.confidence_score * 100}%`,
                        background: meta.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#B8AE98',
                      fontStyle: 'italic',
                      fontFamily: '"Crimson Text", serif',
                      lineHeight: 1.55,
                    }}
                  >
                    {p.description}
                  </div>
                  {p.gita_verse_ref && (
                    <div style={{ fontSize: 9, color: '#D4A017', marginTop: 6 }}>
                      BG {p.gita_verse_ref.chapter}.{p.gita_verse_ref.verse} &middot;{' '}
                      {p.gita_verse_ref.theme}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* Recommended verses */}
      {verses.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#6B6355',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            Verses for Your Journey
          </div>
          {verses.map((v, i) => (
            <div
              key={i}
              style={{
                background:
                  'radial-gradient(ellipse at 0% 50%, rgba(212,160,23,0.06), rgba(17,20,53,0.98))',
                border: '1px solid rgba(212,160,23,0.12)',
                borderTop: '2px solid rgba(212,160,23,0.4)',
                borderRadius: 14,
                padding: 12,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: '4px 9px',
                  borderRadius: 8,
                  background: 'rgba(212,160,23,0.1)',
                  border: '1px solid rgba(212,160,23,0.25)',
                  fontSize: 10,
                  color: '#D4A017',
                  fontFamily: 'Outfit',
                  flexShrink: 0,
                }}
              >
                BG {v.chapter}.{v.verse}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#B8AE98',
                  fontFamily: '"Crimson Text", serif',
                  lineHeight: 1.4,
                }}
              >
                {v.theme}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 16, color: '#6B6355' }}>{'\u2192'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
