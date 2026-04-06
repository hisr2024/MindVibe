'use client'

import { useKIAANJournalInsight } from '@/hooks/useKIAANJournalInsight'
import { findMood, BAR_FILL_DURATION, BAR_FILL_DELAY, CARD_STAGGER } from '../constants'
import { WordReveal } from '../WordReveal'
import { JournalSkeleton } from '../JournalSkeleton'

export default function KIAANTab() {
  const { insight, prompts, isLoading, refresh } = useKIAANJournalInsight()

  const handlePromptTap = (text: string, mood?: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(
      'journal_prefill',
      JSON.stringify({ prompt: text, mood: mood ?? '' })
    )
    // Signal parent tab switch via URL hash — JournalScreen listens.
    const url = new URL(window.location.href)
    url.hash = 'editor'
    window.history.replaceState({}, '', url.toString())
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  if (isLoading) {
    return (
      <div style={{ paddingTop: 20 }}>
        <JournalSkeleton rows={3} />
      </div>
    )
  }

  if (!insight || insight.entryCount === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 60 }}>🪷</div>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 22,
            color: '#EDE8DC',
            marginTop: 12,
          }}
        >
          Your sacred library awaits
        </div>
        <div
          style={{
            fontFamily: '"Crimson Text", serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: '#B8AE98',
            lineHeight: 1.6,
            marginTop: 8,
            maxWidth: 300,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Journal for a few days — then return here for Sakha&rsquo;s weekly reflection.
        </div>
      </div>
    )
  }

  const dominantMood = findMood(insight.dominantMood)

  return (
    <div style={{ background: '#050714', padding: '4px 14px 80px' }}>
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(27,79,187,0.08)',
          border: '1px solid rgba(27,79,187,0.2)',
          borderRadius: 10,
          fontSize: 10,
          color: '#B8AE98',
          fontFamily: 'Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span>🔒</span>
        <span>Analyzed from metadata only · Your content is never read</span>
      </div>

      <div
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(212,160,23,0.08), rgba(22,26,66,0.6))',
          border: '1px solid rgba(212,160,23,0.18)',
          borderTop: '2px solid rgba(212,160,23,0.55)',
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(212,160,23,0.3), rgba(17,20,53,0.9))',
              border: '1px solid rgba(212,160,23,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#F0C040',
              animation: 'divineBreath 3s ease-in-out infinite',
            }}
          >
            ॐ
          </div>
          <div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: 16,
                color: '#EDE8DC',
              }}
            >
              This Week&rsquo;s Reflection
            </div>
            <div style={{ fontSize: 10, color: '#6B6355' }}>
              {insight.entryCount} entries
              {dominantMood ? ` · ${dominantMood.label.toLowerCase()} dominant` : ''}
            </div>
          </div>
        </div>

        <WordReveal
          text={insight.reflection}
          style={{
            fontFamily: '"Crimson Text", serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: '#EDE8DC',
            lineHeight: 1.85,
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={refresh}
            style={{
              flex: 1,
              padding: '8px 12px',
              minHeight: 40,
              borderRadius: 20,
              background: 'none',
              border: '1px solid rgba(212,160,23,0.25)',
              color: '#D4A017',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {insight.moodPattern.length > 0 && (
        <div
          style={{
            marginTop: 14,
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(212,160,23,0.15)',
            borderTop: '2px solid rgba(212,160,23,0.4)',
            borderRadius: 14,
            padding: 16,
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
            Mood this week
          </div>
          {insight.moodPattern.map((p, i) => {
            const m = findMood(p.mood)
            const color = m?.color ?? '#D4A017'
            return (
              <div key={p.mood} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    fontFamily: 'Outfit, sans-serif',
                    color: '#B8AE98',
                    marginBottom: 5,
                  }}
                >
                  <span>
                    {m?.emoji} {m?.label ?? p.mood}
                  </span>
                  <span style={{ color }}>{p.percentage}%</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${p.percentage}%`,
                      background: color,
                      borderRadius: 3,
                      animation: `barFill ${BAR_FILL_DURATION}ms ease-out both`,
                      animationDelay: `${BAR_FILL_DELAY + i * CARD_STAGGER}ms`,
                      // @ts-expect-error custom property for animation
                      '--bar-width': `${p.percentage}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
          <div
            style={{
              fontSize: 9,
              color: '#6B6355',
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            Based on mood labels attached to your entries
          </div>
        </div>
      )}

      {insight.verse && (
        <div
          style={{
            marginTop: 14,
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: '3px solid rgba(212,160,23,0.6)',
            borderRadius: '0 14px 14px 0',
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#D4A017',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Verse for your journey
          </div>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              color: '#F0C040',
              marginBottom: 8,
            }}
          >
            {insight.verse.reference} · {insight.verse.theme}
          </div>
          <div
            style={{
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              fontSize: 15,
              color: '#F0C040',
              lineHeight: 2,
              marginBottom: 8,
            }}
          >
            {insight.verse.sanskrit}
          </div>
          <div
            style={{
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
              fontSize: 13,
              color: '#B8AE98',
              lineHeight: 1.6,
            }}
          >
            {insight.verse.translation}
          </div>
        </div>
      )}

      {prompts.length > 0 && (
        <div
          style={{
            marginTop: 14,
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(212,160,23,0.15)',
            borderTop: '2px solid rgba(212,160,23,0.4)',
            borderRadius: 14,
            padding: 16,
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
            Sacred prompts
          </div>
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePromptTap(p.text, p.suggestedMood)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '12px 0',
                cursor: 'pointer',
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: 15,
                color: '#EDE8DC',
                lineHeight: 1.4,
                minHeight: 48,
              }}
            >
              {p.text}
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontStyle: 'normal',
                  fontSize: 9,
                  color: '#D4A017',
                  marginTop: 4,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Tap to write →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
