'use client'

/**
 * Global Music Player Component
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A professional, full-featured music player for app-wide ambient music:
 * - Ambient music modes (serene, ethereal, cosmic, nature, divine, healing, energizing)
 * - Time-based raga music (automatically adjusts to time of day)
 * - Spiritual modes (Om, Krishna flute, temple bells, etc.)
 * - Beautiful visualizer
 * - Professional mixing controls
 *
 * Based on Bhagavad Gita Chapter 10.35:
 * "वेणुं च" - Krishna's divine flute
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
  Settings2,
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

  // UI State
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [activeTab, setActiveTab] = useState<'ambient' | 'time' | 'spiritual'>('ambient')
  const [volume, setVolume] = useState(state.masterVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // Sync volume state
  useEffect(() => {
    setVolume(state.masterVolume)
  }, [state.masterVolume])

  // Handle ambient selection
  const handleAmbientSelect = useCallback(async (mode: AmbientMusicMode) => {
    playSound?.('click')
    if (state.currentAmbientMode === mode && state.ambientEnabled) {
      stopAmbient()
    } else {
      await startAmbient(mode)
    }
  }, [state.currentAmbientMode, state.ambientEnabled, startAmbient, stopAmbient, playSound])

  // Handle time music toggle
  const handleTimeMusicToggle = useCallback(async () => {
    playSound?.('click')
    if (state.timeAwareEnabled) {
      stopTimeMusic()
    } else {
      await startTimeMusic()
    }
  }, [state.timeAwareEnabled, startTimeMusic, stopTimeMusic, playSound])

  // Handle spiritual selection
  const handleSpiritualSelect = useCallback(async (mode: SpiritualMode) => {
    playSound?.('click')
    if (state.currentSpiritualMode === mode && state.spiritualEnabled) {
      stopSpiritual()
    } else {
      await startSpiritual(mode)
    }
  }, [state.currentSpiritualMode, state.spiritualEnabled, startSpiritual, stopSpiritual, playSound])

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setMasterVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }, [setMasterVolume, isMuted])

  // Handle mute toggle
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

  // Handle stop all
  const handleStopAll = useCallback(() => {
    stopAll()
    playSound?.('click')
  }, [stopAll, playSound])

  const currentRaga = getCurrentTimeRaga()
  const currentTimeInfo = TIME_MUSIC_INFO[state.currentTimeMusic || 'morning']

  return (
    <motion.div
      layout
      className={`
        rounded-2xl border border-white/10
        bg-gradient-to-br from-[#0d0d12]/95 to-[#08080b]/95
        backdrop-blur-xl overflow-hidden shadow-2xl
        ${className}
      `}
    >
      {/* Header with Play/Pause and Volume */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Stop Button */}
            <button
              onClick={isPlaying ? handleStopAll : () => startAmbient('serene')}
              className={`
                p-3 rounded-full transition-all duration-300
                ${isPlaying
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }
              `}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Now Playing Info */}
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                {isPlaying ? 'Now Playing' : 'MindVibe Music'}
                {!isPlaying && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">PRO</span>}
              </h3>
              <p className="text-xs text-white/50">
                {state.ambientEnabled && state.currentAmbientMode && (
                  <>Ambient: {AMBIENT_MODES[state.currentAmbientMode].name}</>
                )}
                {state.timeAwareEnabled && state.currentRaga && (
                  <>{state.ambientEnabled ? ' + ' : ''}Raga: {currentTimeInfo.name}</>
                )}
                {state.spiritualEnabled && state.currentSpiritualMode && (
                  <>{(state.ambientEnabled || state.timeAwareEnabled) ? ' + ' : ''}{SPIRITUAL_MODES[state.currentSpiritualMode].name}</>
                )}
                {!isPlaying && 'Tap to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume Control */}
            <div className="relative">
              <button
                onClick={handleMuteToggle}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1a1a1f] rounded-xl border border-white/10 shadow-xl"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-24 h-2 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-purple-500
                        [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <p className="text-xs text-white/50 text-center mt-1">
                      {Math.round(volume * 100)}%
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expand/Collapse */}
            <button
              onClick={() => {
                setIsExpanded(!isExpanded)
                playSound?.('toggle')
              }}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
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
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === 'ambient'
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-white/50 hover:text-white/70'
                  }
                `}
              >
                <Music className="w-4 h-4 inline-block mr-1.5" />
                Ambient
              </button>
              {showTimeMusic && (
                <button
                  onClick={() => setActiveTab('time')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === 'time'
                      ? 'text-amber-400 border-b-2 border-amber-500'
                      : 'text-white/50 hover:text-white/70'
                    }
                  `}
                >
                  <Clock className="w-4 h-4 inline-block mr-1.5" />
                  Time Music
                </button>
              )}
              {showSpiritualMusic && (
                <button
                  onClick={() => setActiveTab('spiritual')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === 'spiritual'
                      ? 'text-orange-400 border-b-2 border-orange-500'
                      : 'text-white/50 hover:text-white/70'
                    }
                  `}
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1.5" />
                  Spiritual
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
                          relative p-3 rounded-xl transition-all duration-300 text-left
                          ${isActive
                            ? `bg-gradient-to-r ${modeInfo.color} text-white shadow-lg`
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        <p className="text-sm font-medium">{modeInfo.name}</p>
                        <p className="text-xs opacity-60">{modeInfo.nameHindi}</p>

                        {isActive && (
                          <motion.div
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
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
                  {/* Auto Time Music Toggle */}
                  <div
                    onClick={handleTimeMusicToggle}
                    className={`
                      p-4 rounded-xl cursor-pointer transition-all duration-300
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
                          <p className="font-medium">Time-Aware Raga Music</p>
                          <p className="text-sm opacity-70">
                            Auto-plays ragas based on time of day
                          </p>
                        </div>
                      </div>
                      <div className={`
                        w-12 h-6 rounded-full transition-colors
                        ${state.timeAwareEnabled ? 'bg-white/30' : 'bg-white/10'}
                      `}>
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white shadow-md mt-0.5"
                          animate={{ x: state.timeAwareEnabled ? 26 : 2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Raga Info */}
                  {state.timeAwareEnabled && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/20"
                    >
                      <p className="text-xs text-amber-400 mb-1">Currently Playing</p>
                      <p className="text-lg font-semibold text-white">
                        Raga {currentTimeInfo.name}
                      </p>
                      <p className="text-sm text-white/60 mt-1">{currentTimeInfo.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-amber-400/70">
                        <span>{currentTimeInfo.icon}</span>
                        <span>{currentTimeInfo.timeRange}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Suggested Raga */}
                  {!state.timeAwareEnabled && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/50 mb-1">Suggested for current time</p>
                      <p className="text-sm font-medium text-white">
                        Raga {TIME_MUSIC_INFO[Object.keys(TIME_MUSIC_INFO).find(
                          key => TIME_MUSIC_INFO[key as keyof typeof TIME_MUSIC_INFO].raga === currentRaga
                        ) as keyof typeof TIME_MUSIC_INFO]?.name || currentRaga}
                      </p>
                    </div>
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
                          relative p-3 rounded-xl transition-all duration-300 text-left
                          ${isActive
                            ? `bg-gradient-to-r ${modeInfo.color} text-white shadow-lg`
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }
                        `}
                      >
                        <span className="text-xl mb-1.5 block">{modeInfo.icon}</span>
                        <p className="text-sm font-medium truncate">{modeInfo.name}</p>
                        <p className="text-xs opacity-60 truncate">{modeInfo.nameHindi}</p>

                        {isActive && (
                          <motion.div
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Volume Controls for Layers */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Layer Volumes</span>
              </div>

              <div className="space-y-2">
                {/* Ambient Volume */}
                {state.ambientEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-16">Ambient</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-purple-500"
                    />
                    <span className="text-xs text-white/40 w-8">{Math.round(state.ambientVolume * 100)}%</span>
                  </div>
                )}

                {/* Time Music Volume */}
                {state.timeAwareEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-16">Raga</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.ragaVolume}
                      onChange={(e) => useMusic().setRagaVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-amber-500 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-amber-500"
                    />
                    <span className="text-xs text-white/40 w-8">{Math.round(state.ragaVolume * 100)}%</span>
                  </div>
                )}

                {/* Spiritual Volume */}
                {state.spiritualEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-16">Spiritual</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.spiritualVolume}
                      onChange={(e) => useMusic().setSpiritualVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-orange-500 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-orange-500"
                    />
                    <span className="text-xs text-white/40 w-8">{Math.round(state.spiritualVolume * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default GlobalMusicPlayer
