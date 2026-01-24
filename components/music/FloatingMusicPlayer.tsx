'use client'

/**
 * Floating Music Player Component
 *
 * A minimal, always-accessible floating music control:
 * - Shows current playing state
 * - Quick play/pause
 * - Quick volume control
 * - Expandable for full controls
 *
 * Floats in the corner of the screen for constant access
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  Music,
  Sparkles,
  Clock,
  Brain
} from 'lucide-react'
import {
  useMusic,
  AMBIENT_MODES,
  SPIRITUAL_MODES,
  TIME_MUSIC_INFO,
  MEDITATION_TYPES
} from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'

interface FloatingMusicPlayerProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  initiallyVisible?: boolean
  className?: string
}

export function FloatingMusicPlayer({
  position = 'bottom-right',
  initiallyVisible = true,
  className = ''
}: FloatingMusicPlayerProps) {
  const {
    state,
    isPlaying,
    startAmbient,
    stopAll,
    setMasterVolume,
    startKrishnaFlute
  } = useMusic()

  const { playSound } = useAudio()

  const [isVisible, setIsVisible] = useState(initiallyVisible)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // Position classes
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4'
  }

  // Get current playing info
  const getCurrentInfo = () => {
    const parts: string[] = []

    if (state.ambientEnabled && state.currentAmbientMode) {
      parts.push(AMBIENT_MODES[state.currentAmbientMode].name)
    }
    if (state.spiritualEnabled && state.currentSpiritualMode) {
      parts.push(SPIRITUAL_MODES[state.currentSpiritualMode].name)
    }
    if (state.timeAwareEnabled && state.currentTimeMusic) {
      parts.push(TIME_MUSIC_INFO[state.currentTimeMusic].name)
    }
    if (state.meditationEnabled && state.currentMeditationType) {
      parts.push(MEDITATION_TYPES[state.currentMeditationType].name)
    }

    return parts.length > 0 ? parts.join(' + ') : 'Not playing'
  }

  // Get icon based on what's playing
  const getIcon = () => {
    if (state.meditationEnabled) return Brain
    if (state.spiritualEnabled) return Sparkles
    if (state.timeAwareEnabled) return Clock
    return Music
  }

  const handleTogglePlay = useCallback(() => {
    playSound?.('click')
    if (isPlaying) {
      stopAll()
    } else {
      // Start a default ambient if nothing selected
      startAmbient('serene')
    }
  }, [isPlaying, stopAll, startAmbient, playSound])

  const handleVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume)
  }, [setMasterVolume])

  const Icon = getIcon()

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed ${positionClasses[position]} z-50 p-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow ${className}`}
      >
        <Music className="w-5 h-5" />
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded view
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-72 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-900/20 to-purple-900/20">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isPlaying ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/20' : 'bg-white/10'}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-1.5">
                    MindVibe Music
                    <span className="text-[8px] px-1 py-0.5 rounded bg-violet-500/30 text-violet-200">PRO</span>
                  </p>
                  <p className="text-xs text-white/50">{isPlaying ? 'Now Playing' : 'Ready to play'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronUp className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Now Playing */}
            {isPlaying && (
              <div className="p-3 bg-white/5">
                <p className="text-xs text-white/40 mb-1">Now Playing</p>
                <p className="text-sm font-medium text-white truncate">{getCurrentInfo()}</p>
              </div>
            )}

            {/* Controls */}
            <div className="p-3 space-y-3">
              {/* Play/Pause + Volume */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className={`
                    p-3 rounded-xl transition-all
                    ${isPlaying
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }
                  `}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVolumeChange(state.masterVolume === 0 ? 0.6 : 0)}
                      className="p-1 text-white/50 hover:text-white"
                    >
                      {state.masterVolume === 0 ? (
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
                      value={state.masterVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              {!isPlaying && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => startAmbient('serene')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center transition-colors"
                  >
                    <Sparkles className="w-4 h-4 mx-auto text-purple-400" />
                    <p className="text-xs text-white/60 mt-1">Serene</p>
                  </button>
                  <button
                    onClick={() => startAmbient('nature')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center transition-colors"
                  >
                    <span className="text-lg">🌿</span>
                    <p className="text-xs text-white/60 mt-1">Nature</p>
                  </button>
                  <button
                    onClick={() => startKrishnaFlute()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center transition-colors"
                  >
                    <span className="text-lg">🪈</span>
                    <p className="text-xs text-white/60 mt-1">Flute</p>
                  </button>
                </div>
              )}
            </div>

            {/* Footer with link */}
            <div className="p-2 border-t border-white/5 flex items-center justify-between gap-2">
              <a
                href="/sounds"
                className="flex-1 p-2 rounded-lg text-xs text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/10 transition-colors text-center"
              >
                Full Experience →
              </a>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Collapsed view
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 p-2 rounded-full bg-[#0d0d12]/95 backdrop-blur-xl border border-white/10 shadow-xl"
          >
            {/* Playing indicator */}
            {isPlaying && (
              <div className="flex items-center gap-1 px-2">
                <motion.div
                  className="w-1 h-3 rounded-full bg-purple-500"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1 h-3 rounded-full bg-purple-400"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-3 rounded-full bg-purple-300"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            )}

            {/* Play/Pause */}
            <button
              onClick={handleTogglePlay}
              className={`
                p-2.5 rounded-full transition-all
                ${isPlaying
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }
              `}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Volume (on hover) */}
            <div
              className="relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button className="p-2 rounded-full text-white/50 hover:text-white transition-colors">
                {state.masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 p-2 bg-[#1a1a1f] rounded-lg border border-white/10 shadow-xl"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.masterVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1.5 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expand */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FloatingMusicPlayer
