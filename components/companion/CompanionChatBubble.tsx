'use client'

/**
 * CompanionChatBubble - Message bubble for the KIAAN best friend chat.
 *
 * Renders user and KIAAN messages with mood-adaptive styling,
 * smooth animations, and a warm conversational feel.
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

const MOOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  happy: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
  sad: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  anxious: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  angry: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
  confused: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
  peaceful: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  hopeful: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
  lonely: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
  grateful: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
  excited: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
  overwhelmed: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' },
  neutral: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '',
  sad: '',
  anxious: '',
  angry: '',
  confused: '',
  peaceful: '',
  hopeful: '',
  lonely: '',
  grateful: '',
  excited: '',
  overwhelmed: '',
  neutral: '',
}

export default function CompanionChatBubble({
  id,
  role,
  content,
  mood,
  phase,
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
  const moodStyle = mood ? MOOD_COLORS[mood] || MOOD_COLORS.neutral : MOOD_COLORS.neutral

  // Format content with paragraph breaks
  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div
      ref={bubbleRef}
      className={`flex w-full mb-3 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* KIAAN avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 mt-1 shadow-md">
          <span className="text-white text-xs font-bold">K</span>
        </div>
      )}

      <div
        className={`max-w-[80%] sm:max-w-[70%] ${
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-md'
            : `${moodStyle.bg} ${moodStyle.border} border ${moodStyle.text} rounded-2xl rounded-bl-md`
        } px-4 py-3 shadow-sm`}
      >
        {/* Mood indicator for KIAAN messages */}
        {!isUser && mood && mood !== 'neutral' && (
          <div className="flex items-center gap-1.5 mb-1.5 text-xs opacity-70">
            <span>{MOOD_EMOJI[mood] || ''}</span>
            <span className="capitalize">{mood}</span>
            {phase && (
              <span className="ml-auto opacity-50 text-[10px]">{phase}</span>
            )}
          </div>
        )}

        {/* Message content */}
        <div className={`text-sm leading-relaxed ${isUser ? '' : ''}`}>
          {paragraphs.map((paragraph, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between mt-2 text-xs ${
          isUser ? 'text-white/60' : 'opacity-40'
        }`}>
          {timestamp && (
            <span>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {/* Speak button for KIAAN messages */}
          {!isUser && onSpeak && (
            <button
              onClick={() => onSpeak(content)}
              className="ml-2 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Listen to this message"
              title="Listen"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center ml-2 mt-1 shadow-md">
          <span className="text-white text-xs font-bold">You</span>
        </div>
      )}
    </div>
  )
}
