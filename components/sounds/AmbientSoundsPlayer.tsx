'use client'

/**
 * Ambient Sounds Player Component
 *
 * The main premium ambient sounds experience:
 * - Beautiful visualizer with multiple modes
 * - Curated sound scenes
 * - Professional sound mixer
 * - Timer functionality
 * - Activity integration (sleep, focus, meditation)
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Shuffle,
  Heart,
  Share2,
  Settings2,
  Waves,
  Sparkles,
  Moon,
  Sun,
  Brain,
  Headphones,
  LayoutGrid,
  List,
  type LucideIcon
} from 'lucide-react'
import { useAudio, type AmbientSoundscape } from '@/contexts/AudioContext'
import { SoundVisualizer, type VisualizerMode } from './SoundVisualizer'
import { SoundSceneCard, SOUND_SCENES, type SoundScene } from './SoundSceneCard'
import { SoundMixer, type MixerChannel } from './SoundMixer'
import { SoundTimer } from './SoundTimer'

export interface AmbientSoundsPlayerProps {
  className?: string
  defaultScene?: string
  showMixer?: boolean
  showTimer?: boolean
  compact?: boolean
}

type ViewMode = 'grid' | 'list'
type ActivityMode = 'relax' | 'sleep' | 'focus' | 'meditate' | null

const ACTIVITY_MODES: { id: ActivityMode; name: string; icon: LucideIcon; color: string }[] = [
  { id: 'relax', name: 'Relax', icon: Sun, color: 'from-amber-500 to-orange-500' },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: 'from-indigo-500 to-purple-500' },
  { id: 'focus', name: 'Focus', icon: Brain, color: 'from-blue-500 to-cyan-500' },
  { id: 'meditate', name: 'Meditate', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
]

const VISUALIZER_MODES: { id: VisualizerMode; name: string }[] = [
  { id: 'orb', name: 'Orb' },
  { id: 'waves', name: 'Waves' },
  { id: 'bars', name: 'Bars' },
  { id: 'particles', name: 'Particles' },
]

// Map scene theme to visualizer color
function getVisualizerColor(theme: SoundScene['theme']): 'sunrise' | 'ocean' | 'aurora' | 'nature' | 'spiritual' {
  const mapping = {
    nature: 'nature' as const,
    spiritual: 'spiritual' as const,
    focus: 'ocean' as const,
    sleep: 'aurora' as const,
    healing: 'sunrise' as const,
  }
  return mapping[theme]
}

// Map scene ID to audio manager soundscape
function getAmbientSoundscape(sceneId: string): AmbientSoundscape {
  const mapping: Record<string, AmbientSoundscape> = {
    'morning-peace': 'nature',
    'temple-dawn': 'temple',
    'deep-focus': 'wind',      // Focus uses wind sounds for concentration
    'rainforest': 'rain',
    'ocean-waves': 'ocean',
    'mountain-stream': 'river',
    'deep-sleep': 'night',
    'cozy-fireplace': 'fire',
    'meditation-temple': 'tibetan',
    'forest-night': 'forest',
    'energy-boost': 'birds',   // Energy boost uses bird sounds
    'heart-healing': 'tibetan', // Healing uses tibetan sounds
  }
  return mapping[sceneId] || 'nature'
}

export function AmbientSoundsPlayer({
  className = '',
  defaultScene,
  showMixer = true,
  showTimer = true,
  compact = false
}: AmbientSoundsPlayerProps) {
  // Audio context
  const {
    startAmbient,
    stopAmbient,
    setAmbientVolume,
    state: audioState,
    playSound
  } = useAudio()

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentScene, setCurrentScene] = useState<SoundScene | null>(
    defaultScene ? SOUND_SCENES.find(s => s.id === defaultScene) || null : null
  )
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activityMode, setActivityMode] = useState<ActivityMode>(null)
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orb')
  const [showSettings, setShowSettings] = useState(false)

  // Mixer state
  const [mixerChannels, setMixerChannels] = useState<MixerChannel[]>([])

  // Sync with audio state
  useEffect(() => {
    setIsPlaying(audioState.ambientEnabled)
  }, [audioState.ambientEnabled])

  // Handle scene selection
  const handleSceneSelect = useCallback(async (scene: SoundScene) => {
    playSound('click')
    setCurrentScene(scene)

    // Initialize mixer channels from scene sounds
    const channels: MixerChannel[] = scene.sounds.map((soundId) => ({
      soundId,
      volume: 0.5,
      muted: false,
      solo: false
    }))
    setMixerChannels(channels)

    // Start playing
    const soundscape = getAmbientSoundscape(scene.id)
    await startAmbient(soundscape)
    setIsPlaying(true)
  }, [startAmbient, playSound])

  // Handle play/pause
  const handleTogglePlay = useCallback(async () => {
    playSound('click')

    if (isPlaying) {
      stopAmbient()
      setIsPlaying(false)
    } else if (currentScene) {
      const soundscape = getAmbientSoundscape(currentScene.id)
      await startAmbient(soundscape)
      setIsPlaying(true)
    }
  }, [isPlaying, currentScene, startAmbient, stopAmbient, playSound])

  // Handle next/previous scene
  const handleNextScene = useCallback(() => {
    if (!currentScene) return
    const currentIndex = SOUND_SCENES.findIndex(s => s.id === currentScene.id)
    const nextScene = SOUND_SCENES[(currentIndex + 1) % SOUND_SCENES.length]
    handleSceneSelect(nextScene)
  }, [currentScene, handleSceneSelect])

  const handlePrevScene = useCallback(() => {
    if (!currentScene) return
    const currentIndex = SOUND_SCENES.findIndex(s => s.id === currentScene.id)
    const prevScene = SOUND_SCENES[(currentIndex - 1 + SOUND_SCENES.length) % SOUND_SCENES.length]
    handleSceneSelect(prevScene)
  }, [currentScene, handleSceneSelect])

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setAmbientVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }, [setAmbientVolume, isMuted])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setAmbientVolume(volume)
      setIsMuted(false)
    } else {
      setAmbientVolume(0)
      setIsMuted(true)
    }
    playSound('toggle')
  }, [isMuted, volume, setAmbientVolume, playSound])

  // Handle activity mode selection
  const handleActivityMode = useCallback((mode: ActivityMode) => {
    setActivityMode(mode === activityMode ? null : mode)
    playSound('toggle')

    // Filter scenes by activity
    if (mode === 'sleep') {
      const sleepScene = SOUND_SCENES.find(s => s.theme === 'sleep')
      if (sleepScene) handleSceneSelect(sleepScene)
    } else if (mode === 'focus') {
      const focusScene = SOUND_SCENES.find(s => s.theme === 'focus')
      if (focusScene) handleSceneSelect(focusScene)
    } else if (mode === 'meditate') {
      const meditateScene = SOUND_SCENES.find(s => s.theme === 'spiritual')
      if (meditateScene) handleSceneSelect(meditateScene)
    }
  }, [activityMode, handleSceneSelect, playSound])

  // Handle mixer changes
  const handleAddSound = useCallback((soundId: string) => {
    setMixerChannels(prev => [
      ...prev,
      { soundId, volume: 0.5, muted: false, solo: false }
    ])
    playSound('toggle')
  }, [playSound])

  const handleRemoveSound = useCallback((soundId: string) => {
    setMixerChannels(prev => prev.filter(c => c.soundId !== soundId))
    playSound('click')
  }, [playSound])

  // Handle timer end
  const handleTimerEnd = useCallback(() => {
    stopAmbient()
    setIsPlaying(false)
    playSound('meditation_end')
  }, [stopAmbient, playSound])

  // Get filtered scenes based on activity mode
  const filteredScenes = activityMode
    ? SOUND_SCENES.filter(s => {
        switch (activityMode) {
          case 'sleep': return s.theme === 'sleep'
          case 'focus': return s.theme === 'focus'
          case 'meditate': return s.theme === 'spiritual'
          case 'relax': return s.theme === 'nature' || s.theme === 'healing'
          default: return true
        }
      })
    : SOUND_SCENES

  return (
    <div className={`relative ${className}`}>
      {/* Main Player Card */}
      <motion.div
        layout
        className={`
          rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d0d10]/95 to-[#0a0a0d]/95
          backdrop-blur-xl overflow-hidden
          ${isExpanded ? 'fixed inset-4 z-50' : ''}
        `}
      >
        {/* Visualizer Section */}
        <div className={`relative ${isExpanded ? 'h-[40vh]' : 'h-64'}`}>
          <SoundVisualizer
            isPlaying={isPlaying}
            intensity={volume}
            mode={visualizerMode}
            color={currentScene ? getVisualizerColor(currentScene.theme) : 'sunrise'}
            size="full"
            className="absolute inset-0"
          />

          {/* Overlay controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-transparent" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            {/* Visualizer mode selector */}
            <div className="flex gap-1 p-1 rounded-lg bg-black/30 backdrop-blur-sm">
              {VISUALIZER_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setVisualizerMode(mode.id)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${visualizerMode === mode.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                    }
                  `}
                >
                  {mode.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current scene info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <AnimatePresence mode="wait">
              {currentScene && (
                <motion.div
                  key={currentScene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-end justify-between"
                >
                  <div>
                    <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">
                      Now Playing
                    </p>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {currentScene.name}
                    </h2>
                    <p className="text-sm text-white/60">{currentScene.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`
                        p-2.5 rounded-full transition-all
                        ${isFavorite
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-white/10 text-white/50 hover:text-white/70'
                        }
                      `}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2.5 rounded-full bg-white/10 text-white/50 hover:text-white/70 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {!currentScene && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <Headphones className="w-12 h-12 mx-auto mb-3 text-white/30" />
                  <p className="text-white/50">Select a sound scene to begin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-4 border-t border-white/5">
          {/* Transport controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => { }}
              className="p-2 rounded-full text-white/50 hover:text-white/70 transition-colors"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrevScene}
              disabled={!currentScene}
              className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handleTogglePlay}
              disabled={!currentScene}
              className={`
                p-5 rounded-full transition-all
                ${isPlaying
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }
                disabled:opacity-30
              `}
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
            </button>
            <button
              onClick={handleNextScene}
              disabled={!currentScene}
              className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full text-white/50 hover:text-white/70 transition-colors">
              <Waves className="w-5 h-5" />
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg text-white/50 hover:text-white/70 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
            />
            <span className="text-xs text-white/50 w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Activity mode selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {ACTIVITY_MODES.map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.id}
                  onClick={() => handleActivityMode(mode.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                    ${activityMode === mode.id
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-lg`
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{mode.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Scene Selection */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Sound Scenes</h3>
            <div className="flex gap-1 p-1 rounded-lg bg-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`
                  p-1.5 rounded-md transition-colors
                  ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}
                `}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`
                  p-1.5 rounded-md transition-colors
                  ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}
                `}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`
            ${viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
              : 'space-y-2'
            }
            max-h-[300px] overflow-y-auto pr-2
          `}>
            {filteredScenes.map((scene) => (
              <SoundSceneCard
                key={scene.id}
                scene={scene}
                isActive={currentScene?.id === scene.id}
                isPlaying={isPlaying && currentScene?.id === scene.id}
                onSelect={() => handleSceneSelect(scene)}
                variant={viewMode === 'grid' ? 'default' : 'compact'}
              />
            ))}
          </div>
        </div>

        {/* Mixer Section */}
        {showMixer && (
          <div className="p-4 border-t border-white/5">
            <SoundMixer
              channels={mixerChannels}
              onChannelChange={setMixerChannels}
              onAddSound={handleAddSound}
              onRemoveSound={handleRemoveSound}
              masterVolume={volume}
              onMasterVolumeChange={handleVolumeChange}
            />
          </div>
        )}

        {/* Timer Section */}
        {showTimer && (
          <div className="p-4 border-t border-white/5">
            <SoundTimer onTimerEnd={handleTimerEnd} />
          </div>
        )}
      </motion.div>

      {/* Expanded backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AmbientSoundsPlayer
