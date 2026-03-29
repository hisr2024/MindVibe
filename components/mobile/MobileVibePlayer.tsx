'use client'

/**
 * Mobile KIAAN Vibe Player — Divine Edition (Full Redesign)
 *
 * Premium mobile music player with the Kiaanverse sacred design system:
 * - Mini-player bar (64px) above tab bar with golden aura when playing
 * - Full-screen expanded mode with album art, circular progress ring, waveform
 * - Sacred golden animations, divine-breath pulses, peacock-shimmer on tap
 * - Touch-friendly controls with haptic feedback throughout
 * - Queue management, speed selector, volume control
 * - Swipe gestures: up to expand, down to collapse, left/right to skip
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Play, Pause, Square, SkipForward, SkipBack, ChevronUp, ChevronDown,
  X, ListMusic, Music2, Repeat, Repeat1, Shuffle, AlertTriangle,
  RefreshCw, Volume2, VolumeX,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { formatDuration } from '@/lib/kiaan-vibe/meditation-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

// ─── Sacred Floating Particle ──────────────────────────────────────────────

const PARTICLE_DURATIONS = [7.2, 8.5, 6.8, 9.1, 7.6, 8.3, 6.4, 9.7, 7.9, 8.1, 6.6, 9.3]

function SacredParticle({ delay, x, size, index }: { delay: number; x: number; size: number; index: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ width: size, height: size, left: `${x}%`, backgroundColor: '#D4A017', boxShadow: '0 0 4px rgba(212,160,23,0.4)' }}
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: [0, 0.5, 0.2, 0], y: [100, -20, -60, -100] }}
      transition={{ duration: PARTICLE_DURATIONS[index % PARTICLE_DURATIONS.length], delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

// ─── Waveform Bar ──────────────────────────────────────────────────────────

function WaveformBar({ height, index, isPlaying }: { height: number; index: number; isPlaying: boolean }) {
  return (
    <motion.div
      className="rounded-full"
      style={{
        width: 3,
        background: isPlaying
          ? 'linear-gradient(to top, #D4A017, #06B6D4)'
          : 'rgba(255,255,255,0.12)',
        minHeight: 4,
      }}
      animate={{ height: isPlaying ? `${Math.max(12, height * 100)}%` : '20%' }}
      transition={{ duration: 0.1, delay: index * 0.008 }}
    />
  )
}

// ─── Circular Progress Ring ────────────────────────────────────────────────

function CircularProgress({ progress, size, strokeWidth }: { progress: number; size: number; strokeWidth: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#sacredProgressGradient)" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300"
      />
      <defs>
        <linearGradient id="sacredProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A017" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export function MobileVibePlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [showSpeed, setShowSpeed] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(0.15))
  const animFrameRef = useRef<number | null>(null)

  const {
    currentTrack, queue, queueIndex, isPlaying, isLoading, position, duration,
    volume, playbackRate, repeatMode, shuffle, muted, audioError,
    toggle, stop, next, previous, seek, setVolume, setPlaybackRate,
    setRepeatMode, toggleShuffle, toggleMute, removeFromQueue, clearQueue,
    clearAudioError, retryPlayback,
  } = usePlayerStore()

  const progress = duration > 0 ? (position / duration) * 100 : 0

  // Animate waveform bars when playing
  useEffect(() => {
    if (isPlaying && isExpanded) {
      let count = 0
      const tick = () => {
        count++
        if (count % 2 === 0) { // 30fps
          setWaveformBars(prev => prev.map(() => 0.1 + Math.random() * 0.85))
        }
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (!isPlaying) setWaveformBars(Array(24).fill(0.15))
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [isPlaying, isExpanded])

  const particles = useMemo(() => [
    { id: 0, delay: 0, x: 15, size: 2.5 }, { id: 1, delay: 0.8, x: 82, size: 3.2 },
    { id: 2, delay: 1.6, x: 45, size: 2.8 }, { id: 3, delay: 2.4, x: 68, size: 4.1 },
    { id: 4, delay: 3.2, x: 25, size: 3.5 }, { id: 5, delay: 4.0, x: 91, size: 2.3 },
    { id: 6, delay: 4.8, x: 37, size: 3.8 }, { id: 7, delay: 5.6, x: 73, size: 2.6 },
    { id: 8, delay: 6.4, x: 8, size: 4.3 }, { id: 9, delay: 7.2, x: 55, size: 2.9 },
    { id: 10, delay: 8.0, x: 42, size: 3.1 }, { id: 11, delay: 8.8, x: 88, size: 2.4 },
  ], [])

  // ─── Progress Touch Handling ───

  const handleProgressTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    setIsScrubbing(true)
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    seek(percent * duration)
    triggerHaptic('selection')
  }, [seek, duration, triggerHaptic])

  const handleProgressTouchEnd = useCallback(() => setIsScrubbing(false), [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
    triggerHaptic('light')
  }, [seek, duration, triggerHaptic])

  // ─── Control Handlers ───

  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all']
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % 3])
    triggerHaptic('selection')
  }, [repeatMode, setRepeatMode, triggerHaptic])

  const handlePanEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isExpanded && (info.velocity.y > 0.3 || info.offset.y > 80)) {
      setIsExpanded(false); setShowQueue(false); setShowVolume(false); setShowSpeed(false)
      triggerHaptic('light')
    }
    if (!isExpanded) {
      if (info.velocity.y < -0.3 || info.offset.y < -40) { setIsExpanded(true); triggerHaptic('medium') }
      if (info.velocity.x < -200) { next(); triggerHaptic('light') }
      if (info.velocity.x > 200) { previous(); triggerHaptic('light') }
    }
  }, [isExpanded, triggerHaptic, next, previous])

  const handleToggle = useCallback(() => { toggle(); triggerHaptic('medium') }, [toggle, triggerHaptic])
  const handleNext = useCallback(() => { next(); triggerHaptic('light') }, [next, triggerHaptic])
  const handlePrevious = useCallback(() => { previous(); triggerHaptic('light') }, [previous, triggerHaptic])
  const handleStop = useCallback(() => { stop(); triggerHaptic('medium') }, [stop, triggerHaptic])

  if (!currentTrack) return null

  const categoryLabel = currentTrack.category?.toUpperCase() || 'SACRED SOUND'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`fixed z-50 left-0 right-0 transition-all duration-300 ${
          isExpanded ? 'bottom-0 top-0' : 'bottom-[calc(72px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <motion.div
          onPanEnd={handlePanEnd}
          className={isExpanded
            ? 'h-full flex flex-col bg-[#050714] overflow-hidden'
            : 'mx-0 bg-[rgba(11,14,42,0.96)] backdrop-blur-[20px] backdrop-saturate-200'
          }
          style={!isExpanded ? {
            borderTop: '1px solid rgba(212,160,23,0.2)',
            boxShadow: isPlaying
              ? '0 -4px 20px rgba(212,160,23,0.15), 0 -1px 0 rgba(212,160,23,0.3)'
              : 'none',
          } : undefined}
        >
          {/* ════════════ EXPANDED FULL-SCREEN ════════════ */}
          {isExpanded && (
            <>
              {/* Sacred ambient background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full blur-[100px]"
                  style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.15), transparent)' }}
                  animate={{ opacity: isPlaying ? [0.6, 1, 0.6] : 0.3, scale: isPlaying ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {isPlaying && particles.map(p => <SacredParticle key={p.id} {...p} index={p.id} />)}
              </div>

              {/* Drag handle */}
              <div className="relative z-10 flex items-center justify-center pt-3 pb-1" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)' }}>
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="relative z-10 flex justify-between items-center px-5 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#D4A017] shadow-sm shadow-[#D4A017]/40" />
                  <span className="text-[10px] font-[family-name:var(--font-ui)] font-semibold tracking-wider uppercase text-[#D4A017]/80">
                    KIAAN Vibe
                  </span>
                </div>
                <button
                  onClick={() => { setIsExpanded(false); setShowQueue(false); setShowVolume(false); setShowSpeed(false); triggerHaptic('light') }}
                  className="p-2 text-white/60 active:text-white"
                  aria-label="Collapse player"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
                {/* Album art with circular progress */}
                <div className="flex justify-center mt-4 mb-5">
                  <div className="relative" style={{ width: 'min(72vw, 300px)', height: 'min(72vw, 300px)' }}>
                    <CircularProgress progress={progress} size={300} strokeWidth={2} />
                    <div className="absolute inset-3 rounded-3xl overflow-hidden flex items-center justify-center border border-[#D4A017]/10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.03))',
                        boxShadow: isPlaying
                          ? '0 0 40px rgba(212,160,23,0.3), 0 0 80px rgba(212,160,23,0.1), 0 40px 80px rgba(5,7,20,0.9)'
                          : '0 20px 60px rgba(5,7,20,0.8)',
                      }}
                    >
                      {currentTrack.albumArt ? (
                        <Image src={currentTrack.albumArt} alt={currentTrack.title} width={280} height={280} className="w-full h-full object-cover rounded-3xl" unoptimized />
                      ) : (
                        <Music2 className={`w-16 h-16 text-[#D4A017] transition-all duration-500 ${isPlaying ? 'scale-110' : ''}`} />
                      )}
                    </div>
                    {isPlaying && (
                      <motion.div className="absolute -inset-2 rounded-3xl pointer-events-none"
                        animate={{ boxShadow: ['0 0 20px rgba(212,160,23,0.1)', '0 0 40px rgba(212,160,23,0.25)', '0 0 20px rgba(212,160,23,0.1)'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                </div>

                {/* Track info */}
                <div className="text-center mb-4">
                  <h2 className="font-[family-name:var(--font-divine)] text-[22px] text-[#EDE8DC] truncate px-2" style={{ fontWeight: 500 }}>
                    {currentTrack.title}
                  </h2>
                  <p className="font-[family-name:var(--font-ui)] text-sm text-[#B8AE98] mt-1" style={{ fontWeight: 300 }}>
                    {currentTrack.artist || 'KIAAN Vibe'}
                  </p>
                  <span className="inline-block mt-2 px-3 py-0.5 text-[10px] text-[#D4A017] tracking-[0.12em] uppercase font-[family-name:var(--font-ui)] rounded-full border border-[#D4A017]/20 bg-[#D4A017]/5">
                    {categoryLabel}
                  </span>
                </div>

                {/* Waveform visualization */}
                <div className="flex items-end justify-center gap-1 h-9 mb-4 px-2">
                  {waveformBars.map((height, i) => (
                    <WaveformBar key={i} height={height} index={i} isPlaying={isPlaying} />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div
                    ref={progressRef}
                    className="h-1 bg-white/10 rounded-full cursor-pointer relative"
                    style={{ height: isScrubbing ? 6 : 4 }}
                    onClick={handleProgressClick}
                    onTouchMove={handleProgressTouch}
                    onTouchEnd={handleProgressTouchEnd}
                  >
                    <div
                      className="h-full rounded-full relative"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #D4A017, #06B6D4, #D4A017)' }}
                    >
                      <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-[#D4A017] -mr-2"
                        style={{ boxShadow: '0 0 8px rgba(212,160,23,0.6)' }}
                        animate={{ width: isScrubbing ? 20 : 14, height: isScrubbing ? 20 : 14 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[12px] text-[#6B6355] mt-1.5 font-[family-name:var(--font-ui)]" style={{ fontWeight: 400 }}>
                    <span>{formatDuration(position)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Primary controls */}
                <div className="flex items-center justify-center gap-8 mb-5">
                  <button onClick={handlePrevious} className="p-3 text-[#B8AE98] active:text-[#D4A017] active:scale-95 transition-all" aria-label="Previous">
                    <SkipBack className="w-7 h-7" />
                  </button>

                  {(isPlaying || position > 0) && (
                    <button onClick={handleStop} className="p-2 text-[#6B6355] active:text-white active:scale-95 transition-all" aria-label="Stop">
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                  )}

                  {/* Play/Pause — 72px crown button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleToggle}
                    disabled={isLoading}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle, #2563EB, #0B0E2A)',
                      border: '2px solid rgba(212,160,23,0.5)',
                      boxShadow: isPlaying
                        ? '0 0 24px rgba(37,99,235,0.4), 0 0 12px rgba(212,160,23,0.2)'
                        : '0 0 12px rgba(37,99,235,0.2)',
                    }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <motion.div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </motion.button>

                  <button onClick={handleNext} className="p-3 text-[#B8AE98] active:text-[#D4A017] active:scale-95 transition-all" aria-label="Next">
                    <SkipForward className="w-7 h-7" />
                  </button>
                </div>

                {/* Secondary controls */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  {[
                    { icon: <Shuffle className="w-[18px] h-[18px]" />, active: shuffle, action: () => { toggleShuffle(); triggerHaptic('selection') }, label: 'Shuffle' },
                    { icon: repeatMode === 'one' ? <Repeat1 className="w-[18px] h-[18px]" /> : <Repeat className="w-[18px] h-[18px]" />, active: repeatMode !== 'off', action: cycleRepeatMode, label: `Repeat: ${repeatMode}` },
                    { icon: muted || volume === 0 ? <VolumeX className="w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px]" />, active: showVolume, action: () => { setShowVolume(!showVolume); setShowQueue(false); setShowSpeed(false); triggerHaptic('selection') }, label: 'Volume' },
                    { icon: <ListMusic className="w-[18px] h-[18px]" />, active: showQueue, action: () => { setShowQueue(!showQueue); setShowVolume(false); setShowSpeed(false); triggerHaptic('selection') }, label: 'Queue' },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.action}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                        btn.active
                          ? 'text-[#D4A017] bg-[#D4A017]/10 border-[#D4A017]/20'
                          : 'text-[#6B6355] bg-[rgba(22,26,66,0.6)] border-white/[0.06]'
                      }`}
                      aria-label={btn.label}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                {/* Speed selector */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <span className="text-[11px] text-[#6B6355] mr-1 font-[family-name:var(--font-ui)]">Speed</span>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => { setPlaybackRate(rate); triggerHaptic('selection') }}
                      className={`px-2.5 py-1.5 text-[11px] rounded-full border transition-all font-[family-name:var(--font-ui)] ${
                        playbackRate === rate
                          ? 'bg-[#D4A017] text-white border-[#D4A017] font-medium'
                          : 'bg-transparent text-[#6B6355] border-[#D4A017]/15'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Volume slider */}
                <AnimatePresence>
                  {showVolume && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                      <div className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-[#D4A017]/10 bg-[rgba(22,26,66,0.5)]">
                        <button onClick={() => { toggleMute(); triggerHaptic('selection') }} className="p-1 text-[#6B6355]" aria-label={muted ? 'Unmute' : 'Mute'}>
                          {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                          onChange={e => setVolume(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D4A017]" />
                        <span className="text-[11px] text-[#6B6355] w-8 text-right font-[family-name:var(--font-ui)]">
                          {Math.round((muted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Queue list */}
                <AnimatePresence>
                  {showQueue && queue.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="rounded-2xl border border-[#D4A017]/10 bg-[rgba(22,26,66,0.4)] p-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-[family-name:var(--font-ui)] font-medium text-[#B8AE98] uppercase tracking-wider">
                            Queue ({queue.length})
                          </p>
                          <button onClick={() => { clearQueue(); triggerHaptic('light') }} className="text-[10px] text-[#6B6355]">
                            Clear
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {queue.map((track, index) => (
                            <div
                              key={`${track.id}-${index}`}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                                index === queueIndex ? 'bg-[#D4A017]/10 border border-[#D4A017]/20' : 'bg-white/[0.02]'
                              }`}
                            >
                              <span className="text-[11px] text-[#6B6355] w-5 text-center font-[family-name:var(--font-ui)]">
                                {index === queueIndex ? (
                                  <motion.div className="w-2 h-2 rounded-full bg-[#D4A017] mx-auto"
                                    animate={isPlaying ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }} />
                                ) : index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#EDE8DC] truncate font-[family-name:var(--font-ui)]">{track.title}</p>
                                <p className="text-[10px] text-[#6B6355] truncate">{track.artist || 'KIAAN Vibe'}</p>
                              </div>
                              {index !== queueIndex && (
                                <button onClick={() => { removeFromQueue(index); triggerHaptic('light') }} className="p-1 text-[#6B6355]/40 active:text-[#6B6355]" aria-label="Remove">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Audio error */}
                {audioError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-300 flex-1">{audioError}</p>
                      <button onClick={() => { retryPlayback(); triggerHaptic('medium') }} className="p-1.5 rounded-lg bg-red-500/20 text-red-300" aria-label="Retry">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => clearAudioError()} className="p-1.5 rounded-lg bg-white/5 text-[#6B6355]" aria-label="Dismiss">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════ MINI-PLAYER BAR (64px) ════════════ */}
          {!isExpanded && (
            <div className="h-16 px-3 flex items-center gap-3 relative">
              {/* Album art (44px circle) */}
              <button
                onClick={() => { setIsExpanded(true); triggerHaptic('medium') }}
                className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.03))',
                  borderColor: isPlaying ? 'rgba(212,160,23,0.3)' : 'rgba(212,160,23,0.1)',
                  boxShadow: isPlaying ? '0 0 16px rgba(212,160,23,0.3)' : 'none',
                }}
              >
                {currentTrack.albumArt ? (
                  <Image src={currentTrack.albumArt} alt={currentTrack.title} width={44} height={44} className="w-full h-full object-cover rounded-full" unoptimized />
                ) : (
                  <Music2 className="w-5 h-5 text-[#D4A017]" />
                )}
              </button>

              {/* Track info */}
              <button className="flex-1 min-w-0 text-left" onClick={() => { setIsExpanded(true); triggerHaptic('medium') }}>
                <p className="text-[13px] text-[#EDE8DC] truncate font-[family-name:var(--font-ui)]" style={{ fontWeight: 500 }}>{currentTrack.title}</p>
                <p className="text-[11px] text-[#6B6355] truncate font-[family-name:var(--font-ui)]">{currentTrack.artist || 'KIAAN Vibe'}</p>
              </button>

              {/* Mini controls */}
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggle}
                  disabled={isLoading}
                  className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-[#D4A017] text-white' : 'bg-white/10 text-white'}`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </motion.button>
                <button onClick={handleNext} className="p-2 text-[#6B6355]" aria-label="Next">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsExpanded(true); triggerHaptic('light') }} className="p-1.5 text-[#6B6355]" aria-label="Expand">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar (thin, below content) */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div className="h-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #D4A017, #06B6D4)' }} />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MobileVibePlayer
