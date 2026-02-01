'use client'

/**
 * Floating Music Player - Minimal & Polished
 * MindVibe Music - Ultra HD Professional Audio
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  Music,
  Sparkles
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

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4'
  }

  const getCurrentInfo = () => {
    if (state.ambientEnabled && state.currentAmbientMode) {
      return AMBIENT_MODES[state.currentAmbientMode].name
    }
    if (state.spiritualEnabled && state.currentSpiritualMode) {
      return SPIRITUAL_MODES[state.currentSpiritualMode].name
    }
    if (state.timeAwareEnabled && state.currentTimeMusic) {
      return TIME_MUSIC_INFO[state.currentTimeMusic].name
    }
    if (state.meditationEnabled && state.currentMeditationType) {
      return MEDITATION_TYPES[state.currentMeditationType].name
    }
    return 'Ready'
  }

  const handleTogglePlay = useCallback(() => {
    playSound?.('click')
    if (isPlaying) {
      stopAll()
    } else {
      startAmbient('serene')
    }
  }, [isPlaying, stopAll, startAmbient, playSound])

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
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-64 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-white/10'}`}>
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">MindVibe</p>
                  <p className="text-[10px] text-white/50">{isPlaying ? 'Playing' : 'Ready'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <ChevronUp className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Now Playing */}
            {isPlaying && (
              <div className="px-3 py-2 bg-white/5">
                <p className="text-xs text-white/70 truncate">{getCurrentInfo()}</p>
              </div>
            )}

            {/* Controls */}
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className={`
                    p-3 rounded-xl transition-all
                    ${isPlaying
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }
                  `}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <button
                    onClick={() => setMasterVolume(state.masterVolume === 0 ? 0.6 : 0)}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    {state.masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={state.masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              {!isPlaying && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => startAmbient('serene')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center"
                  >
                    <Sparkles className="w-4 h-4 mx-auto text-purple-400" />
                    <p className="text-[10px] text-white/60 mt-1">Serene</p>
                  </button>
                  <button
                    onClick={() => startAmbient('nature')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center"
                  >
                    <span className="text-sm">🌿</span>
                    <p className="text-[10px] text-white/60 mt-1">Nature</p>
                  </button>
                  <button
                    onClick={() => startKrishnaFlute()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-center"
                  >
                    <span className="text-sm">🪈</span>
                    <p className="text-[10px] text-white/60 mt-1">Flute</p>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/5 flex items-center justify-between">
              <a
                href="/kiaan-vibe"
                className="flex-1 p-2 rounded-lg text-[10px] text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/10 text-center"
              >
                Full Experience →
              </a>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1 p-1.5 rounded-full bg-[#0d0d12]/95 backdrop-blur-xl border border-white/10 shadow-xl"
          >
            {isPlaying && (
              <div className="flex items-center gap-0.5 px-2">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 h-3 rounded-full bg-purple-400"
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleTogglePlay}
              className={`
                p-2 rounded-full transition-all
                ${isPlaying
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }
              `}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10"
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
