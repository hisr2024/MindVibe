'use client'

/**
 * KIAAN Vibe Floating Player
 *
 * A floating mini-player that's visible across the app.
 * Features:
 * - Collapsed mini-player (title, play/pause, next, progress)
 * - Expanded player (queue, seek, volume, speed, repeat/shuffle)
 * - Keyboard shortcuts (space, left/right, n/p)
 */

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ChevronUp,
  ChevronDown,
  X,
  ListMusic,
  Music2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { formatDuration } from '@/lib/kiaan-vibe/meditation-library'

// ============ Component ============

export function FloatingPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  // Player state from Zustand store
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    isLoading,
    position,
    duration,
    volume,
    playbackRate,
    repeatMode,
    shuffle,
    muted,
    audioError,
    hasAudioIssues, // eslint-disable-line @typescript-eslint/no-unused-vars
    play, // eslint-disable-line @typescript-eslint/no-unused-vars
    pause, // eslint-disable-line @typescript-eslint/no-unused-vars
    toggle,
    next,
    previous,
    seek,
    setVolume,
    setPlaybackRate,
    setRepeatMode,
    toggleShuffle,
    toggleMute,
    removeFromQueue,
    clearQueue,
    clearAudioError,
    retryPlayback,
  } = usePlayerStore()

  // Calculate progress percentage
  const progress = duration > 0 ? (position / duration) * 100 : 0

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          toggle()
          break
        case 'ArrowLeft':
          seek(Math.max(0, position - 5))
          break
        case 'ArrowRight':
          seek(Math.min(duration, position + 5))
          break
        case 'n':
          next()
          break
        case 'p':
          previous()
          break
        case 'm':
          toggleMute()
          break
        case 'Escape':
          clearQueue()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, seek, position, duration, next, previous, toggleMute, clearQueue])

  // Handle progress bar click/drag
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      seek(percent * duration)
    },
    [seek, duration]
  )

  // Handle volume change
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(parseFloat(e.target.value))
    },
    [setVolume]
  )

  // Cycle repeat mode
  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all']
    const currentIndex = modes.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setRepeatMode(modes[nextIndex])
  }, [repeatMode, setRepeatMode])

  // Don't render if no track
  if (!currentTrack) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`
          fixed z-50 transition-all duration-300
          ${isExpanded
            ? 'inset-x-4 bottom-4 md:left-auto md:right-4 md:w-96'
            : 'left-4 right-4 bottom-20 md:bottom-4 md:left-auto md:right-4 md:w-80'
          }
        `}
      >
        <div
          className={`
            rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl
            shadow-2xl shadow-black/50 overflow-hidden
          `}
        >
          {/* Mini Player (always visible) */}
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Album art / icon */}
              <div
                className={`
                  flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden
                  bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/20
                  flex items-center justify-center
                `}
              >
                {currentTrack.albumArt ? (
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music2 className="w-6 h-6 text-[#d4a44c]" />
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {currentTrack.artist || 'KIAAN Vibe'}
                </p>
              </div>

              {/* Mini controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => previous()}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggle()}
                  disabled={isLoading}
                  className={`
                    p-2.5 rounded-full transition-all
                    ${isPlaying
                      ? 'bg-[#d4a44c] text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }
                  `}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => next()}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => clearQueue()}
                  className="p-2 text-white/40 hover:text-red-400 transition-colors"
                  aria-label="Close player"
                  title="Close player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar (mini) */}
            <div
              className="mt-2 h-1 bg-white/10 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-[#d4a44c] rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            {/* Audio Error Display */}
            {audioError && (
              <div className="mt-2 p-2 rounded-lg bg-[#d4a44c]/10 border border-[#d4a44c]/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#d4a44c] flex-shrink-0" />
                  <p className="text-xs text-[#f0c96d] flex-1">{audioError}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => retryPlayback()}
                      className="p-1.5 rounded-md bg-[#d4a44c]/20 hover:bg-[#d4a44c]/30 text-[#f0c96d] transition-colors"
                      aria-label="Retry playback"
                      title="Retry"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => clearAudioError()}
                      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
                      aria-label="Dismiss error"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expanded Controls */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-4 border-t border-white/5 pt-3">
                  {/* Time display */}
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{formatDuration(position)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>

                  {/* Full controls row */}
                  <div className="flex items-center justify-between">
                    {/* Shuffle */}
                    <button
                      onClick={toggleShuffle}
                      className={`p-2 rounded-lg transition-colors ${
                        shuffle ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/50 hover:text-white'
                      }`}
                      aria-label="Shuffle"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    {/* Repeat */}
                    <button
                      onClick={cycleRepeatMode}
                      className={`p-2 rounded-lg transition-colors ${
                        repeatMode !== 'off' ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/50 hover:text-white'
                      }`}
                      aria-label={`Repeat: ${repeatMode}`}
                    >
                      {repeatMode === 'one' ? (
                        <Repeat1 className="w-4 h-4" />
                      ) : (
                        <Repeat className="w-4 h-4" />
                      )}
                    </button>

                    {/* Queue */}
                    <button
                      onClick={() => setShowQueue(!showQueue)}
                      className={`p-2 rounded-lg transition-colors ${
                        showQueue ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/50 hover:text-white'
                      }`}
                      aria-label="Queue"
                    >
                      <ListMusic className="w-4 h-4" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                        aria-label={muted ? 'Unmute' : 'Mute'}
                      >
                        {muted || volume === 0 ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#d4a44c]"
                      />
                    </div>
                  </div>

                  {/* Playback speed */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Speed:</span>
                    <div className="flex gap-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            playbackRate === rate
                              ? 'bg-[#d4a44c] text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Queue list */}
                  <AnimatePresence>
                    {showQueue && queue.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                            Queue ({queue.length} tracks)
                          </p>
                          {queue.map((track, index) => (
                            <div
                              key={`${track.id}-${index}`}
                              className={`
                                flex items-center gap-2 p-2 rounded-lg
                                ${index === queueIndex
                                  ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/30'
                                  : 'hover:bg-white/5'
                                }
                              `}
                            >
                              <span className="text-xs text-white/40 w-5">{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{track.title}</p>
                                <p className="text-xs text-white/50 truncate">
                                  {track.artist || 'KIAAN Vibe'}
                                </p>
                              </div>
                              {index !== queueIndex && (
                                <button
                                  onClick={() => removeFromQueue(index)}
                                  className="p-1 text-white/30 hover:text-white/60 transition-colors"
                                  aria-label="Remove from queue"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FloatingPlayer
