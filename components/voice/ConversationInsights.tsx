/**
 * ConversationInsights - Session insight panel for Voice Companion
 *
 * Shows a sliding panel with:
 * - Emotional journey timeline (how emotions shifted during conversation)
 * - Referenced Gita verses (quick access to wisdom shared)
 * - Session summary stats (messages, duration, mood shift)
 * - Save/share conversation option
 */

'use client'

import { useMemo } from 'react'

interface Message {
  id: string
  role: 'user' | 'kiaan' | 'system'
  content: string
  timestamp: Date
  verse?: { chapter: number; verse: number; text: string }
  emotion?: string
  type?: string
}

interface ConversationInsightsProps {
  messages: Message[]
  isOpen: boolean
  onClose: () => void
  onSaveConversation?: () => void
  sessionStartTime?: Date
}

const EMOTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  anxiety:   { label: 'Anxious',   color: '#f59e0b', icon: '~' },
  sadness:   { label: 'Sad',       color: '#3b82f6', icon: '⌢' },
  anger:     { label: 'Angry',     color: '#ef4444', icon: '!' },
  confusion: { label: 'Confused',  color: '#8b5cf6', icon: '?' },
  peace:     { label: 'Peaceful',  color: '#10b981', icon: '◯' },
  hope:      { label: 'Hopeful',   color: '#eab308', icon: '↑' },
  love:      { label: 'Loving',    color: '#ec4899', icon: '♡' },
}

export default function ConversationInsights({
  messages,
  isOpen,
  onClose,
  onSaveConversation,
  sessionStartTime,
}: ConversationInsightsProps) {
  // Extract emotional journey from messages
  const emotionalJourney = useMemo(() => {
    return messages
      .filter(m => m.emotion && m.role === 'user')
      .map(m => ({
        emotion: m.emotion!,
        time: m.timestamp,
        snippet: m.content.slice(0, 60) + (m.content.length > 60 ? '...' : ''),
      }))
  }, [messages])

  // Extract referenced verses
  const verses = useMemo(() => {
    return messages
      .filter(m => m.verse)
      .map(m => m.verse!)
      .filter((v, i, arr) => arr.findIndex(x => x.chapter === v.chapter && x.verse === v.verse) === i)
  }, [messages])

  // Session stats
  const stats = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user')
    const kiaanMessages = messages.filter(m => m.role === 'kiaan')
    const duration = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime.getTime()) / 60000)
      : 0

    const firstEmotion = emotionalJourney[0]?.emotion
    const lastEmotion = emotionalJourney[emotionalJourney.length - 1]?.emotion

    let moodShift: 'improved' | 'stable' | 'needs-care' | 'unknown' = 'unknown'
    if (firstEmotion && lastEmotion) {
      const positive = ['peace', 'hope', 'love']
      const negative = ['anxiety', 'sadness', 'anger']
      if (negative.includes(firstEmotion) && positive.includes(lastEmotion)) moodShift = 'improved'
      else if (positive.includes(firstEmotion) && negative.includes(lastEmotion)) moodShift = 'needs-care'
      else moodShift = 'stable'
    }

    return {
      userCount: userMessages.length,
      kiaanCount: kiaanMessages.length,
      duration,
      versesShared: verses.length,
      moodShift,
    }
  }, [messages, sessionStartTime, emotionalJourney, verses])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-gray-900/98 to-black/98 border-l border-white/10 overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-gray-900/80 backdrop-blur-md border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Session Insights</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50"
            aria-label="Close insights"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Session Stats */}
          <section>
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">This Session</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Your messages', value: stats.userCount, color: 'text-mv-sunrise' },
                { label: 'KIAAN responses', value: stats.kiaanCount, color: 'text-mv-ocean' },
                { label: 'Duration', value: `${stats.duration}m`, color: 'text-white/70' },
                { label: 'Verses shared', value: stats.versesShared, color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
                  <p className={`text-lg font-semibold ${color}`}>{value}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Mood shift indicator */}
            {stats.moodShift !== 'unknown' && (
              <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                stats.moodShift === 'improved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : stats.moodShift === 'needs-care'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}>
                <span className="text-sm">
                  {stats.moodShift === 'improved' ? '↑' : stats.moodShift === 'needs-care' ? '↓' : '→'}
                </span>
                <span className="text-xs font-medium">
                  {stats.moodShift === 'improved'
                    ? 'Your mood improved during this session'
                    : stats.moodShift === 'needs-care'
                    ? 'You may need more support today'
                    : 'Your emotional state remained steady'
                  }
                </span>
              </div>
            )}
          </section>

          {/* Emotional Journey Timeline */}
          {emotionalJourney.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Emotional Journey</h3>
              <div className="space-y-0">
                {emotionalJourney.map((entry, i) => {
                  const config = EMOTION_CONFIG[entry.emotion]
                  if (!config) return null
                  return (
                    <div key={i} className="flex items-start gap-3 relative">
                      {/* Timeline line */}
                      {i < emotionalJourney.length - 1 && (
                        <div className="absolute left-[11px] top-[22px] w-px h-[calc(100%+4px)] bg-white/10" />
                      )}
                      {/* Dot */}
                      <div
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{ backgroundColor: config.color + '25', color: config.color }}
                      >
                        {config.icon}
                      </div>
                      {/* Content */}
                      <div className="pb-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
                          <span className="text-[10px] text-white/30">
                            {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5 truncate">{entry.snippet}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Referenced Verses */}
          {verses.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Verses Shared</h3>
              <div className="space-y-2">
                {verses.map((verse, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl px-3.5 py-3 border border-white/5">
                    <p className="text-[10px] font-medium text-mv-ocean/70 mb-1">
                      Bhagavad Gita {verse.chapter}.{verse.verse}
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed italic">
                      {verse.text.slice(0, 120)}{verse.text.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-white/30">Start a conversation to see insights here.</p>
            </div>
          )}

          {/* Save conversation */}
          {messages.length > 0 && onSaveConversation && (
            <section className="pt-2">
              <button
                onClick={onSaveConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-mv-sunrise/10 border border-mv-sunrise/20 text-mv-sunrise text-sm font-medium hover:bg-mv-sunrise/15 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save to Sacred Reflections
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
