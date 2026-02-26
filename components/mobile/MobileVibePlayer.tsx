'use client'

/**
 * Mobile KIAAN Vibe Player
 *
 * A mobile-optimized floating mini-player visible across the app:
 * - Compact mini-player bar above tab bar
 * - Expandable full controls (queue, volume, speed, repeat/shuffle)
 * - Touch-friendly progress seeking
 * - Swipe-down to collapse
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronDown,
  X,
  ListMusic,
  Music2,
  Repeat,
  Repeat1,
  Shuffle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { formatDuration } from '@/lib/kiaan-vibe/meditation-library'

export function MobileVibePlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    isLoading,
    position,
    duration,
    playbackRate,
    repeatMode,
    shuffle,
    audioError,
    toggle,
    next,
    previous,
    seek,
    setPlaybackRate,
    setRepeatMode,
    toggleShuffle,
    removeFromQueue,
    clearQueue,
    clearAudioError,
    retryPlayback,
  } = usePlayerStore()

  const progress = duration > 0 ? (position / duration) * 100 : 0

  const handleProgressTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      seek(percent * duration)
    },
    [seek, duration]
  )

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      seek(percent * duration)
    },
    [seek, duration]
  )

  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all']
    const currentIndex = modes.indexOf(repeatMode)
    setRepeatMode(modes[(currentIndex + 1) % modes.length])
  }, [repeatMode, setRepeatMode])

  const handleSwipeDown = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 0.3 || info.offset.y > 80) {
      setIsExpanded(false)
      setShowQueue(false)
    }
  }, [])

  if (!currentTrack) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed z-50 left-0 right-0 transition-all duration-300 ${
          isExpanded
            ? 'bottom-0 top-0'
            : 'bottom-[calc(80px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <div className={`${
          isExpanded
            ? 'h-full flex flex-col bg-[#0d0d12]/98 backdrop-blur-xl'
            : 'mx-3 rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl shadow-2xl shadow-black/50'
        }`}>
          {/* Expanded header with drag handle */}
          {isExpanded && (
            <motion.div
              onPanEnd={handleSwipeDown}
              className="flex items-center justify-center pt-3 pb-2 cursor-grab"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </motion.div>
          )}

          {/* Mini player bar */}
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Album art */}
              <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/10 flex items-center justify-center ${
                  isExpanded ? 'w-16 h-16' : 'w-11 h-11'
                }`}
              >
                {currentTrack.albumArt ? (
                  <img src={currentTrack.albumArt} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <Music2 className={`text-[#d4a44c] ${isExpanded ? 'w-8 h-8' : 'w-5 h-5'}`} />
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
                <p className={`font-medium text-white truncate ${isExpanded ? 'text-base' : 'text-sm'}`}>
                  {currentTrack.title}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {currentTrack.artist || 'KIAAN Vibe'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-0.5">
                {!isExpanded && (
                  <button onClick={() => previous()} className="p-2 text-white/60" aria-label="Previous">
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => toggle()}
                  disabled={isLoading}
                  className={`p-2.5 rounded-full transition-all ${
                    isPlaying ? 'bg-[#d4a44c] text-white' : 'bg-white/10 text-white'
                  }`}
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

                {!isExpanded && (
                  <button onClick={() => next()} className="p-2 text-white/60" aria-label="Next">
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}

                {isExpanded ? (
                  <button onClick={() => { setIsExpanded(false); setShowQueue(false) }} className="p-2 text-white/60" aria-label="Collapse">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => clearQueue()} className="p-2 text-white/30" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div
              ref={progressRef}
              className={`bg-white/10 rounded-full cursor-pointer ${isExpanded ? 'mt-4 h-2' : 'mt-2 h-1'}`}
              onClick={handleProgressClick}
              onTouchMove={handleProgressTouch}
            >
              <div
                className="h-full bg-[#d4a44c] rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                {isExpanded && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md -mr-2" />
                )}
              </div>
            </div>

            {/* Time display (expanded) */}
            {isExpanded && (
              <div className="flex items-center justify-between text-[11px] text-white/40 mt-1.5">
                <span>{formatDuration(position)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            )}

            {/* Audio error */}
            {audioError && (
              <div className="mt-2 p-2 rounded-lg bg-[#d4a44c]/10 border border-[#d4a44c]/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#d4a44c] flex-shrink-0" />
                  <p className="text-[11px] text-[#d4a44c] flex-1">{audioError}</p>
                  <button onClick={() => retryPlayback()} className="p-1 rounded bg-[#d4a44c]/20 text-[#d4a44c]" aria-label="Retry">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button onClick={() => clearAudioError()} className="p-1 rounded bg-white/5 text-white/40" aria-label="Dismiss">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expanded controls */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto px-3 pb-3 space-y-5 border-t border-white/5 pt-4"
              >
                {/* Main controls row */}
                <div className="flex items-center justify-between px-6">
                  <button onClick={() => previous()} className="p-3 text-white/70" aria-label="Previous">
                    <SkipBack className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => toggle()}
                    disabled={isLoading}
                    className={`p-5 rounded-full ${isPlaying ? 'bg-[#d4a44c]' : 'bg-white/10'}`}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <motion.div
                        className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>

                  <button onClick={() => next()} className="p-3 text-white/70" aria-label="Next">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                {/* Secondary controls */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-lg ${shuffle ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/40'}`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={cycleRepeatMode}
                    className={`p-2 rounded-lg ${repeatMode !== 'off' ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/40'}`}
                    aria-label={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className={`p-2 rounded-lg ${showQueue ? 'text-[#d4a44c] bg-[#d4a44c]/20' : 'text-white/40'}`}
                    aria-label="Queue"
                  >
                    <ListMusic className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed */}
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs text-white/40">Speed:</span>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg ${
                          playbackRate === rate
                            ? 'bg-[#d4a44c] text-white'
                            : 'bg-white/10 text-white/50'
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
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                        Queue ({queue.length} tracks)
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {queue.map((track, index) => (
                          <div
                            key={`${track.id}-${index}`}
                            className={`flex items-center gap-2 p-2.5 rounded-xl ${
                              index === queueIndex
                                ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/30'
                                : 'bg-white/[0.03]'
                            }`}
                          >
                            <span className="text-xs text-white/30 w-5 text-center">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{track.title}</p>
                              <p className="text-[10px] text-white/40 truncate">{track.artist || 'KIAAN Vibe'}</p>
                            </div>
                            {index !== queueIndex && (
                              <button onClick={() => removeFromQueue(index)} className="p-1 text-white/20" aria-label="Remove">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MobileVibePlayer
