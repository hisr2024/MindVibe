'use client'

/**
 * Meditation Music Player Component
 *
 * ॐ श्री गणेशाय नमः
 *
 * Professional meditation music player with brainwave entrainment:
 * - Delta (0.5-4 Hz): Deep sleep, healing
 * - Theta (4-8 Hz): Meditation, creativity
 * - Alpha (8-14 Hz): Relaxation, calm focus
 * - Beta (14-30 Hz): Concentration, focus
 * - Gamma (30-100 Hz): Peak awareness
 *
 * Based on Bhagavad Gita Chapter 6 - Dhyana Yoga
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Brain,
  Moon,
  Sparkles,
  Eye,
  Focus,
  Zap,
  Timer,
  Info,
  ChevronRight
} from 'lucide-react'
import {
  useMusic,
  MEDITATION_TYPES,
  type MeditationType,
  type BrainwaveState
} from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'

interface MeditationMusicPlayerProps {
  className?: string
  showTimer?: boolean
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

// Brainwave visualization colors
const BRAINWAVE_COLORS: Record<BrainwaveState, {
  primary: string
  secondary: string
  glow: string
}> = {
  delta: {
    primary: '#4c1d95',  // purple-900
    secondary: '#7c3aed', // violet-600
    glow: 'rgba(124, 58, 237, 0.3)'
  },
  theta: {
    primary: '#5b21b6',  // violet-800
    secondary: '#a78bfa', // violet-400
    glow: 'rgba(167, 139, 250, 0.3)'
  },
  alpha: {
    primary: '#1e40af',  // blue-800
    secondary: '#60a5fa', // blue-400
    glow: 'rgba(96, 165, 250, 0.3)'
  },
  beta: {
    primary: '#065f46',  // emerald-800
    secondary: '#34d399', // emerald-400
    glow: 'rgba(52, 211, 153, 0.3)'
  },
  gamma: {
    primary: '#b45309',  // amber-700
    secondary: '#fbbf24', // amber-400
    glow: 'rgba(251, 191, 36, 0.3)'
  }
}

const BRAINWAVE_ICONS: Record<BrainwaveState, typeof Moon> = {
  delta: Moon,
  theta: Sparkles,
  alpha: Eye,
  beta: Focus,
  gamma: Zap
}

export function MeditationMusicPlayer({
  className = '',
  showTimer = true,
  onSessionStart,
  onSessionEnd
}: MeditationMusicPlayerProps) {
  const {
    state,
    startMeditation,
    stopMeditation,
    setMeditationVolume
  } = useMusic()

  const { playSound } = useAudio()

  // State
  const [selectedType, setSelectedType] = useState<MeditationType | null>(null)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(20) // minutes
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const isPlaying = state.meditationEnabled
  const currentBrainwave = state.currentBrainwave

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTimerActive, timeRemaining])

  // Brainwave visualization
  useEffect(() => {
    if (!canvasRef.current || !isPlaying || !currentBrainwave) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = BRAINWAVE_COLORS[currentBrainwave]
    let phase = 0

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerY = canvas.height / 2
      const amplitude = canvas.height * 0.3

      // Get frequency based on brainwave
      const freqMap: Record<BrainwaveState, number> = {
        delta: 0.02,
        theta: 0.04,
        alpha: 0.06,
        beta: 0.1,
        gamma: 0.15
      }

      const frequency = freqMap[currentBrainwave]

      // Draw wave
      ctx.beginPath()
      ctx.moveTo(0, centerY)

      for (let x = 0; x < canvas.width; x++) {
        const y = centerY + Math.sin((x * frequency) + phase) * amplitude
          + Math.sin((x * frequency * 0.5) + phase * 0.7) * (amplitude * 0.3)
        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = colors.secondary
      ctx.lineWidth = 3
      ctx.shadowColor = colors.glow
      ctx.shadowBlur = 20
      ctx.stroke()

      phase += 0.05
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentBrainwave])

  // Handle meditation start
  const handleStart = useCallback(async (type: MeditationType) => {
    playSound?.('meditation_start')
    setSelectedType(type)
    await startMeditation(type)

    if (showTimer) {
      setTimeRemaining(timerDuration * 60)
      setIsTimerActive(true)
    }

    onSessionStart?.()
  }, [startMeditation, playSound, timerDuration, showTimer, onSessionStart])

  // Handle meditation stop
  const handleStop = useCallback(() => {
    playSound?.('meditation_end')
    stopMeditation()
    setIsTimerActive(false)
    setTimeRemaining(0)
  }, [stopMeditation, playSound])

  // Handle session end (timer completed)
  const handleSessionEnd = useCallback(() => {
    playSound?.('gong')
    setIsTimerActive(false)

    // Fade out music
    setTimeout(() => {
      stopMeditation()
      onSessionEnd?.()
    }, 3000)
  }, [stopMeditation, playSound, onSessionEnd])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12] to-[#08080b] border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">KIAAN Vibes</h3>
              <p className="text-xs text-white/50">Brainwave entrainment for deep practice</p>
            </div>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-violet-900/20 border-b border-white/5 overflow-hidden"
          >
            <div className="p-4 text-sm text-white/70">
              <p className="mb-2">
                <strong className="text-white">Binaural beats</strong> work by playing slightly different frequencies
                in each ear, creating a perceived third frequency that entrains your brain to specific states.
              </p>
              <p>
                Use <strong className="text-white">headphones</strong> for the best experience. Based on
                <em className="text-violet-400"> Bhagavad Gita Chapter 6 - Dhyana Yoga</em>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualization */}
      {isPlaying && (
        <div className="relative h-32 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={128}
            className="w-full h-full"
          />

          {/* Overlay with current info */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent">
            <div className="text-center">
              {currentBrainwave && (
                <>
                  <p className="text-xs text-white/50 mb-1">
                    {currentBrainwave.toUpperCase()} WAVES
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {selectedType && MEDITATION_TYPES[selectedType]?.name}
                  </p>
                  {selectedType && (
                    <p className="text-sm text-white/60 mt-1">
                      {MEDITATION_TYPES[selectedType].nameHindi}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timer Section */}
      {showTimer && isPlaying && (
        <div className="px-4 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/70">Session Timer</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              style={{
                width: `${((timerDuration * 60 - timeRemaining) / (timerDuration * 60)) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Meditation Types Grid */}
      <div className="p-4">
        {!isPlaying && showTimer && (
          <div className="mb-4">
            <label className="text-xs text-white/50 mb-2 block">Session Duration</label>
            <div className="flex gap-2">
              {[10, 15, 20, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setTimerDuration(mins)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all
                    ${timerDuration === mins
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(Object.keys(MEDITATION_TYPES) as MeditationType[]).map((type) => {
            const typeInfo = MEDITATION_TYPES[type]
            const BrainwaveIcon = BRAINWAVE_ICONS[typeInfo.brainwave]
            const isActive = selectedType === type && isPlaying
            const colors = BRAINWAVE_COLORS[typeInfo.brainwave]

            return (
              <motion.button
                key={type}
                onClick={() => isActive ? handleStop() : handleStart(type)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  w-full p-4 rounded-xl transition-all duration-300 text-left
                  ${isActive
                    ? `bg-gradient-to-r ${typeInfo.color} shadow-lg`
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
                style={isActive ? { boxShadow: `0 0 30px ${colors.glow}` } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon/Play button */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all
                      ${isActive
                        ? 'bg-white/20'
                        : `bg-gradient-to-br ${typeInfo.color}`
                      }
                    `}>
                      {isActive ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{typeInfo.name}</h4>
                        <span className="text-xs text-white/50">{typeInfo.nameHindi}</span>
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">{typeInfo.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Brainwave indicator */}
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <BrainwaveIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{typeInfo.brainwave}</span>
                      </div>
                      <p className="text-xs text-white/40">{typeInfo.duration}</p>
                    </div>

                    <ChevronRight className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/30'}`} />
                  </div>
                </div>

                {/* Playing indicator */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-white"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-xs text-white/80">Playing</span>
                      </div>

                      {/* Volume control */}
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-white/60" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={state.meditationVolume}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation()
                            setMeditationVolume(parseFloat(e.target.value))
                          }}
                          className="w-20 h-1.5 accent-white bg-white/20 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Gita Reference */}
      {isPlaying && selectedType && MEDITATION_TYPES[selectedType].gitaReference && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
            <p className="text-xs text-amber-400">
              {MEDITATION_TYPES[selectedType].gitaReference}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeditationMusicPlayer
