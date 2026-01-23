'use client'

/**
 * Ambient Soundscape Control Component
 *
 * UI for immersive layered audio environments:
 * - Sound category selection
 * - Individual sound mixing
 * - Preset soundscapes
 * - Volume control for each layer
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music,
  Play,
  Pause,
  Volume2,
  CloudRain,
  Waves,
  Wind,
  Flame,
  TreePine,
  Bird,
  Bell,
  Sparkles,
  Moon,
  Mountain,
  Plus,
  X
} from 'lucide-react'

// ============ Types ============

export type SoundCategory = 'nature' | 'spiritual' | 'ambient' | 'music'

export type SoundType =
  | 'rain' | 'thunder' | 'ocean' | 'river' | 'wind' | 'birds' | 'crickets' | 'fire'
  | 'temple_bells' | 'singing_bowl' | 'om_chant' | 'tanpura' | 'flute'
  | 'white_noise' | 'pink_noise' | 'brown_noise'
  | 'soft_piano' | 'gentle_strings'

export interface ActiveSound {
  type: SoundType
  volume: number
}

export interface AmbientSoundscapeControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  onSoundsChange?: (sounds: ActiveSound[]) => void
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const SOUNDS: Record<SoundType, {
  name: string
  nameHindi: string
  category: SoundCategory
  icon: typeof Music
  color: string
}> = {
  // Nature
  rain: { name: 'Gentle Rain', nameHindi: 'बारिश', category: 'nature', icon: CloudRain, color: 'text-blue-400' },
  thunder: { name: 'Distant Thunder', nameHindi: 'गड़गड़ाहट', category: 'nature', icon: CloudRain, color: 'text-slate-400' },
  ocean: { name: 'Ocean Waves', nameHindi: 'समुद्र', category: 'nature', icon: Waves, color: 'text-cyan-400' },
  river: { name: 'Flowing River', nameHindi: 'नदी', category: 'nature', icon: Waves, color: 'text-teal-400' },
  wind: { name: 'Soft Wind', nameHindi: 'हवा', category: 'nature', icon: Wind, color: 'text-gray-400' },
  birds: { name: 'Forest Birds', nameHindi: 'पक्षी', category: 'nature', icon: Bird, color: 'text-green-400' },
  crickets: { name: 'Night Crickets', nameHindi: 'झींगुर', category: 'nature', icon: Moon, color: 'text-indigo-400' },
  fire: { name: 'Crackling Fire', nameHindi: 'अग्नि', category: 'nature', icon: Flame, color: 'text-orange-400' },

  // Spiritual
  temple_bells: { name: 'Temple Bells', nameHindi: 'मंदिर घंटी', category: 'spiritual', icon: Bell, color: 'text-amber-400' },
  singing_bowl: { name: 'Singing Bowl', nameHindi: 'गायन कटोरा', category: 'spiritual', icon: Bell, color: 'text-purple-400' },
  om_chant: { name: 'Om Chant', nameHindi: 'ॐ जाप', category: 'spiritual', icon: Sparkles, color: 'text-violet-400' },
  tanpura: { name: 'Tanpura Drone', nameHindi: 'तानपुरा', category: 'spiritual', icon: Music, color: 'text-rose-400' },
  flute: { name: 'Bansuri Flute', nameHindi: 'बांसुरी', category: 'spiritual', icon: Music, color: 'text-pink-400' },

  // Ambient
  white_noise: { name: 'White Noise', nameHindi: 'सफ़ेद शोर', category: 'ambient', icon: Waves, color: 'text-gray-300' },
  pink_noise: { name: 'Pink Noise', nameHindi: 'गुलाबी शोर', category: 'ambient', icon: Waves, color: 'text-pink-300' },
  brown_noise: { name: 'Brown Noise', nameHindi: 'भूरा शोर', category: 'ambient', icon: Waves, color: 'text-amber-600' },

  // Music
  soft_piano: { name: 'Soft Piano', nameHindi: 'मृदु पियानो', category: 'music', icon: Music, color: 'text-white' },
  gentle_strings: { name: 'Gentle Strings', nameHindi: 'कोमल तार', category: 'music', icon: Music, color: 'text-yellow-200' }
}

const PRESETS: {
  name: string
  nameHindi: string
  description: string
  icon: typeof Music
  sounds: { type: SoundType; volume: number }[]
}[] = [
  {
    name: 'Rainforest',
    nameHindi: 'वर्षावन',
    description: 'Rain, birds, and gentle wind',
    icon: TreePine,
    sounds: [
      { type: 'rain', volume: 0.6 },
      { type: 'birds', volume: 0.3 },
      { type: 'wind', volume: 0.2 }
    ]
  },
  {
    name: 'Temple Morning',
    nameHindi: 'मंदिर सुबह',
    description: 'Bells, flute, and birds',
    icon: Bell,
    sounds: [
      { type: 'temple_bells', volume: 0.4 },
      { type: 'flute', volume: 0.5 },
      { type: 'birds', volume: 0.2 }
    ]
  },
  {
    name: 'Ocean Night',
    nameHindi: 'समुद्र रात्रि',
    description: 'Waves and crickets under stars',
    icon: Moon,
    sounds: [
      { type: 'ocean', volume: 0.7 },
      { type: 'crickets', volume: 0.3 }
    ]
  },
  {
    name: 'Deep Meditation',
    nameHindi: 'गहरा ध्यान',
    description: 'Om chant with singing bowl',
    icon: Sparkles,
    sounds: [
      { type: 'om_chant', volume: 0.4 },
      { type: 'singing_bowl', volume: 0.5 },
      { type: 'tanpura', volume: 0.3 }
    ]
  },
  {
    name: 'Cozy Fireplace',
    nameHindi: 'आरामदायक चूल्हा',
    description: 'Fire crackle with soft rain',
    icon: Flame,
    sounds: [
      { type: 'fire', volume: 0.6 },
      { type: 'rain', volume: 0.3 }
    ]
  },
  {
    name: 'Mountain Stream',
    nameHindi: 'पर्वत धारा',
    description: 'River, wind, and distant birds',
    icon: Mountain,
    sounds: [
      { type: 'river', volume: 0.6 },
      { type: 'wind', volume: 0.3 },
      { type: 'birds', volume: 0.2 }
    ]
  }
]

// ============ Sound Mixer Item ============

function SoundMixerItem({
  sound,
  isActive,
  volume,
  onToggle,
  onVolumeChange
}: {
  sound: SoundType
  isActive: boolean
  volume: number
  onToggle: () => void
  onVolumeChange: (volume: number) => void
}) {
  const config = SOUNDS[sound]
  const Icon = config.icon

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isActive
        ? 'border-orange-500/30 bg-orange-500/10'
        : 'border-white/10 bg-white/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? config.color : 'text-white/40'}`} />
          <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
            {config.name}
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-orange-500/30 text-orange-300'
              : 'bg-white/10 text-white/30 hover:bg-white/15'
          }`}
        >
          {isActive ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {isActive && (
        <div className="flex items-center gap-2">
          <Volume2 className="w-3 h-3 text-white/30" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
          />
          <span className="text-[10px] text-white/40 w-7">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  )
}

// ============ Component ============

export function AmbientSoundscapeControl({
  isActive = false,
  onToggle,
  onSoundsChange,
  compact = false,
  className = ''
}: AmbientSoundscapeControlProps) {
  const [playing, setPlaying] = useState(isActive)
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([])
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('nature')
  const [masterVolume, setMasterVolume] = useState(0.7)

  const handleToggle = useCallback(() => {
    const newState = !playing
    setPlaying(newState)
    onToggle?.(newState)
  }, [playing, onToggle])

  const handleSoundToggle = useCallback((soundType: SoundType) => {
    setActiveSounds(prev => {
      const existing = prev.find(s => s.type === soundType)
      let newSounds: ActiveSound[]

      if (existing) {
        newSounds = prev.filter(s => s.type !== soundType)
      } else {
        newSounds = [...prev, { type: soundType, volume: 0.5 }]
      }

      onSoundsChange?.(newSounds)
      return newSounds
    })
  }, [onSoundsChange])

  const handleSoundVolumeChange = useCallback((soundType: SoundType, volume: number) => {
    setActiveSounds(prev => {
      const newSounds = prev.map(s =>
        s.type === soundType ? { ...s, volume } : s
      )
      onSoundsChange?.(newSounds)
      return newSounds
    })
  }, [onSoundsChange])

  const applyPreset = useCallback((presetIndex: number) => {
    const preset = PRESETS[presetIndex]
    setActiveSounds(preset.sounds)
    onSoundsChange?.(preset.sounds)
    if (!playing) {
      setPlaying(true)
      onToggle?.(true)
    }
  }, [playing, onToggle, onSoundsChange])

  const categorySounds = Object.entries(SOUNDS)
    .filter(([, config]) => config.category === selectedCategory)
    .map(([type]) => type as SoundType)

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-orange-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <Music className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Soundscapes</p>
              <p className="text-[10px] text-white/50">{activeSounds.length} sounds active</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              playing
                ? 'bg-orange-500/30 text-orange-300'
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
      className={`rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <Music className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Ambient Soundscapes</h3>
              <p className="text-xs text-white/50">Layered Audio Environments</p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`p-2.5 rounded-xl transition-all ${
              playing
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-4 border-b border-white/5">
        <p className="text-xs font-medium text-white/50 mb-3">Quick Presets</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon
            return (
              <button
                key={idx}
                onClick={() => applyPreset(idx)}
                className="flex-shrink-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                <p className="text-xs text-white whitespace-nowrap">{preset.name}</p>
                <p className="text-[10px] text-white/40">{preset.nameHindi}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {(['nature', 'spiritual', 'ambient', 'music'] as SoundCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-500/30 text-orange-300'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sound Mixer */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {categorySounds.map((soundType) => (
            <SoundMixerItem
              key={soundType}
              sound={soundType}
              isActive={activeSounds.some(s => s.type === soundType)}
              volume={activeSounds.find(s => s.type === soundType)?.volume || 0.5}
              onToggle={() => handleSoundToggle(soundType)}
              onVolumeChange={(vol) => handleSoundVolumeChange(soundType, vol)}
            />
          ))}
        </div>
      </div>

      {/* Active Sounds Summary & Master Volume */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50">
            Active: <span className="text-orange-400">{activeSounds.length}</span> sounds
          </span>
          <span className="text-xs text-white/50">
            Master: <span className="text-white/70">{Math.round(masterVolume * 100)}%</span>
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
        />
      </div>
    </motion.div>
  )
}

export default AmbientSoundscapeControl
