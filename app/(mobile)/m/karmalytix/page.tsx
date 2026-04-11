'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKarmaLytixStore } from '@/stores/karmalytixStore'
import { MobileKarmaOverview } from './tabs/MobileKarmaOverview'
import { MobileKarmaDimensions } from './tabs/MobileKarmaDimensions'
import { MobileKarmaInsight } from './tabs/MobileKarmaInsight'

const TABS = [
  { id: 'overview', label: 'Overview', sa: '\u0938\u093E\u0930' },
  { id: 'dimensions', label: 'Dimensions', sa: '\u0906\u092F\u093E\u092E' },
  { id: 'insight', label: 'Insight', sa: '\u092C\u094B\u0927' },
] as const

type TabId = (typeof TABS)[number]['id']

function MobileKarmaLytixSkeleton() {
  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[180, 120, 100].map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: 16,
            background:
              'linear-gradient(90deg, rgba(22,26,66,0.6) 0%, rgba(22,26,66,0.9) 50%, rgba(22,26,66,0.6) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default function MobileKarmaLytixPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const { dashboard, isLoading, loadDashboard, refreshInsight } = useKarmaLytixStore()
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return (
    <div style={{ background: '#050714', minHeight: '100vh', position: 'relative' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            color: '#D4A017',
            fontSize: 18,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
          }}
        >
          {'\u2190'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 17,
              fontStyle: 'italic',
              color: '#EDE8DC',
            }}
          >
            {'\u0915\u0930\u094D\u092E\u0932\u0940\u091F\u093F\u0915\u094D\u0938'}
          </div>
          <div style={{ fontSize: 8, color: '#6B6355', letterSpacing: '0.14em' }}>
            KARMA ANALYTICS
          </div>
        </div>
        <button
          onClick={() => refreshInsight()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
            color: '#6B6355',
            cursor: 'pointer',
          }}
        >
          {'\u21BB'}
        </button>
      </div>

      {/* Privacy banner */}
      <div
        style={{
          margin: '10px 14px 0',
          padding: '7px 12px',
          background: 'rgba(27,79,187,0.08)',
          border: '1px solid rgba(27,79,187,0.2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12 }}>{'\u{1F512}'}</span>
        <span style={{ fontSize: 10, color: '#B8AE98' }}>
          Analyzed from metadata only &middot; Your content is never read
        </span>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          margin: '10px 14px',
          background: 'rgba(11,14,42,0.7)',
          borderRadius: 12,
          padding: 3,
          border: '1px solid rgba(212,160,23,0.12)',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 10,
              border: tab === t.id ? '1px solid rgba(212,160,23,0.3)' : '1px solid transparent',
              background: tab === t.id ? 'rgba(212,160,23,0.12)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span
              style={{
                fontFamily: '"Noto Sans Devanagari", sans-serif',
                fontSize: 10,
                color: tab === t.id ? '#F0C040' : '#6B6355',
                lineHeight: 1.5,
              }}
            >
              {t.sa}
            </span>
            <span
              style={{
                fontFamily: 'Outfit',
                fontSize: 9,
                color: tab === t.id ? '#D4A017' : '#6B6355',
                fontWeight: 500,
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ overflow: 'auto', paddingBottom: 80 }}>
        {isLoading ? (
          <MobileKarmaLytixSkeleton />
        ) : (
          <>
            {tab === 'overview' && <MobileKarmaOverview dashboard={dashboard} />}
            {tab === 'dimensions' && <MobileKarmaDimensions dashboard={dashboard} />}
            {tab === 'insight' && <MobileKarmaInsight dashboard={dashboard} />}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>
    </div>
  )
}
