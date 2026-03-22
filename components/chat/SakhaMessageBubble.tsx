'use client'

/**
 * SakhaMessageBubble — Sacred message bubble with word-by-word streaming.
 *
 * User messages: right-aligned, golden gradient, slide-in from right.
 * Sakha messages: left-aligned, dark surface with golden border, avatar on left,
 *   words fade in one-by-one (60ms stagger), verse refs rendered as golden chips.
 *
 * Supports long-press to copy and action buttons (Copy, Voice Output).
 */

import { useMemo, useCallback, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SakhaAvatar } from './SakhaAvatar'
import { VerseCitationChip } from './VerseCitationChip'
import { CopyButton } from './CopyButton'
import { VoiceOutputButton } from '@/components/voice/VoiceOutputButton'
import { hapticPulse } from '@/utils/voice/hapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'

type AvatarState = 'idle' | 'thinking' | 'speaking'

interface SakhaMessageBubbleProps {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  isStreaming?: boolean
  avatarState?: AvatarState
}

interface VerseRef {
  chapter: number
  verse: number
}

/** Max words to animate individually — prevents performance issues on long responses. */
const MAX_ANIMATED_WORDS = 200

/**
 * Extract Bhagavad Gita verse references from text.
 * Matches patterns like "BG 2.47", "BG 3:12", "BG2.47".
 */
function extractVerseRefs(text: string): VerseRef[] {
  const regex = /BG\s*(\d+)[.:]\s*(\d+)/gi
  const matches = [...text.matchAll(regex)]
  const seen = new Set<string>()
  const refs: VerseRef[] = []

  for (const m of matches) {
    const chapter = parseInt(m[1], 10)
    const verse = parseInt(m[2], 10)
    const key = `${chapter}.${verse}`
    if (!seen.has(key) && chapter >= 1 && chapter <= 18 && verse >= 1) {
      seen.add(key)
      refs.push({ chapter, verse })
    }
  }

  return refs
}

export function SakhaMessageBubble({
  id,
  sender,
  text,
  timestamp,
  isStreaming = false,
  avatarState = 'idle',
}: SakhaMessageBubbleProps) {
  const prefersReducedMotion = useReducedMotion()
  const { language } = useLanguage()
  const [showCopied, setShowCopied] = useState(false)

  const isUser = sender === 'user'
  const isSakha = sender === 'assistant'

  // Split text into words for staggered animation (Sakha messages only)
  const words = useMemo(() => {
    if (!text) return []
    return text.split(/(\s+)/).filter(Boolean)
  }, [text])

  // Extract verse references (only when streaming is done)
  const verseRefs = useMemo(() => {
    if (isStreaming || !text || isUser) return []
    return extractVerseRefs(text)
  }, [text, isStreaming, isUser])

  // Format timestamp for display
  const formattedTime = useMemo(() => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }, [timestamp])

  // Long press / right-click to copy
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!text) return
      hapticPulse()
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setShowCopied(true)
          setTimeout(() => setShowCopied(false), 1500)
        }).catch(() => {
          // Clipboard write failed silently
        })
      }
    },
    [text]
  )

  // --- User message ---
  if (isUser) {
    return (
      <motion.div
        layout
        initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex justify-end"
        onContextMenu={handleContextMenu}
      >
        <div className="relative max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/10 px-4 py-3">
          <p className="text-sm leading-relaxed text-[#f5f0e8]">{text}</p>
          {formattedTime && (
            <p className="mt-1 text-right text-[10px] text-[#7a7060]">
              {formattedTime}
            </p>
          )}
          {showCopied && (
            <span className="absolute -top-6 right-2 rounded bg-[#d4a44c]/90 px-2 py-0.5 text-[10px] text-[#050507]">
              Copied
            </span>
          )}
        </div>
      </motion.div>
    )
  }

  // --- Sakha (assistant) message ---
  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-start gap-2"
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      <div className="mt-1 flex-shrink-0">
        <SakhaAvatar
          state={isStreaming ? avatarState : 'idle'}
          size="sm"
        />
      </div>

      {/* Message content */}
      <div className="relative max-w-[80%]">
        <div className="rounded-2xl rounded-tl-sm border-l-2 border-[#e8b54a] bg-[#0f0f18] px-4 py-3">
          {/* Word-by-word streaming text */}
          <div className="text-sm leading-relaxed text-[#f5f0e8]">
            {isSakha && !prefersReducedMotion && isStreaming ? (
              // Streaming: animate each word individually
              words.map((word, i) => {
                const shouldAnimate = i < MAX_ANIMATED_WORDS
                return (
                  <motion.span
                    key={`${id}-w-${i}`}
                    initial={shouldAnimate ? { opacity: 0 } : undefined}
                    animate={{ opacity: 1 }}
                    transition={
                      shouldAnimate
                        ? { duration: 0.2, delay: i * 0.06 }
                        : undefined
                    }
                  >
                    {word}
                  </motion.span>
                )
              })
            ) : (
              // Static: render all text at once
              <span>{text}</span>
            )}
          </div>

          {/* Verse citation chips (shown after streaming completes) */}
          {verseRefs.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {verseRefs.map(ref => (
                <VerseCitationChip
                  key={`${ref.chapter}-${ref.verse}`}
                  chapter={ref.chapter}
                  verse={ref.verse}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Timestamp + actions */}
        <div className="mt-1 flex items-center gap-2 px-1">
          {formattedTime && (
            <span className="text-[10px] text-[#7a7060]">{formattedTime}</span>
          )}
          {!isStreaming && text && (
            <>
              <CopyButton text={text} className="opacity-60 hover:opacity-100" />
              <VoiceOutputButton
                text={text}
                language={language}
                className="opacity-60 hover:opacity-100"
              />
            </>
          )}
        </div>

        {showCopied && (
          <span className="absolute -top-6 left-2 rounded bg-[#d4a44c]/90 px-2 py-0.5 text-[10px] text-[#050507]">
            Copied
          </span>
        )}
      </div>
    </motion.div>
  )
}
