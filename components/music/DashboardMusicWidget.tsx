'use client'

/**
 * Dashboard Music Widget - Clean & Polished
 * MindVibe Music - Ultra HD Professional Audio
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  Music,
  Moon,
  Sun,
  Brain,
  Heart,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import {
  useMusic,
  AMBIENT_MODES,
  SPIRITUAL_MODES,
  type AmbientMusicMode
} from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'
import Link from 'next/link'

interface DashboardMusicWidgetProps {
  className?: string
  variant?: 'full' | 'compact' | 'minimal'
}

const QUICK_PRESETS = [
  { id: 'morning', name: 'Morning', icon: Sun, color: 'from-amber-500 to-orange-500', action: 'startMorningMusic' },
  { id: 'focus', name: 'Focus', icon: Brain, color: 'from-blue-500 to-cyan-500', action: 'startFocusMusic' },
  { id: 'meditation', name: 'Meditate', icon: Sparkles, color: 'from-violet-500 to-purple-500', action: 'startDeepMeditation' },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: 'from-indigo-500 to-purple-600', action: 'startSleepMusic' },
  { id: 'healing', name: 'Healing', icon: Heart, color: 'from-emerald-500 to-teal-500', action: 'startAmbient' },
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
    startKrishnaFlute
  } = music

  const { playSound } = useAudio()
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const handlePresetSelect = useCallback(async (preset: typeof QUICK_PRESETS[0]) => {
    playSound?.('click')
    setActivePreset(preset.id)

    switch (preset.action) {
      case 'startMorningMusic': await startMorningMusic(); break
      case 'startFocusMusic': await startFocusMusic(); break
      case 'startDeepMeditation': await startDeepMeditation(); break
      case 'startSleepMusic': await startSleepMusic(); break
      case 'startAmbient': await startAmbient('healing'); break
    }
  }, [startMorningMusic, startFocusMusic, startDeepMeditation, startSleepMusic, startAmbient, playSound])

  const handleStop = useCallback(() => {
    playSound?.('click')
    stopAll()
    setActivePreset(null)
  }, [stopAll, playSound])

  const getCurrentDescription = () => {
    if (state.ambientEnabled && state.currentAmbientMode) {
      return AMBIENT_MODES[state.currentAmbientMode].name
    }
    if (state.spiritualEnabled && state.currentSpiritualMode) {
      return SPIRITUAL_MODES[state.currentSpiritualMode].name
    }
    if (state.meditationEnabled) return 'Meditation'
    return null
  }

  // Minimal variant
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
          {isPlaying ? <Pause className="w-5 h-5" /> : <Music className="w-5 h-5" />}
          <span className="text-sm font-medium">{isPlaying ? getCurrentDescription() : 'Play Music'}</span>
        </div>
      </button>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`rounded-2xl bg-[#0d0d12]/95 border border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Music</span>
          </div>
          {isPlaying && (
            <button onClick={handleStop} className="text-xs text-white/50 hover:text-white">Stop</button>
          )}
        </div>
        <div className="flex gap-2">
          {QUICK_PRESETS.slice(0, 4).map((preset) => {
            const Icon = preset.icon
            const isActive = activePreset === preset.id && isPlaying
            return (
              <button
                key={preset.id}
                onClick={() => isActive ? handleStop() : handlePresetSelect(preset)}
                className={`
                  flex-1 p-2.5 rounded-xl transition-all
                  ${isActive
                    ? `bg-gradient-to-r ${preset.color} text-white`
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }
                `}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Full variant - polished design
  return (
    <div className={`rounded-2xl bg-[#0d0d12]/95 border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isPlaying ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-white/10'}`}>
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">MindVibe Music</h3>
              <p className="text-xs text-white/50">
                {isPlaying ? getCurrentDescription() : 'Tap to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && (
              <div className="flex items-center gap-0.5 px-2">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-4 rounded-full bg-purple-400"
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={isPlaying ? handleStop : () => startAmbient('serene')}
              className={`
                p-2.5 rounded-xl transition-all
                ${isPlaying
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                }
              `}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {QUICK_PRESETS.map((preset) => {
            const Icon = preset.icon
            const isActive = activePreset === preset.id && isPlaying
            return (
              <button
                key={preset.id}
                onClick={() => isActive ? handleStop() : handlePresetSelect(preset)}
                className={`
                  relative p-3 rounded-xl transition-all text-center
                  ${isActive
                    ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : 'text-white/60'}`} />
                <p className="text-[10px] font-medium">{preset.name}</p>
                {isActive && (
                  <motion.div
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spiritual Shortcuts */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => startKrishnaFlute()}
            className="flex-1 p-3 rounded-xl bg-blue-900/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors text-center"
          >
            <span className="text-lg">🪈</span>
            <p className="text-xs font-medium text-white mt-1">Flute</p>
          </button>
          <button
            onClick={() => music.startOmMeditation()}
            className="flex-1 p-3 rounded-xl bg-orange-900/20 border border-orange-500/20 hover:border-orange-500/40 transition-colors text-center"
          >
            <span className="text-lg">🕉️</span>
            <p className="text-xs font-medium text-white mt-1">Om</p>
          </button>
          <button
            onClick={() => music.startTimeMusic()}
            className="flex-1 p-3 rounded-xl bg-amber-900/20 border border-amber-500/20 hover:border-amber-500/40 transition-colors text-center"
          >
            <span className="text-lg">🎵</span>
            <p className="text-xs font-medium text-white mt-1">Raga</p>
          </button>
        </div>
      </div>

      {/* Volume (when playing) */}
      {isPlaying && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <Volume2 className="w-4 h-4 text-white/40" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-xs text-white/40 w-8">{Math.round(state.masterVolume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <Link
        href="/sounds"
        className="flex items-center justify-between p-3 border-t border-white/5 hover:bg-white/5 transition-colors"
      >
        <span className="text-xs text-white/50">Full Experience</span>
        <ChevronRight className="w-4 h-4 text-white/30" />
      </Link>
    </div>
  )
}

export default DashboardMusicWidget
