'use client'

/**
 * CompanionChatBubble - Glass-morphism message bubble for dark orb UI.
 *
 * Renders user and KIAAN messages with mood-adaptive glass styling
 * on the dark companion background. Minimal, elegant, orb-themed.
 */

import { useEffect, useRef, useState } from 'react'

export interface ChatBubbleProps {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string | null
  phase?: string | null
  timestamp?: Date
  isLatest?: boolean
  onSpeak?: (text: string) => void
}

const MOOD_ACCENT: Record<string, string> = {
  happy: '#f59e0b',
  sad: '#3b82f6',
  anxious: '#a855f7',
  angry: '#ef4444',
  confused: '#f97316',
  peaceful: '#10b981',
  hopeful: '#eab308',
  lonely: '#6366f1',
  grateful: '#22c55e',
  excited: '#ec4899',
  overwhelmed: '#64748b',
  neutral: '#8b5cf6',
}

export default function CompanionChatBubble({
  id: _id,
  role,
  content,
  mood,
  phase: _phase,
  timestamp,
  isLatest,
  onSpeak,
}: ChatBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLatest && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isLatest])

  const isUser = role === 'user'
  const accent = mood ? MOOD_ACCENT[mood] || MOOD_ACCENT.neutral : MOOD_ACCENT.neutral

  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div
      ref={bubbleRef}
      className={`flex w-full mb-3 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* KIAAN avatar - small glowing dot */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            boxShadow: `0 0 12px ${accent}66`,
          }}
        >
          <span className="text-white text-[10px] font-bold">K</span>
        </div>
      )}

      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 ${
          isUser
            ? 'rounded-2xl rounded-br-sm'
            : 'rounded-2xl rounded-bl-sm'
        }`}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))',
                border: '1px solid rgba(139,92,246,0.2)',
                backdropFilter: 'blur(12px)',
              }
            : {
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${accent}22`,
                backdropFilter: 'blur(12px)',
                borderLeft: `2px solid ${accent}66`,
              }
        }
      >
        {/* Message content */}
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white/90' : 'text-white/85'}`}>
          {paragraphs.map((paragraph, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-white/30">
          {timestamp && (
            <span>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {!isUser && onSpeak && (
            <button
              onClick={() => onSpeak(content)}
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
              aria-label="Listen to this message"
              title="Listen"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center ml-2 mt-1">
          <span className="text-white/70 text-[10px] font-medium">You</span>
        </div>
      )}
    </div>
  )
}
