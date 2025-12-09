/**
 * Voice Output Button Component
 * Speaker button for text-to-speech on KIAAN responses
 */

'use client'

import { useState, useEffect } from 'react'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'

export interface VoiceOutputButtonProps {
  text: string
  language?: string
  className?: string
}

export function VoiceOutputButton({
  text,
  language = 'en',
  className = '',
}: VoiceOutputButtonProps) {
  const [showControls, setShowControls] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)

  const {
    isSpeaking,
    isPaused,
    isSupported,
    speak,
    pause,
    resume,
    cancel,
    updateRate,
  } = useVoiceOutput({
    language,
    rate: playbackRate,
    onEnd: () => {
      setShowControls(false)
    },
  })

  // Update rate when changed
  useEffect(() => {
    updateRate(playbackRate)
  }, [playbackRate, updateRate])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  const handleSpeak = () => {
    if (isSpeaking && !isPaused) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      speak(text)
      setShowControls(true)
    }
  }

  const handleStop = () => {
    cancel()
    setShowControls(false)
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Main speaker button */}
      <button
        onClick={handleSpeak}
        className={`group flex items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${className}`}
        aria-label={isSpeaking ? (isPaused ? 'Resume speaking' : 'Pause speaking') : 'Read aloud'}
        title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read this response aloud'}
      >
        {/* Speaker Icon */}
        {!isSpeaking && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-orange-400"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}

        {/* Pause Icon */}
        {isSpeaking && !isPaused && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-orange-400 animate-pulse"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        )}

        {/* Play Icon (when paused) */}
        {isSpeaking && isPaused && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-orange-400"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}

        <span>{isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
      </button>

      {/* Playback controls (shown when speaking) */}
      {showControls && isSpeaking && (
        <div className="flex items-center gap-1 animate-fadeIn">
          {/* Stop button */}
          <button
            onClick={handleStop}
            className="flex items-center justify-center h-7 w-7 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
            aria-label="Stop speaking"
            title="Stop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-1 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2 py-1">
            <span className="text-[10px] text-orange-300 uppercase tracking-wider">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-orange-500/30 text-orange-200'
                    : 'text-orange-300/70 hover:text-orange-200'
                }`}
                aria-label={`Playback speed ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
