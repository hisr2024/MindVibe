'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import type { SourceType, Track } from './types'

interface KiaanVibesPlayerProps {
  queue: Track[]
  currentIndex: number
  activeSource: SourceType
  onIndexChange: (index: number) => void
  onRequestSource: (source: SourceType) => void
}

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function KiaanVibesPlayer({
  queue,
  currentIndex,
  activeSource,
  onIndexChange,
  onRequestSource
}: KiaanVibesPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const currentTrack = queue[currentIndex] ?? null

  const displayMeta = useMemo(() => {
    if (!currentTrack?.meta) return null
    if (currentTrack.sourceType === 'gita') {
      const chapter = currentTrack.meta.chapter
      const verse = currentTrack.meta.verse
      const language = currentTrack.meta.language
      return {
        label: verse ? `Chapter ${chapter} • Verse ${verse}` : `Chapter ${chapter}`,
        detail: typeof language === 'string' ? language.toUpperCase() : ''
      }
    }
    if (currentTrack.sourceType === 'meditation') {
      return { label: currentTrack.meta.category as string, detail: 'Meditation' }
    }
    if (currentTrack.sourceType === 'upload') {
      return { label: 'My Uploads', detail: 'Local File' }
    }
    return null
  }, [currentTrack])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoaded = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      if (queue.length > 1) {
        const nextIndex = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1
        onIndexChange(nextIndex)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex, onIndexChange, queue.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }

    if (!currentTrack) {
      audio.pause()
      audio.src = ''
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const src = currentTrack.fileBlob ? URL.createObjectURL(currentTrack.fileBlob) : currentTrack.url
    if (currentTrack.fileBlob && src) {
      setObjectUrl(src)
    }

    audio.src = src ?? ''
    audio.volume = isMuted ? 0 : volume
    audio.load()

    const playPromise = audio.play()
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    } else {
      setIsPlaying(true)
    }
  }, [currentTrack, isMuted, volume])

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!currentTrack) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [currentTrack, isPlaying])

  const handleSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Number(event.target.value)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value)
    const audio = audioRef.current
    setVolume(nextVolume)
    if (audio) {
      audio.volume = isMuted ? 0 : nextVolume
    }
  }, [isMuted])

  const handleMuteToggle = useCallback(() => {
    const audio = audioRef.current
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (audio) {
      audio.volume = nextMuted ? 0 : volume
    }
  }, [isMuted, volume])

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1
    onIndexChange(prevIndex)
  }, [currentIndex, onIndexChange, queue.length])

  const handleNext = useCallback(() => {
    if (queue.length === 0) return
    const nextIndex = currentIndex + 1 >= queue.length ? 0 : currentIndex + 1
    onIndexChange(nextIndex)
  }, [currentIndex, onIndexChange, queue.length])

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">KIAAN Vibes</h2>
          <p className="text-xs text-white/50">Unified sacred audio player</p>
        </div>
        <span className="text-xs text-white/40">Volume {Math.round(volume * 100)}%</span>
      </div>

      <div className="mt-4 rounded-xl bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {currentTrack?.title ?? 'No track selected'}
            </p>
            <p className="text-xs text-white/50">
              {currentTrack?.subtitle ?? 'Choose from the library below'}
            </p>
            {displayMeta && (
              <p className="mt-1 text-xs text-violet-200/80">
                {displayMeta.label} {displayMeta.detail ? `• ${displayMeta.detail}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-violet-500"
            disabled={!currentTrack}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/10"
              disabled={!currentTrack}
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/10"
              disabled={!currentTrack}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMuteToggle}
              className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/10"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-violet-500"
            />
          </div>
        </div>
      </div>

      {!currentTrack && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Choose your library</p>
          <p className="text-xs text-white/50">Select a mode to start listening.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['gita', 'meditation', 'upload'] as const).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => onRequestSource(source)}
                className={`rounded-full border px-4 py-1 text-xs font-medium transition ${
                  activeSource === source
                    ? 'border-violet-400 text-violet-200'
                    : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
              >
                {source === 'gita' ? 'Gita Verses' : source === 'meditation' ? 'Meditation' : 'Uploads'}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
