'use client'

import { useEffect, useState } from 'react'
import { decryptContent } from '@/lib/crypto/journal'
import { findMood } from './constants'
import { WordReveal } from './WordReveal'
import type { JournalEntrySummary } from '@/hooks/useJournalEntries'

interface Props {
  entry: JournalEntrySummary
  onBack: () => void
}

function formatLong(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export const EntryDetail: React.FC<Props> = ({ entry, onBack }) => {
  const [plain, setPlain] = useState<string>('')
  const [decrypting, setDecrypting] = useState(true)

  useEffect(() => {
    let cancelled = false
    decryptContent(entry.encryptedContent ?? '').then((text) => {
      if (!cancelled) {
        setPlain(text)
        setDecrypting(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [entry.encryptedContent])

  const mood = findMood(entry.mood)
  const titleLen = entry.title.split(/\s+/).length
  const bodyInitialDelay = titleLen * 45 + 200

  return (
    <div style={{ background: '#050714', minHeight: '100%', paddingBottom: 48 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to journal list"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#D4A017',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 10,
            color: '#6B6355',
            letterSpacing: '0.1em',
          }}
        >
          {formatLong(entry.createdAt)}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {mood && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 18,
              background: mood.bg,
              border: `1px solid ${mood.glow}`,
              color: mood.color,
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
            }}
          >
            <span>{mood.emoji}</span>
            <span
              style={{
                fontFamily: '"Noto Sans Devanagari", sans-serif',
                fontSize: 12,
              }}
            >
              {mood.sanskrit}
            </span>
            <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {mood.label}
            </span>
          </div>
        )}

        <WordReveal
          text={entry.title || 'Untitled reflection'}
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 26,
            color: '#EDE8DC',
            lineHeight: 1.25,
            marginTop: 14,
          }}
        />

        <div
          style={{
            height: 1,
            margin: '18px 0',
            background:
              'linear-gradient(90deg,transparent,rgba(212,160,23,0.4) 30%,rgba(212,160,23,0.6) 50%,rgba(212,160,23,0.4) 70%,transparent)',
          }}
        />

        {decrypting ? (
          <div
            style={{
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
              color: '#6B6355',
              fontSize: 14,
            }}
          >
            Unsealing your reflection…
          </div>
        ) : (
          <WordReveal
            text={plain || '(empty reflection)'}
            initialDelay={bodyInitialDelay}
            style={{
              fontFamily: '"Crimson Text", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 16,
              color: '#EDE8DC',
              lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
            }}
          />
        )}

        {entry.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 20,
            }}
          >
            {entry.tags.map((t) => (
              <span
                key={t}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.35)',
                  color: '#F0C040',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 10,
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div
          role="complementary"
          aria-label="KIAAN's reflection"
          style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(212,160,23,0.15)',
            borderTop: '2px solid rgba(212,160,23,0.55)',
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,160,23,0.3), rgba(17,20,53,0.9))',
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
                  fontSize: 14,
                  color: '#EDE8DC',
                }}
              >
                Sakha reflects
              </div>
              <div style={{ fontSize: 9, color: '#6B6355' }}>
                Based on your mood and tags — content never read
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
              fontSize: 14,
              color: '#B8AE98',
              lineHeight: 1.7,
            }}
          >
            {mood
              ? `The ${mood.label.toLowerCase()} you marked today is itself a form of honesty. Arjuna stood in the same posture on the battlefield before Krishna spoke. Stay with what you wrote a little longer — the Gita calls this viveka: knowing the real from the projected.`
              : 'Thank you for showing up to the page today. The act of offering, more than the words themselves, is the beginning of sadhana.'}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: '8px 12px',
            background: 'rgba(27,79,187,0.08)',
            border: '1px solid rgba(27,79,187,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10,
            color: '#B8AE98',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          <span>🔒</span>
          <span>
            Analyzed from mood labels and tags · Your content is never read by the server
          </span>
        </div>
      </div>
    </div>
  )
}
