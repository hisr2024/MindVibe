'use client'

/**
 * Binaural Beats Control Component
 *
 * UI for brainwave entrainment with binaural beats:
 * - Preset selection (focus, meditation, deep sleep, creativity)
 * - Frequency visualization
 * - Volume control
 * - Layer-specific configurations
 *
 * NOW CONNECTED TO ACTUAL AUDIO ENGINE!
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Zap,
  Heart,
  Eye
} from 'lucide-react'
import type { ConsciousnessLayer } from '@/services/voice/elite/QuantumDiveEngine'
import { useAudio, type BrainwavePreset as AudioBrainwavePreset } from '@/contexts/AudioContext'

// ============ Types ============

export type BrainwavePreset = 'focus' | 'meditation' | 'deep_sleep' | 'creativity' | 'healing' | 'custom'

export interface BinauraBeatsControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  currentLayer?: ConsciousnessLayer
  onPresetChange?: (preset: BrainwavePreset) => void
  onVolumeChange?: (volume: number) => void
  compact?: boolean
  className?: string
}

// ============ Preset Configurations ============

const PRESETS: Record<BrainwavePreset, {
  name: string
  nameHindi: string
  description: string
  frequency: number
  baseFrequency: number
  icon: typeof Brain
  color: string
  gradient: string
}> = {
  focus: {
    name: 'Focus',
    nameHindi: 'एकाग्रता',
    description: 'Beta waves (14-30 Hz) for concentration',
    frequency: 18,
    baseFrequency: 200,
    icon: Zap,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-500/20'
  },
  meditation: {
    name: 'Meditation',
    nameHindi: 'ध्यान',
    description: 'Alpha waves (8-13 Hz) for relaxed awareness',
    frequency: 10,
    baseFrequency: 200,
    icon: Eye,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-indigo-500/20'
  },
  deep_sleep: {
    name: 'Deep Sleep',
    nameHindi: 'गहरी नींद',
    description: 'Delta waves (0.5-4 Hz) for restorative rest',
    frequency: 2,
    baseFrequency: 100,
    icon: Moon,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-slate-500/20'
  },
  creativity: {
    name: 'Creativity',
    nameHindi: 'सृजनात्मकता',
    description: 'Theta waves (4-8 Hz) for inspiration',
    frequency: 6,
    baseFrequency: 150,
    icon: Sparkles,
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-rose-500/20'
  },
  healing: {
    name: 'Healing',
    nameHindi: 'उपचार',
    description: 'Solfeggio 528 Hz for cellular repair',
    frequency: 8,
    baseFrequency: 528,
    icon: Heart,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  custom: {
    name: 'Custom',
    nameHindi: 'कस्टम',
    description: 'Adjust frequencies manually',
    frequency: 10,
    baseFrequency: 200,
    icon: Brain,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/20'
  }
}

// Layer-to-preset mapping
const LAYER_PRESETS: Record<ConsciousnessLayer, BrainwavePreset> = {
  annamaya: 'healing',
  pranamaya: 'focus',
  manomaya: 'meditation',
  vijnanamaya: 'creativity',
  anandamaya: 'deep_sleep'
}

// ============ Component ============

// Map local preset names to audio manager preset names
const PRESET_TO_AUDIO: Record<BrainwavePreset, AudioBrainwavePreset> = {
  focus: 'focus',
  meditation: 'meditation',
  deep_sleep: 'deep_sleep',
  creativity: 'creativity',
  healing: 'healing',
  custom: 'meditation'  // Default for custom
}

export function BinauraBeatsControl({
  isActive = false,
  onToggle,
  currentLayer,
  onPresetChange,
  onVolumeChange,
  compact = false,
  className = ''
}: BinauraBeatsControlProps) {
  // Connect to audio context
  const { startBinaural, stopBinaural, setBinauralVolume, state: audioState, playSound } = useAudio()

  const [playing, setPlaying] = useState(isActive)
  const [selectedPreset, setSelectedPreset] = useState<BrainwavePreset>(
    currentLayer ? LAYER_PRESETS[currentLayer] : 'meditation'
  )
  const [volume, setVolume] = useState(0.3)
  const [muted, setMuted] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrequency, setCustomFrequency] = useState(10)

  // Update preset when layer changes
  useEffect(() => {
    if (currentLayer && LAYER_PRESETS[currentLayer]) {
      const newPreset = LAYER_PRESETS[currentLayer]
      setSelectedPreset(newPreset)
      // Auto-update binaural if playing
      if (playing) {
        startBinaural(PRESET_TO_AUDIO[newPreset])
      }
    }
  }, [currentLayer, playing, startBinaural])

  // Sync with external isActive prop
  useEffect(() => {
    setPlaying(isActive)
  }, [isActive])

  // Sync with audio state
  useEffect(() => {
    setPlaying(audioState.binauralEnabled)
  }, [audioState.binauralEnabled])

  const handleToggle = useCallback(async () => {
    const newState = !playing
    setPlaying(newState)

    // ACTUALLY PLAY/STOP BINAURAL BEATS
    if (newState) {
      playSound('click')
      await startBinaural(PRESET_TO_AUDIO[selectedPreset])
    } else {
      playSound('click')
      stopBinaural()
    }

    onToggle?.(newState)
  }, [playing, selectedPreset, startBinaural, stopBinaural, playSound, onToggle])

  const handlePresetSelect = useCallback(async (preset: BrainwavePreset) => {
    setSelectedPreset(preset)
    setShowCustom(preset === 'custom')
    playSound('select')

    // If playing, switch to new preset immediately
    if (playing) {
      await startBinaural(PRESET_TO_AUDIO[preset])
    }

    onPresetChange?.(preset)
  }, [playing, startBinaural, playSound, onPresetChange])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setMuted(newVolume === 0)

    // ACTUALLY CHANGE BINAURAL VOLUME
    setBinauralVolume(newVolume)

    onVolumeChange?.(newVolume)
  }, [setBinauralVolume, onVolumeChange])

  const currentPreset = PRESETS[selectedPreset]
  const displayFrequency = selectedPreset === 'custom' ? customFrequency : currentPreset.frequency
  const PresetIcon = currentPreset.icon

  // Compact view for mobile/sidebar
  if (compact) {
    return (
      <div className={`rounded-xl border border-purple-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${currentPreset.gradient}`}>
              <Brain className={`w-4 h-4 ${currentPreset.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Binaural Beats</p>
              <p className="text-[10px] text-white/50">{currentPreset.name}</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              playing
                ? 'bg-purple-500/30 text-purple-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentPreset.gradient}`}>
              <Brain className={`w-5 h-5 ${currentPreset.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Binaural Beats</h3>
              <p className="text-xs text-white/50">Brainwave Entrainment</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume */}
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-white/50" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/70" />
              )}
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleToggle}
              className={`p-2.5 rounded-xl transition-all ${
                playing
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Frequency Visualization */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-gradient-to-r from-purple-500/5 to-transparent border-b border-white/5"
          >
            <div className="flex items-center justify-center gap-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [8, 24 + Math.sin(i * 0.5) * 12, 8],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2 / displayFrequency,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: 'easeInOut'
                  }}
                  className={`w-1 rounded-full ${currentPreset.color.replace('text-', 'bg-')}`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-white/40 mt-2">
              {displayFrequency} Hz binaural • {currentPreset.baseFrequency} Hz carrier
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset Selection */}
      <div className="p-4">
        <p className="text-xs font-medium text-white/50 mb-3">Select Brainwave State</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PRESETS) as BrainwavePreset[]).filter(p => p !== 'custom').map((preset) => {
            const config = PRESETS[preset]
            const Icon = config.icon
            const isSelected = selectedPreset === preset

            return (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? `border-${config.color.replace('text-', '')}/50 bg-gradient-to-br ${config.gradient}`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? config.color : 'text-white/40'}`} />
                <p className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {config.name}
                </p>
                <p className="text-[10px] text-white/40">{config.nameHindi}</p>
              </button>
            )
          })}
        </div>

        {/* Current Preset Info */}
        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <PresetIcon className={`w-4 h-4 ${currentPreset.color}`} />
            <span className="text-sm font-medium text-white">{currentPreset.name}</span>
            <span className="text-xs text-white/40">• {currentPreset.nameHindi}</span>
          </div>
          <p className="text-xs text-white/50">{currentPreset.description}</p>
        </div>

        {/* Volume Slider */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">Volume</span>
            <span className="text-xs text-white/70">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500"
          />
        </div>

        {/* Custom Frequency (hidden by default) */}
        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">Custom Frequency</span>
                <span className="text-xs text-white/70">{customFrequency} Hz</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="0.5"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>1 Hz (Delta)</span>
                <span>40 Hz (Gamma)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default BinauraBeatsControl
