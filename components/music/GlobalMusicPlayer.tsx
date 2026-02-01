'use client'

/**
 * Global Music Player - Clean & Professional
 * MindVibe Music - Ultra HD Audio
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Sun,
  Moon,
  Sparkles,
  Leaf,
  Heart,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Waves,
  type LucideIcon
} from 'lucide-react'
import {
  useMusic,
  AMBIENT_MODES,
  TIME_MUSIC_INFO,
  SPIRITUAL_MODES,
  type AmbientMusicMode,
  type SpiritualMode
} from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'

interface GlobalMusicPlayerProps {
  className?: string
  compact?: boolean
  showTimeMusic?: boolean
  showSpiritualMusic?: boolean
}

const AMBIENT_ICONS: Record<AmbientMusicMode, LucideIcon> = {
  serene: Waves,
  ethereal: Sparkles,
  cosmic: Moon,
  nature: Leaf,
  divine: Sun,
  healing: Heart,
  energizing: Zap
}

export function GlobalMusicPlayer({
  className = '',
  compact = false,
  showTimeMusic = true,
  showSpiritualMusic = true
}: GlobalMusicPlayerProps) {
  const {
    state,
    isPlaying,
    startAmbient,
    stopAmbient,
    startTimeMusic,
    stopTimeMusic,
    startSpiritual,
    stopSpiritual,
    setMasterVolume,
    setAmbientVolume,
    stopAll,
    getCurrentTimeRaga
  } = useMusic()

  const { playSound } = useAudio()

  const [isExpanded, setIsExpanded] = useState(!compact)
  const [activeTab, setActiveTab] = useState<'ambient' | 'time' | 'spiritual'>('ambient')
  const [volume, setVolume] = useState(state.masterVolume)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    setVolume(state.masterVolume)
  }, [state.masterVolume])

  const handleAmbientSelect = useCallback(async (mode: AmbientMusicMode) => {
    playSound?.('click')
    if (state.currentAmbientMode === mode && state.ambientEnabled) {
      stopAmbient()
    } else {
      await startAmbient(mode)
    }
  }, [state.currentAmbientMode, state.ambientEnabled, startAmbient, stopAmbient, playSound])

  const handleTimeMusicToggle = useCallback(async () => {
    playSound?.('click')
    if (state.timeAwareEnabled) {
      stopTimeMusic()
    } else {
      await startTimeMusic()
    }
  }, [state.timeAwareEnabled, startTimeMusic, stopTimeMusic, playSound])

  const handleSpiritualSelect = useCallback(async (mode: SpiritualMode) => {
    playSound?.('click')
    if (state.currentSpiritualMode === mode && state.spiritualEnabled) {
      stopSpiritual()
    } else {
      await startSpiritual(mode)
    }
  }, [state.currentSpiritualMode, state.spiritualEnabled, startSpiritual, stopSpiritual, playSound])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setMasterVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }, [setMasterVolume, isMuted])

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setMasterVolume(volume || 0.6)
      setIsMuted(false)
    } else {
      setMasterVolume(0)
      setIsMuted(true)
    }
    playSound?.('toggle')
  }, [isMuted, volume, setMasterVolume, playSound])

  const handleStopAll = useCallback(() => {
    stopAll()
    playSound?.('click')
  }, [stopAll, playSound])

  const currentTimeInfo = TIME_MUSIC_INFO[state.currentTimeMusic || 'morning']

  return (
    <motion.div
      layout
      className={`rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl overflow-hidden shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? handleStopAll : () => startAmbient('serene')}
              className={`
                p-3 rounded-full transition-all
                ${isPlaying
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }
              `}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div>
              <h3 className="text-sm font-medium text-white">
                {isPlaying ? 'Now Playing' : 'KIAAN Vibes'}
              </h3>
              <p className="text-xs text-white/50">
                {state.ambientEnabled && state.currentAmbientMode && AMBIENT_MODES[state.currentAmbientMode].name}
                {state.timeAwareEnabled && <>{state.ambientEnabled ? ' + ' : ''}{currentTimeInfo.name}</>}
                {state.spiritualEnabled && state.currentSpiritualMode && (
                  <>{(state.ambientEnabled || state.timeAwareEnabled) ? ' + ' : ''}{SPIRITUAL_MODES[state.currentSpiritualMode].name}</>
                )}
                {!isPlaying && 'Tap to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                setIsExpanded(!isExpanded)
                playSound?.('toggle')
              }}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab('ambient')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === 'ambient' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-white/50 hover:text-white/70'}
                `}
              >
                <Music className="w-4 h-4 inline-block mr-1.5" />
                Ambient
              </button>
              {showTimeMusic && (
                <button
                  onClick={() => setActiveTab('time')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === 'time' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-white/50 hover:text-white/70'}
                  `}
                >
                  <Clock className="w-4 h-4 inline-block mr-1.5" />
                  Ragas
                </button>
              )}
              {showSpiritualMusic && (
                <button
                  onClick={() => setActiveTab('spiritual')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === 'spiritual' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-white/50 hover:text-white/70'}
                  `}
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1.5" />
                  Sacred
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {/* Ambient Tab */}
              {activeTab === 'ambient' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(AMBIENT_MODES) as AmbientMusicMode[]).map((mode) => {
                    const modeInfo = AMBIENT_MODES[mode]
                    const Icon = AMBIENT_ICONS[mode]
                    const isActive = state.currentAmbientMode === mode && state.ambientEnabled

                    return (
                      <button
                        key={mode}
                        onClick={() => handleAmbientSelect(mode)}
                        className={`
                          relative p-3 rounded-xl transition-all text-left
                          ${isActive
                            ? `bg-gradient-to-r ${modeInfo.color} text-white shadow-lg`
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        <p className="text-sm font-medium">{modeInfo.name}</p>
                        {isActive && (
                          <motion.div
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Time Music Tab */}
              {activeTab === 'time' && showTimeMusic && (
                <div className="space-y-4">
                  <div
                    onClick={handleTimeMusicToggle}
                    className={`
                      p-4 rounded-xl cursor-pointer transition-all
                      ${state.timeAwareEnabled
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                        : 'bg-white/5 hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${state.timeAwareEnabled ? 'bg-white/20' : 'bg-white/10'}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Time-Aware Ragas</p>
                          <p className="text-sm opacity-70">Auto-plays based on time</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full ${state.timeAwareEnabled ? 'bg-white/30' : 'bg-white/10'}`}>
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white shadow-md mt-0.5"
                          animate={{ x: state.timeAwareEnabled ? 26 : 2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {state.timeAwareEnabled && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-amber-900/30 border border-amber-500/20"
                    >
                      <p className="text-xs text-amber-400 mb-1">Now Playing</p>
                      <p className="text-lg font-semibold text-white">Raga {currentTimeInfo.name}</p>
                      <p className="text-sm text-white/60 mt-1">{currentTimeInfo.timeRange}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Spiritual Tab */}
              {activeTab === 'spiritual' && showSpiritualMusic && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(SPIRITUAL_MODES) as SpiritualMode[]).map((mode) => {
                    const modeInfo = SPIRITUAL_MODES[mode]
                    const isActive = state.currentSpiritualMode === mode && state.spiritualEnabled

                    return (
                      <button
                        key={mode}
                        onClick={() => handleSpiritualSelect(mode)}
                        className={`
                          relative p-3 rounded-xl transition-all text-left
                          ${isActive
                            ? `bg-gradient-to-r ${modeInfo.color} text-white shadow-lg`
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }
                        `}
                      >
                        <span className="text-xl mb-1 block">{modeInfo.icon}</span>
                        <p className="text-sm font-medium truncate">{modeInfo.name}</p>
                        {isActive && (
                          <motion.div
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Volume Control */}
            {isPlaying && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                  <Volume2 className="w-4 h-4 text-white/40" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white/40 w-8">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default GlobalMusicPlayer
