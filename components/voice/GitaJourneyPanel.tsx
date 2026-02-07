'use client'

/**
 * Gita Journey Panel - Voice-Guided Journey Through All 18 Chapters
 *
 * Shows journey progress, chapter list, and active session controls.
 * Slides in from the right (matching ConversationInsights style).
 */

import { useMemo } from 'react'
import {
  getAllChapterSummaries,
  getJourneyProgress,
  isJourneyComplete,
  type GitaJourney,
  type SegmentType,
} from '@/utils/voice/gitaJourneyEngine'

interface ActiveSession {
  chapter: number
  segmentIndex: number
  totalSegments: number
  currentSegmentType: SegmentType
}

interface GitaJourneyPanelProps {
  isOpen: boolean
  onClose: () => void
  journey: GitaJourney | null
  onStartJourney: () => void
  onStartSession: (chapter: number) => void
  onResetJourney: () => void
  activeSession: ActiveSession | null
  isPlaying: boolean
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onStop: () => void
}

const SEGMENT_LABELS: Record<SegmentType, string> = {
  welcome: 'Welcome',
  story: 'Chapter Story',
  verse_intro: 'Verse Introduction',
  verse_sanskrit: 'Sanskrit Verse',
  verse_wisdom: 'Practical Wisdom',
  application: 'Life Application',
  exercise: 'Daily Exercise',
  reflection: 'Reflection',
  closing: 'Closing',
}

export default function GitaJourneyPanel({
  isOpen,
  onClose,
  journey,
  onStartJourney,
  onStartSession,
  onResetJourney,
  activeSession,
  isPlaying,
  onPause,
  onResume,
  onSkip,
  onStop,
}: GitaJourneyPanelProps) {
  const chapters = useMemo(() => getAllChapterSummaries(), [])
  const progress = journey ? getJourneyProgress(journey) : 0
  const completed = journey?.completedChapters ?? []
  const journeyDone = journey ? isJourneyComplete(journey) : false

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-l border-white/10 overflow-hidden flex flex-col"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white/90">Gita Journey</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {journey
                  ? journeyDone
                    ? 'Journey complete! Namaste.'
                    : `Chapter ${journey.currentChapter} of 18`
                  : 'Walk through all 18 chapters with KIAAN'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/40"
              aria-label="Close journey panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          {journey && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">{completed.length} of 18 chapters</span>
                <span className="text-mv-aurora/60 font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mv-aurora/60 to-mv-ocean/60 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Session Controls */}
        {activeSession && (
          <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.06] bg-mv-aurora/[0.03]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-mv-aurora/70 font-medium">
                  Now Playing: Chapter {activeSession.chapter}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {SEGMENT_LABELS[activeSession.currentSegmentType]} ({activeSession.segmentIndex + 1}/{activeSession.totalSegments})
                </p>
              </div>
            </div>

            {/* Segment progress */}
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-mv-aurora/50 transition-all duration-300"
                style={{ width: `${((activeSession.segmentIndex + 1) / activeSession.totalSegments) * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onStop}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors text-white/50"
                title="Stop session"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>

              <button
                onClick={isPlaying ? onPause : onResume}
                className="p-3 rounded-2xl bg-mv-aurora/20 hover:bg-mv-aurora/30 transition-colors text-mv-aurora border border-mv-aurora/20"
                title={isPlaying ? 'Pause' : 'Resume'}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={onSkip}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 transition-colors text-white/50"
                title="Skip to next segment"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4l10 8-10 8V4zM19 5v14h-2V5h2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {!journey ? (
            /* No journey started — start prompt */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mv-aurora/20 to-mv-ocean/20 border border-white/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🙏</span>
              </div>
              <h3 className="text-base font-medium text-white/80 mb-2">
                Begin Your Journey
              </h3>
              <p className="text-xs text-white/40 leading-relaxed mb-6 max-w-[260px]">
                KIAAN will walk you through all 18 chapters of the Bhagavad Gita as your divine best friend. Each chapter is a voice session with practical wisdom, exercises, and reflections.
              </p>
              <button
                onClick={onStartJourney}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-mv-aurora/20 to-mv-ocean/20 border border-mv-aurora/25 text-sm font-medium text-white/80 hover:from-mv-aurora/30 hover:to-mv-ocean/30 transition-all active:scale-95"
              >
                Start the Journey
              </button>
            </div>
          ) : (
            /* Chapter list */
            chapters.map((ch) => {
              const isCompleted = completed.includes(ch.chapter)
              const isCurrent = ch.chapter === journey.currentChapter && !isCompleted
              const isLocked = ch.chapter > journey.currentChapter && !isCompleted
              const isSessionActive = activeSession?.chapter === ch.chapter

              return (
                <button
                  key={ch.chapter}
                  onClick={() => {
                    if (!isLocked && !activeSession) {
                      onStartSession(ch.chapter)
                    }
                  }}
                  disabled={isLocked || !!activeSession}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${
                    isSessionActive
                      ? 'bg-mv-aurora/10 border-mv-aurora/25'
                      : isCurrent
                        ? 'bg-white/[0.04] border-mv-ocean/20 hover:bg-white/[0.06]'
                        : isCompleted
                          ? 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                          : 'bg-white/[0.01] border-white/[0.03] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Chapter number / status */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                          ? 'bg-mv-ocean/20 text-mv-ocean border border-mv-ocean/30'
                          : 'bg-white/[0.04] text-white/25'
                    }`}>
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        ch.chapter
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${
                          isCompleted ? 'text-white/50' : isCurrent ? 'text-white/80' : 'text-white/30'
                        }`}>
                          {ch.title}
                        </p>
                        {isCurrent && !activeSession && (
                          <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-mv-ocean/15 text-mv-ocean/70 font-medium">
                            Next
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isCompleted ? 'text-white/25' : 'text-white/35'}`}>
                        {ch.sanskritTitle}
                      </p>
                      <p className={`text-[11px] mt-1 leading-relaxed ${isCompleted ? 'text-white/30' : 'text-white/40'}`}>
                        {ch.coreTheme}
                      </p>
                      <p className="text-[9px] text-white/20 mt-1">
                        ~{ch.estimatedMinutes} min
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        {journey && !activeSession && (
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              {!journeyDone && (
                <button
                  onClick={() => onStartSession(journey.currentChapter)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-mv-aurora/15 to-mv-ocean/15 border border-mv-aurora/20 text-sm font-medium text-white/70 hover:from-mv-aurora/25 hover:to-mv-ocean/25 transition-all active:scale-[0.98]"
                >
                  {completed.length === 0 ? 'Begin Chapter 1' : `Continue: Chapter ${journey.currentChapter}`}
                </button>
              )}
              <button
                onClick={onResetJourney}
                className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-all"
                title="Reset journey"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
