/**
 * useVoice Hook
 *
 * React hook for managing audio playback with voice synthesis.
 * Handles play/pause, progress tracking, and audio lifecycle.
 *
 * Quantum Coherence: Audio playback creates temporal resonance,
 * synchronizing user attention with wisdom vibrations.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import voiceService, { SynthesizeOptions } from '@/services/voiceService'

interface UseVoiceOptions {
  userId: string
  autoPlay?: boolean
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface UseVoiceReturn {
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  isPlaying: boolean
  isLoading: boolean
  error: Error | null
  progress: number
  duration: number
  currentTime: number
  volume: number
}

export function useVoice(options: UseVoiceOptions): UseVoiceReturn {
  const { userId, autoPlay = false, onComplete, onError } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolumeState] = useState(1)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()

    // Event listeners
    const audio = audioRef.current

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(100)
      if (onComplete) onComplete()
    }
    const handleError = (e: ErrorEvent) => {
      const err = new Error('Audio playback failed')
      setError(err)
      setIsPlaying(false)
      if (onError) onError(err)
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError as any)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError as any)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)

      // Clean up audio
      audio.pause()
      if (audio.src) {
        voiceService.revokeAudioUrl(audio.src)
      }
    }
  }, [onComplete, onError])

  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch((err) => {
        setError(err)
        if (onError) onError(err)
      })
    }
  }, [onError])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setProgress(0)
      setCurrentTime(0)
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, vol))
      setVolumeState(vol)
    }
  }, [])

  // Load and play audio from text
  const loadAndPlay = useCallback(
    async (synthesizeOptions: SynthesizeOptions) => {
      setIsLoading(true)
      setError(null)

      try {
        // Get audio blob
        const blob = await voiceService.synthesize(synthesizeOptions, userId)

        // Create object URL
        const url = voiceService.createAudioUrl(blob)

        // Set audio source
        if (audioRef.current) {
          // Revoke old URL if exists
          if (audioRef.current.src) {
            voiceService.revokeAudioUrl(audioRef.current.src)
          }

          audioRef.current.src = url
          audioRef.current.load()

          if (autoPlay) {
            await audioRef.current.play()
          }
        }

        setIsLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setIsLoading(false)
        if (onError) onError(error)
      }
    },
    [userId, autoPlay, onError]
  )

  // Load audio from URL
  const loadFromUrl = useCallback(
    async (url: string) => {
      setIsLoading(true)
      setError(null)

      try {
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.load()

          if (autoPlay) {
            await audioRef.current.play()
          }
        }

        setIsLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setIsLoading(false)
        if (onError) onError(error)
      }
    },
    [autoPlay, onError]
  )

  return {
    play,
    pause,
    stop,
    seek,
    setVolume,
    isPlaying,
    isLoading,
    error,
    progress,
    duration,
    currentTime,
    volume,
    // Additional methods for loading audio
    loadAndPlay: loadAndPlay as any,
    loadFromUrl: loadFromUrl as any
  }
}

/**
 * useVerseAudio Hook
 *
 * Specialized hook for playing verse audio
 */
export function useVerseAudio(
  verseId: string | null,
  language: string = 'en',
  options: Omit<UseVoiceOptions, 'userId'> & { userId: string }
) {
  const voiceHook = useVoice(options)
  const [isLoadingVerse, setIsLoadingVerse] = useState(false)

  const loadVerse = useCallback(
    async (includeCommentary: boolean = false) => {
      if (!verseId) return

      setIsLoadingVerse(true)

      try {
        const blob = await voiceService.getVerseAudio(
          verseId,
          language,
          includeCommentary,
          options.userId
        )

        const url = voiceService.createAudioUrl(blob)

        if ((voiceHook as any).loadFromUrl) {
          await (voiceHook as any).loadFromUrl(url)
        }

        setIsLoadingVerse(false)
      } catch (err) {
        setIsLoadingVerse(false)
        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    },
    [verseId, language, options.userId, voiceHook, options.onError]
  )

  return {
    ...voiceHook,
    loadVerse,
    isLoadingVerse
  }
}
