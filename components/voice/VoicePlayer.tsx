'use client'

/**
 * Voice Player Component
 *
 * Audio playback UI for voice-enabled content with playback controls,
 * progress tracking, and visual feedback.
 *
 * Quantum Coherence: Visual and auditory elements create harmonic
 * resonance, enhancing user's connection to the wisdom being shared.
 */

import { useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw, Loader2 } from 'lucide-react'
import { useVoice } from '@/hooks/useVoice'
import type { SynthesizeOptions } from '@/services/voiceService'

interface VoicePlayerProps {
  text?: string
  language?: string
  voiceType?: 'calm' | 'wisdom' | 'friendly'
  speed?: number
  autoPlay?: boolean
  showControls?: boolean
  compact?: boolean
  onComplete?: () => void
  onError?: (error: Error) => void
  className?: string
}

export function VoicePlayer({
  text,
  language = 'en',
  voiceType = 'friendly',
  speed = 0.9,
  autoPlay = false,
  showControls = true,
  compact = false,
  onComplete,
  onError,
  className = ''
}: VoicePlayerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(1)

  const voice = useVoice({
    autoPlay,
    onComplete,
    onError
  })

  // Load audio when text changes
  useEffect(() => {
    if (text && (voice as any).loadAndPlay) {
      const options: SynthesizeOptions = {
        text,
        language,
        voiceType,
        speed
      }
      ;(voice as any).loadAndPlay(options)
    }
  }, [text, language, voiceType, speed])

  const handlePlayPause = () => {
    if (voice.isPlaying) {
      voice.pause()
    } else {
      voice.play()
    }
  }

  const handleRestart = () => {
    voice.stop()
    voice.play()
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      voice.setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(voice.volume)
      voice.setVolume(0)
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    voice.setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * voice.duration
    voice.seek(newTime)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!text) {
    return null
  }

  return (
    <div className={`voice-player ${compact ? 'compact' : ''} ${className}`}>
      <div className={`flex items-center gap-3 ${compact ? 'p-3' : 'p-4'} rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-950/20 via-purple-950/20 to-orange-950/20`}>
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={voice.isLoading}
          className="flex-shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 p-3 text-slate-900 transition hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voice.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : voice.isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div
            className="group relative h-2 cursor-pointer rounded-full bg-orange-500/20"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
              style={{ width: `${voice.progress}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-400 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `${voice.progress}%` }}
            />
          </div>

          {showControls && (
            <div className="flex items-center justify-between text-xs text-orange-100/70">
              <span>{formatTime(voice.currentTime)}</span>
              <span>{formatTime(voice.duration)}</span>
            </div>
          )}
        </div>

        {showControls && !compact && (
          <>
            {/* Restart Button */}
            <button
              onClick={handleRestart}
              disabled={voice.isLoading}
              className="flex-shrink-0 rounded-full p-2 text-orange-100/70 transition hover:bg-orange-500/10 hover:text-orange-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMuteToggle}
                className="flex-shrink-0 rounded-full p-2 text-orange-100/70 transition hover:bg-orange-500/10 hover:text-orange-50"
              >
                {isMuted || voice.volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voice.volume}
                onChange={handleVolumeChange}
                className="w-20 accent-orange-400"
              />
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
      {voice.error && (
        <div className="mt-2 rounded-lg border border-red-400/30 bg-red-950/30 p-2 text-xs text-red-50">
          {voice.error.message}
        </div>
      )}
    </div>
  )
}

/**
 * Simple Voice Button
 *
 * Compact button that speaks text when clicked
 */
interface VoiceButtonProps {
  text: string
  language?: string
  voiceType?: 'calm' | 'wisdom' | 'friendly'
  className?: string
  children?: React.ReactNode
}

export function VoiceButton({
  text,
  language = 'en',
  voiceType = 'friendly',
  className = '',
  children
}: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const voice = useVoice({
    onComplete: () => setIsPlaying(false),
    onError: () => setIsPlaying(false)
  })

  const handleClick = async () => {
    if (isPlaying) {
      voice.pause()
      setIsPlaying(false)
    } else if ((voice as any).loadAndPlay) {
      setIsPlaying(true)
      await (voice as any).loadAndPlay({
        text,
        language,
        voiceType
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={voice.isLoading}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        isPlaying
          ? 'bg-orange-500/30 text-orange-50'
          : 'bg-orange-500/10 text-orange-100/80 hover:bg-orange-500/20'
      } disabled:opacity-50 ${className}`}
    >
      {voice.isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      {children || 'Listen'}
    </button>
  )
}
