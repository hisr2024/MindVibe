'use client'

import { useRef, useEffect } from 'react'
import type { MoodOption } from './constants'

interface Props {
  value: string
  onChange: (v: string) => void
  wordCount: number
  isRecording: boolean
  onVoiceTap: () => void
  mood?: MoodOption
}

export const SacredTextarea: React.FC<Props> = ({
  value,
  onChange,
  wordCount,
  isRecording,
  onVoiceTap,
  mood,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(140, Math.min(el.scrollHeight, 360))}px`
  }, [value])

  const milestone =
    wordCount >= 100
      ? 'Your heart speaks clearly…'
      : wordCount >= 50
        ? 'The truth is flowing…'
        : ''

  const baseBorder = mood ? mood.glow.replace('0.3', '0.18') : 'rgba(212,160,23,0.15)'
  const focusBorder = mood ? mood.glow.replace('0.3', '0.5') : 'rgba(212,160,23,0.5)'

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What stirs in you today? Let the words come without judgment…"
        aria-label="Sacred reflection content"
        className="sacred-textarea"
        style={{
          width: '100%',
          minHeight: 140,
          background: 'rgba(22,26,66,0.5)',
          border: `1px solid ${baseBorder}`,
          borderRadius: 20,
          padding: '14px 52px 14px 16px',
          fontFamily: '"Crimson Text", Georgia, serif',
          fontSize: 16,
          color: '#EDE8DC',
          lineHeight: 1.75,
          outline: 'none',
          resize: 'none',
          overflowY: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = focusBorder
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,160,23,0.08)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = baseBorder
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      <button
        type="button"
        onClick={onVoiceTap}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: isRecording ? 'rgba(185,28,28,0.2)' : 'rgba(22,26,66,0.7)',
          border: isRecording
            ? '1px solid rgba(239,68,68,0.5)'
            : '1px solid rgba(255,255,255,0.1)',
          color: isRecording ? '#EF4444' : '#B8AE98',
          fontSize: 16,
          cursor: 'pointer',
          touchAction: 'manipulation',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isRecording ? '⏹' : '🎙'}
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        <span
          style={{
            color: milestone ? '#D4A017' : '#6B6355',
            fontStyle: milestone ? 'italic' : 'normal',
            transition: 'color 0.3s',
          }}
        >
          {wordCount === 0 ? 'Begin writing…' : `✦ ${wordCount} words offered`}
          {milestone && ` · ${milestone}`}
        </span>
        {isRecording && (
          <span
            style={{
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#EF4444',
                display: 'inline-block',
              }}
            />
            Listening…
          </span>
        )}
      </div>
    </div>
  )
}
