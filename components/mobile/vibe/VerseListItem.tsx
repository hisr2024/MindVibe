/**
 * VerseListItem — A single verse row in the chapter detail view.
 *
 * Shows verse number box, Sanskrit preview, English preview,
 * duration, and currently-playing indicator with animated wave bars.
 */

'use client'

import { motion } from 'framer-motion'

interface VerseListItemProps {
  chapter: number
  verse: number
  chapterColor: string
  sanskritPreview: string
  englishPreview: string
  duration?: string
  isPlaying: boolean
  onPlay: () => void
  onStop?: () => void
  onLongPress?: () => void
}

function MiniWaveform({ color }: { color: string }) {
  return (
    <div className="w-11 h-11 rounded-[10px] flex items-center justify-center gap-[3px]"
      style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{ height: [6, 16, 6] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function VerseListItem({
  chapter,
  verse,
  chapterColor,
  sanskritPreview,
  englishPreview,
  duration,
  isPlaying,
  onPlay,
  onStop,
  onLongPress,
}: VerseListItemProps) {
  return (
    <button
      onClick={isPlaying && onStop ? onStop : onPlay}
      aria-label={isPlaying ? 'Stop verse' : 'Play verse'}
      onContextMenu={e => { e.preventDefault(); onLongPress?.() }}
      className="flex items-center gap-3 w-full text-left px-4 py-3 transition-colors"
      style={isPlaying ? {
        borderLeft: `3px solid ${chapterColor}`,
        backgroundColor: chapterColor + '14',
      } : {
        borderLeft: '3px solid transparent',
      }}
    >
      {/* Verse number box or waveform */}
      {isPlaying ? (
        <MiniWaveform color={chapterColor} />
      ) : (
        <div
          className="flex-shrink-0 w-11 h-11 rounded-[10px] flex items-center justify-center"
          style={{
            backgroundColor: chapterColor + '22',
            border: `1px solid ${chapterColor}44`,
          }}
        >
          <span
            className="text-[10px] font-[family-name:var(--font-ui)]"
            style={{ color: chapterColor, fontWeight: 500 }}
          >
            {chapter}.{verse}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] truncate font-[family-name:var(--font-divine)] italic"
          style={{ color: '#F0C040' }}
        >
          {sanskritPreview || `Verse ${verse}`}
        </p>
        <p
          className="text-[11px] truncate mt-0.5 font-[family-name:var(--font-ui)]"
          style={{ color: '#B8AE98' }}
        >
          {englishPreview || 'Loading...'}
        </p>
      </div>

      {/* Duration */}
      {duration && (
        <span className="text-[10px] text-[#6B6355] flex-shrink-0 font-[family-name:var(--font-ui)]">
          {duration}
        </span>
      )}
    </button>
  )
}

export default VerseListItem
