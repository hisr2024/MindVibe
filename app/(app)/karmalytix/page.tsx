'use client'

import { useEffect } from 'react'
import { useKarmaLytixStore } from '@/stores/karmalytixStore'
import { KarmaScoreRadar } from '@/components/karmalytix/KarmaScoreRadar'
import { WeeklyInsightCard } from '@/components/karmalytix/WeeklyInsightCard'

export default function KarmaLytixPage() {
  const { dashboard, isLoading, isRefreshing, error, loadDashboard, refreshInsight, clearError } =
    useKarmaLytixStore()

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050714',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              animation: 'spin 2s linear infinite',
              display: 'inline-block',
              color: '#D4A017',
            }}
          >
            {'\u0950'}
          </div>
          <div style={{ fontSize: 14, color: '#B8AE98', marginTop: 12, fontFamily: 'Outfit' }}>
            Loading karma analysis...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050714',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1FAB7}'}</div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 22,
              color: '#EDE8DC',
              marginBottom: 8,
            }}
          >
            Unable to load karma data
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#6B6355',
              marginBottom: 20,
              fontFamily: '"Crimson Text", serif',
            }}
          >
            {error}
          </div>
          <button
            onClick={() => {
              clearError()
              loadDashboard()
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1B4FBB, #0E7490)',
              border: '1px solid rgba(212,160,23,0.38)',
              color: '#F8F6F0',
              fontFamily: 'Outfit',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard?.score) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050714',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 60 }}>{'\u{1FAB7}'}</div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 26,
              color: '#EDE8DC',
              fontStyle: 'italic',
              marginTop: 16,
            }}
          >
            Your Karma Story is Beginning
          </div>
          <div
            style={{
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
              fontSize: 16,
              color: '#B8AE98',
              lineHeight: 1.7,
              marginTop: 12,
            }}
          >
            Journal for a few days, set your moods, bookmark a verse &mdash; then return here for
            Sakha&apos;s reflection.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050714', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 32,
              fontStyle: 'italic',
              color: '#EDE8DC',
            }}
          >
            {'\u0915\u0930\u094D\u092E\u0932\u0940\u091F\u093F\u0915\u094D\u0938'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#6B6355',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Sacred Reflections Analysis
          </div>
        </div>

        {/* Privacy banner */}
        <div
          style={{
            margin: '0 auto 24px',
            maxWidth: 600,
            padding: '8px 16px',
            background: 'rgba(27,79,187,0.08)',
            border: '1px solid rgba(27,79,187,0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 14 }}>{'\u{1F512}'}</span>
          <span style={{ fontSize: 12, color: '#B8AE98' }}>
            Analyzed from metadata only &middot; Your content is never read
          </span>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Radar chart */}
          <div
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(212,160,23,0.08), rgba(17,20,53,0.98))',
              border: '1px solid rgba(212,160,23,0.2)',
              borderTop: '3px solid rgba(212,160,23,0.7)',
              borderRadius: 20,
              padding: 24,
            }}
          >
            <KarmaScoreRadar score={dashboard.score} />
          </div>

          {/* Right: Insight + verses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dashboard.latestReport && (
              <WeeklyInsightCard
                report={dashboard.latestReport}
                onRefresh={refreshInsight}
                isRefreshing={isRefreshing}
              />
            )}

            {/* Patterns */}
            {dashboard.patterns.length > 0 && (
              <div
                style={{
                  background:
                    'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                  border: '1px solid rgba(212,160,23,0.12)',
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
                  Active Patterns
                </div>
                {dashboard.patterns
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background:
                            PATTERNS[p.patternType as keyof typeof PATTERNS]?.color ?? '#D4A017',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ fontSize: 13, color: '#EDE8DC', fontFamily: 'Outfit' }}>
                        {p.patternName}
                      </div>
                      <div
                        style={{
                          marginLeft: 'auto',
                          fontSize: 10,
                          color: '#6B6355',
                        }}
                      >
                        {Math.round(p.confidenceScore * 100)}%
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PATTERNS = {
  recurring_emotion: { color: '#06B6D4' },
  growth_trajectory: { color: '#10B981' },
  stagnation: { color: '#F59E0B' },
  breakthrough: { color: '#D4A017' },
  cycle: { color: '#8B5CF6' },
} as const
