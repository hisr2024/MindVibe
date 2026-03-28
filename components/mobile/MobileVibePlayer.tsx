'use client'

/**
 * Mobile KIAAN Vibe Player - Divine Edition
 *
 * A premium mobile music player with sacred visual design:
 * - Compact mini-player bar above tab bar
 * - Full-screen expanded mode with album art, circular progress, waveform
 * - Sacred golden aura animations when playing
 * - Volume control, stop, mute (desktop feature parity)
 * - Touch-friendly progress seeking with haptic feedback
 * - Swipe gestures: down to collapse, up to expand
 * - Queue management with track listing
 * - Playback speed, repeat, shuffle controls
 * - Media Session API for lock screen controls
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
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
  Volume2,
  VolumeX,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { formatDuration } from '@/lib/kiaan-vibe/meditation-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

// Sacred floating particle for background ambiance
function SacredParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-[#d4a44c]"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ opacity: 0, y: '100%' }}
      animate={{
        opacity: [0, 0.4, 0.2, 0],
        y: [100, -20, -60, -100],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

// Waveform visualization bar
function WaveformBar({ height, index, isPlaying }: { height: number; index: number; isPlaying: boolean }) {
  return (
    <motion.div
      className="flex-1 rounded-full"
      style={{
        background: isPlaying
          ? 'linear-gradient(to top, #d4a44c, #e8b54a)'
          : 'rgba(255,255,255,0.15)',
        minHeight: 3,
      }}
      animate={{
        height: isPlaying ? `${Math.max(12, height * 100)}%` : '20%',
      }}
      transition={{
        duration: 0.1,
        delay: index * 0.01,
      }}
    />
  )
}

// Circular progress ring for expanded mode
function CircularProgress({ progress, size, strokeWidth }: { progress: number; size: number; strokeWidth: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a44c" />
          <stop offset="100%" stopColor="#f0c96d" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function MobileVibePlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const { triggerHaptic } = useHapticFeedback()

  // Simulated waveform bars
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(0.15))
  const animFrameRef = useRef<number | null>(null)

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
    toggle,
    stop,
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

  const progress = duration > 0 ? (position / duration) * 100 : 0

  // Animate waveform bars when playing
  useEffect(() => {
    if (isPlaying && isExpanded) {
      const tick = () => {
        setWaveformBars(prev =>
          prev.map(() => 0.1 + Math.random() * 0.85)
        )
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (!isPlaying) {
        setWaveformBars(Array(24).fill(0.15))
      }
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, isExpanded])

  // Sacred particles data
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 0.8,
      x: Math.random() * 100,
      size: 2 + Math.random() * 3,
    })),
  [])

  const handleProgressTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      seek(percent * duration)
      triggerHaptic('light')
    },
    [seek, duration, triggerHaptic]
  )

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      seek(percent * duration)
      triggerHaptic('light')
    },
    [seek, duration, triggerHaptic]
  )

  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all']
    const currentIndex = modes.indexOf(repeatMode)
    setRepeatMode(modes[(currentIndex + 1) % modes.length])
    triggerHaptic('selection')
  }, [repeatMode, setRepeatMode, triggerHaptic])

  const handlePanEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe down to collapse
    if (isExpanded && (info.velocity.y > 0.3 || info.offset.y > 80)) {
      setIsExpanded(false)
      setShowQueue(false)
      setShowVolume(false)
      triggerHaptic('light')
    }
    // Swipe up to expand
    if (!isExpanded && (info.velocity.y < -0.3 || info.offset.y < -40)) {
      setIsExpanded(true)
      triggerHaptic('medium')
    }
  }, [isExpanded, triggerHaptic])

  const handleToggle = useCallback(() => {
    toggle()
    triggerHaptic('medium')
  }, [toggle, triggerHaptic])

  const handleNext = useCallback(() => {
    next()
    triggerHaptic('light')
  }, [next, triggerHaptic])

  const handlePrevious = useCallback(() => {
    previous()
    triggerHaptic('light')
  }, [previous, triggerHaptic])

  const handleStop = useCallback(() => {
    stop()
    triggerHaptic('medium')
  }, [stop, triggerHaptic])

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(parseFloat(e.target.value))
    },
    [setVolume]
  )

  if (!currentTrack) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`fixed z-50 left-0 right-0 transition-all duration-300 ${
          isExpanded
            ? 'bottom-0 top-0'
            : 'bottom-[calc(80px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <motion.div
          onPanEnd={handlePanEnd}
          className={`${
            isExpanded
              ? 'h-full flex flex-col bg-[#050507] overflow-hidden'
              : 'mx-3 rounded-2xl border border-[#d4a44c]/15 bg-[#0d0d12]/95 backdrop-blur-xl shadow-2xl shadow-black/50'
          }`}
        >
          {/* ===== EXPANDED: Full-screen divine player ===== */}
          {isExpanded && (
            <>
              {/* Sacred ambient background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[100px] transition-opacity duration-1000 ${
                    isPlaying ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ background: 'radial-gradient(circle, rgba(212,164,76,0.15), transparent)' }}
                />
                <div
                  className={`absolute bottom-1/3 left-1/4 w-[200px] h-[200px] rounded-full blur-[80px] transition-opacity duration-1000 ${
                    isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ background: 'radial-gradient(circle, rgba(212,164,76,0.08), transparent)' }}
                />
                {/* Sacred floating particles */}
                {isPlaying && particles.map(p => (
                  <SacredParticle key={p.id} delay={p.delay} x={p.x} size={p.size} />
                ))}
              </div>

              {/* Drag handle */}
              <div
                className="relative z-10 flex items-center justify-center pt-3 pb-2 cursor-grab"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
              >
                <motion.div
                  className="w-10 h-1 rounded-full bg-white/20"
                  animate={isPlaying ? { opacity: [0.2, 0.5, 0.2] } : {}}
                  transition={isPlaying ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
                />
              </div>

              {/* Collapse button */}
              <div className="relative z-10 flex justify-between items-center px-5 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#d4a44c] shadow-sm shadow-[#d4a44c]/40" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#d4a44c]/80">
                    KIAAN Vibe Player
                  </span>
                </div>
                <button
                  onClick={() => { setIsExpanded(false); setShowQueue(false); setShowVolume(false); triggerHaptic('light') }}
                  className="p-2 text-white/60 active:text-white"
                  aria-label="Collapse player"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
                {/* Album art with circular progress ring */}
                <div className="flex justify-center mt-4 mb-6">
                  <div className="relative" style={{ width: 220, height: 220 }}>
                    <CircularProgress progress={progress} size={220} strokeWidth={3} />
                    <div className="absolute inset-3 rounded-full overflow-hidden bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/5 flex items-center justify-center border border-[#d4a44c]/10">
                      {currentTrack.albumArt ? (
                        <Image
                          src={currentTrack.albumArt}
                          alt={currentTrack.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Music2 className={`w-14 h-14 text-[#d4a44c] transition-all duration-500 ${isPlaying ? 'scale-110' : ''}`} />
                        </div>
                      )}
                    </div>
                    {/* Sacred aura glow when playing */}
                    {isPlaying && (
                      <motion.div
                        className="absolute -inset-3 rounded-full border border-[#d4a44c]/20"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(212,164,76,0.1)',
                            '0 0 40px rgba(212,164,76,0.2)',
                            '0 0 20px rgba(212,164,76,0.1)',
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                </div>

                {/* Track info */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-white truncate px-4">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {currentTrack.artist || 'KIAAN Vibe'}
                  </p>
                </div>

                {/* Progress bar (expanded - larger) */}
                <div className="mb-2">
                  <div
                    ref={progressRef}
                    className="h-2 bg-white/10 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                    onTouchMove={handleProgressTouch}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] rounded-full relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-[#d4a44c]/30 -mr-2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/50 mt-1.5">
                    <span>{formatDuration(position)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Waveform visualization */}
                <div className="flex items-end gap-[2px] h-10 mb-6 px-2">
                  {waveformBars.map((height, i) => (
                    <WaveformBar key={i} height={height} index={i} isPlaying={isPlaying} />
                  ))}
                </div>

                {/* Main controls */}
                <div className="flex items-center justify-center gap-5 mb-6">
                  <button
                    onClick={handlePrevious}
                    className="p-3 text-white/70 active:text-white active:scale-95 transition-all"
                    aria-label="Previous"
                  >
                    <SkipBack className="w-7 h-7" />
                  </button>

                  {/* Stop button */}
                  {(isPlaying || position > 0) && (
                    <button
                      onClick={handleStop}
                      className="p-2.5 text-white/50 active:text-white active:scale-95 transition-all"
                      aria-label="Stop"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                  )}

                  {/* Play/Pause main button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                      isPlaying
                        ? 'bg-[#d4a44c] shadow-[#d4a44c]/40'
                        : 'bg-white/10 shadow-black/20'
                    }`}
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
                  </motion.button>

                  <button
                    onClick={handleNext}
                    className="p-3 text-white/70 active:text-white active:scale-95 transition-all"
                    aria-label="Next"
                  >
                    <SkipForward className="w-7 h-7" />
                  </button>
                </div>

                {/* Secondary controls row */}
                <div className="flex items-center justify-center gap-5 mb-5">
                  <button
                    onClick={() => { toggleShuffle(); triggerHaptic('selection') }}
                    className={`p-2.5 rounded-xl transition-all ${shuffle ? 'text-[#d4a44c] bg-[#d4a44c]/15' : 'text-white/50'}`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={cycleRepeatMode}
                    className={`p-2.5 rounded-xl transition-all ${repeatMode !== 'off' ? 'text-[#d4a44c] bg-[#d4a44c]/15' : 'text-white/50'}`}
                    aria-label={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => { setShowVolume(!showVolume); setShowQueue(false); triggerHaptic('selection') }}
                    className={`p-2.5 rounded-xl transition-all ${showVolume ? 'text-[#d4a44c] bg-[#d4a44c]/15' : 'text-white/50'}`}
                    aria-label="Volume"
                  >
                    {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => { setShowQueue(!showQueue); setShowVolume(false); triggerHaptic('selection') }}
                    className={`p-2.5 rounded-xl transition-all ${showQueue ? 'text-[#d4a44c] bg-[#d4a44c]/15' : 'text-white/50'}`}
                    aria-label="Queue"
                  >
                    <ListMusic className="w-5 h-5" />
                  </button>
                </div>

                {/* Volume control */}
                <AnimatePresence>
                  {showVolume && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="flex items-center gap-3 px-2 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                        <button
                          onClick={() => { toggleMute(); triggerHaptic('selection') }}
                          className="p-2 text-white/60"
                          aria-label={muted ? 'Unmute' : 'Mute'}
                        >
                          {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={muted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#d4a44c]"
                        />
                        <span className="text-xs text-white/50 w-8 text-right">
                          {Math.round((muted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Playback speed */}
                <div className="flex items-center gap-2 justify-center mb-5">
                  <span className="text-xs text-white/50">Speed</span>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => { setPlaybackRate(rate); triggerHaptic('selection') }}
                        className={`px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                          playbackRate === rate
                            ? 'bg-[#d4a44c] text-white font-medium'
                            : 'bg-white/[0.06] text-white/50'
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
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                          Queue ({queue.length} tracks)
                        </p>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {queue.map((track, index) => (
                            <motion.div
                              key={`${track.id}-${index}`}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                index === queueIndex
                                  ? 'bg-[#d4a44c]/15 border border-[#d4a44c]/25'
                                  : 'bg-white/[0.02]'
                              }`}
                            >
                              <span className="text-xs text-white/40 w-5 text-center font-medium">
                                {index === queueIndex ? (
                                  <motion.div
                                    className="w-2 h-2 rounded-full bg-[#d4a44c] mx-auto"
                                    animate={isPlaying ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  />
                                ) : (
                                  index + 1
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{track.title}</p>
                                <p className="text-[10px] text-white/50 truncate">{track.artist || 'KIAAN Vibe'}</p>
                              </div>
                              {index !== queueIndex && (
                                <button
                                  onClick={() => { removeFromQueue(index); triggerHaptic('light') }}
                                  className="p-1.5 text-white/20 active:text-white/50"
                                  aria-label="Remove from queue"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Audio error */}
                {audioError && (
                  <div className="mt-4 p-3 rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#d4a44c] flex-shrink-0" />
                      <p className="text-xs text-[#f0c96d] flex-1">{audioError}</p>
                      <button
                        onClick={() => { retryPlayback(); triggerHaptic('medium') }}
                        className="p-1.5 rounded-lg bg-[#d4a44c]/20 text-[#f0c96d]"
                        aria-label="Retry"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => clearAudioError()}
                        className="p-1.5 rounded-lg bg-white/5 text-white/50"
                        aria-label="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== MINI PLAYER BAR (collapsed) ===== */}
          {!isExpanded && (
            <div className="p-3">
              {/* Top accent glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

              <div className="flex items-center gap-3">
                {/* Album art thumbnail */}
                <button
                  onClick={() => { setIsExpanded(true); triggerHaptic('medium') }}
                  className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/5 flex items-center justify-center border border-[#d4a44c]/10"
                >
                  {currentTrack.albumArt ? (
                    <Image src={currentTrack.albumArt} alt={currentTrack.title} width={44} height={44} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <Music2 className="w-5 h-5 text-[#d4a44c]" />
                  )}
                </button>

                {/* Track info */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => { setIsExpanded(true); triggerHaptic('medium') }}
                >
                  <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-white/50 truncate">{currentTrack.artist || 'KIAAN Vibe'}</p>
                </button>

                {/* Mini controls */}
                <div className="flex items-center gap-0.5">
                  <button onClick={handlePrevious} className="p-2 text-white/50" aria-label="Previous">
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggle}
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
                  </motion.button>

                  <button onClick={handleNext} className="p-2 text-white/50" aria-label="Next">
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { clearQueue(); triggerHaptic('light') }}
                    className="p-2 text-white/40"
                    aria-label="Close player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mini progress bar */}
              <div
                className="mt-2 h-1 bg-white/10 rounded-full cursor-pointer"
                onClick={handleProgressClick}
                onTouchMove={handleProgressTouch}
              >
                <div
                  className="h-full bg-[#d4a44c] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Audio error in mini mode */}
              {audioError && (
                <div className="mt-2 p-2 rounded-lg bg-[#d4a44c]/10 border border-[#d4a44c]/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-[#d4a44c] flex-shrink-0" />
                    <p className="text-[10px] text-[#d4a44c] flex-1 truncate">{audioError}</p>
                    <button onClick={() => { retryPlayback(); triggerHaptic('medium') }} className="p-1 rounded bg-[#d4a44c]/20 text-[#d4a44c]" aria-label="Retry">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MobileVibePlayer
