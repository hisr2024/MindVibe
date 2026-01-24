'use client'

/**
 * Dashboard Music Widget
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A beautiful, compact music widget for the dashboard:
 * - Quick access to ambient music
 * - Time-aware raga suggestions
 * - One-tap presets for different activities
 * - Spiritual music shortcuts
 *
 * "वेणुं च" - The divine flute of Krishna (BG 10.35)
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Moon,
  Sun,
  Brain,
  Heart,
  Sparkles,
  Leaf,
  Clock,
  ChevronRight
} from 'lucide-react'
import {
  useMusic,
  AMBIENT_MODES,
  SPIRITUAL_MODES,
  TIME_MUSIC_INFO,
  type AmbientMusicMode,
  type SpiritualMode
} from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'
import Link from 'next/link'

interface DashboardMusicWidgetProps {
  className?: string
  variant?: 'full' | 'compact' | 'minimal'
}

// Quick preset configurations
const QUICK_PRESETS = [
  {
    id: 'morning',
    name: 'Morning',
    nameHindi: 'प्रभात',
    icon: Sun,
    color: 'from-amber-500 to-orange-500',
    action: 'startMorningMusic'
  },
  {
    id: 'focus',
    name: 'Focus',
    nameHindi: 'एकाग्रता',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    action: 'startFocusMusic'
  },
  {
    id: 'meditation',
    name: 'Meditate',
    nameHindi: 'ध्यान',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
    action: 'startDeepMeditation'
  },
  {
    id: 'sleep',
    name: 'Sleep',
    nameHindi: 'निद्रा',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
    action: 'startSleepMusic'
  },
  {
    id: 'healing',
    name: 'Healing',
    nameHindi: 'उपचार',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    action: 'startAmbient'
  },
  {
    id: 'nature',
    name: 'Nature',
    nameHindi: 'प्रकृति',
    icon: Leaf,
    color: 'from-green-500 to-emerald-500',
    action: 'startAmbient'
  }
]

export function DashboardMusicWidget({
  className = '',
  variant = 'full'
}: DashboardMusicWidgetProps) {
  const music = useMusic()
  const {
    state,
    isPlaying,
    startAmbient,
    stopAll,
    setMasterVolume,
    startMorningMusic,
    startFocusMusic,
    startDeepMeditation,
    startSleepMusic,
    startKrishnaFlute,
    getCurrentTimeRaga
  } = music

  const { playSound } = useAudio()

  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Get current time info
  const currentRaga = getCurrentTimeRaga()
  const hour = new Date().getHours()
  const getTimeOfDay = () => {
    if (hour >= 4 && hour < 6) return 'brahma_muhurta'
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 16) return 'afternoon'
    if (hour >= 16 && hour < 20) return 'evening'
    if (hour >= 20 && hour < 24) return 'night'
    return 'late_night'
  }
  const currentTimeInfo = TIME_MUSIC_INFO[getTimeOfDay()]

  // Handle preset selection
  const handlePresetSelect = useCallback(async (preset: typeof QUICK_PRESETS[0]) => {
    playSound?.('click')
    setActivePreset(preset.id)

    switch (preset.action) {
      case 'startMorningMusic':
        await startMorningMusic()
        break
      case 'startFocusMusic':
        await startFocusMusic()
        break
      case 'startDeepMeditation':
        await startDeepMeditation()
        break
      case 'startSleepMusic':
        await startSleepMusic()
        break
      case 'startAmbient':
        if (preset.id === 'healing') {
          await startAmbient('healing')
        } else if (preset.id === 'nature') {
          await startAmbient('nature')
        }
        break
    }
  }, [startMorningMusic, startFocusMusic, startDeepMeditation, startSleepMusic, startAmbient, playSound])

  // Handle stop
  const handleStop = useCallback(() => {
    playSound?.('click')
    stopAll()
    setActivePreset(null)
  }, [stopAll, playSound])

  // Get current playing description
  const getCurrentDescription = () => {
    if (state.ambientEnabled && state.currentAmbientMode) {
      return AMBIENT_MODES[state.currentAmbientMode].name
    }
    if (state.spiritualEnabled && state.currentSpiritualMode) {
      return SPIRITUAL_MODES[state.currentSpiritualMode].name
    }
    if (state.meditationEnabled && state.currentMeditationType) {
      return 'Meditation'
    }
    return null
  }

  // Minimal variant - just a play button
  if (variant === 'minimal') {
    return (
      <button
        onClick={isPlaying ? handleStop : () => startAmbient('serene')}
        className={`
          p-4 rounded-2xl transition-all duration-300
          ${isPlaying
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }
          ${className}
        `}
      >
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <>
              <Pause className="w-6 h-6" />
              <div>
                <p className="text-sm font-medium">Now Playing</p>
                <p className="text-xs opacity-70">{getCurrentDescription()}</p>
              </div>
            </>
          ) : (
            <>
              <Music className="w-6 h-6" />
              <div>
                <p className="text-sm font-medium">Start Music</p>
                <p className="text-xs opacity-70">Tap to play</p>
              </div>
            </>
          )}
        </div>
      </button>
    )
  }

  // Compact variant - quick presets row
  if (variant === 'compact') {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12]/95 to-[#08080b]/95 border border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Music</span>
          </div>
          {isPlaying && (
            <button
              onClick={handleStop}
              className="text-xs text-white/50 hover:text-white"
            >
              Stop
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {QUICK_PRESETS.slice(0, 4).map((preset) => {
            const Icon = preset.icon
            const isActive = activePreset === preset.id && isPlaying

            return (
              <button
                key={preset.id}
                onClick={() => isActive ? handleStop() : handlePresetSelect(preset)}
                className={`
                  flex-shrink-0 p-2.5 rounded-xl transition-all duration-300
                  ${isActive
                    ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Full variant - complete widget
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12]/95 to-[#08080b]/95 border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isPlaying ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-white/10'}`}>
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                MindVibe Music
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-purple-300 font-medium">PRO</span>
              </h3>
              <p className="text-xs text-white/50">
                {isPlaying ? `Playing: ${getCurrentDescription()}` : 'Spiritual & therapeutic sounds'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && (
              <div className="flex items-center gap-1 px-2">
                <motion.div
                  className="w-1 h-4 rounded-full bg-purple-500"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1 h-4 rounded-full bg-purple-400"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-4 rounded-full bg-purple-300"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            )}

            <button
              onClick={isPlaying ? handleStop : () => startAmbient('serene')}
              className={`
                p-2.5 rounded-xl transition-all
                ${isPlaying
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                }
              `}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Time-based suggestion */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs text-amber-400/70">Suggested for {currentTimeInfo.name}</p>
              <p className="text-sm font-medium text-white">Raga {currentTimeInfo.name}</p>
            </div>
          </div>
          <button
            onClick={() => music.startTimeMusic()}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
          >
            Play
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-4">
        <p className="text-xs text-white/40 mb-3">Quick Start</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_PRESETS.map((preset) => {
            const Icon = preset.icon
            const isActive = activePreset === preset.id && isPlaying

            return (
              <button
                key={preset.id}
                onClick={() => isActive ? handleStop() : handlePresetSelect(preset)}
                className={`
                  relative p-3 rounded-xl transition-all duration-300 text-center
                  ${isActive
                    ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : 'text-white/60'}`} />
                <p className="text-xs font-medium">{preset.name}</p>
                <p className="text-[10px] opacity-60">{preset.nameHindi}</p>

                {isActive && (
                  <motion.div
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spiritual Quick Access */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => startKrishnaFlute()}
            className="flex-1 p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
          >
            <span className="text-xl">🪈</span>
            <p className="text-xs font-medium text-white mt-1">Krishna Flute</p>
            <p className="text-[10px] text-white/50">कृष्ण बांसुरी</p>
          </button>

          <button
            onClick={() => music.startOmMeditation()}
            className="flex-1 p-3 rounded-xl bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
          >
            <span className="text-xl">🕉️</span>
            <p className="text-xs font-medium text-white mt-1">Om Meditation</p>
            <p className="text-[10px] text-white/50">ॐ ध्यान</p>
          </button>
        </div>
      </div>

      {/* Volume Control */}
      {isPlaying && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Volume2 className="w-4 h-4 text-white/50" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-purple-500"
            />
            <span className="text-xs text-white/40 w-8">{Math.round(state.masterVolume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Footer Link */}
      <Link
        href="/sounds"
        className="flex items-center justify-between p-4 border-t border-white/5 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Explore MindVibe Music</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">20+ sounds</span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
      </Link>
    </div>
  )
}

export default DashboardMusicWidget
