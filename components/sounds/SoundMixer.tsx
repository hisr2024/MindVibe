'use client'

/**
 * Professional Sound Mixer Component
 *
 * Advanced mixing interface for layered ambient sounds:
 * - Individual sound channels with volume controls
 * - Mute/solo functionality
 * - Visual feedback for active sounds
 * - Category filtering
 * - Preset save/load
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Plus,
  Minus,
  CloudRain,
  Waves,
  Wind,
  Flame,
  Bird,
  Moon,
  Bell,
  Music,
  Sparkles,
  TreePine,
  Headphones,
  Save,
  RotateCcw,
  type LucideIcon
} from 'lucide-react'

// Sound definitions with metadata
export interface SoundDefinition {
  id: string
  name: string
  nameHindi: string
  category: 'nature' | 'spiritual' | 'ambient' | 'music'
  icon: LucideIcon
  color: string
  description?: string
}

export interface MixerChannel {
  soundId: string
  volume: number
  muted: boolean
  solo: boolean
}

export interface SoundMixerProps {
  channels: MixerChannel[]
  onChannelChange: (channels: MixerChannel[]) => void
  onAddSound: (soundId: string) => void
  onRemoveSound: (soundId: string) => void
  masterVolume: number
  onMasterVolumeChange: (volume: number) => void
  className?: string
}

const SOUND_LIBRARY: SoundDefinition[] = [
  // Nature
  { id: 'rain', name: 'Gentle Rain', nameHindi: 'बारिश', category: 'nature', icon: CloudRain, color: 'text-blue-400' },
  { id: 'thunder', name: 'Thunder', nameHindi: 'गड़गड़ाहट', category: 'nature', icon: CloudRain, color: 'text-slate-400' },
  { id: 'ocean', name: 'Ocean Waves', nameHindi: 'समुद्र', category: 'nature', icon: Waves, color: 'text-cyan-400' },
  { id: 'river', name: 'River Stream', nameHindi: 'नदी', category: 'nature', icon: Waves, color: 'text-teal-400' },
  { id: 'wind', name: 'Soft Wind', nameHindi: 'हवा', category: 'nature', icon: Wind, color: 'text-gray-400' },
  { id: 'birds', name: 'Forest Birds', nameHindi: 'पक्षी', category: 'nature', icon: Bird, color: 'text-green-400' },
  { id: 'crickets', name: 'Night Crickets', nameHindi: 'झींगुर', category: 'nature', icon: Moon, color: 'text-indigo-400' },
  { id: 'fire', name: 'Crackling Fire', nameHindi: 'अग्नि', category: 'nature', icon: Flame, color: 'text-orange-400' },
  { id: 'forest', name: 'Forest Ambiance', nameHindi: 'वन', category: 'nature', icon: TreePine, color: 'text-emerald-400' },

  // Spiritual
  { id: 'temple_bells', name: 'Temple Bells', nameHindi: 'मंदिर घंटी', category: 'spiritual', icon: Bell, color: 'text-amber-400' },
  { id: 'singing_bowl', name: 'Singing Bowl', nameHindi: 'गायन कटोरा', category: 'spiritual', icon: Bell, color: 'text-purple-400' },
  { id: 'om_chant', name: 'Om Chant', nameHindi: 'ॐ जाप', category: 'spiritual', icon: Sparkles, color: 'text-violet-400' },
  { id: 'tanpura', name: 'Tanpura Drone', nameHindi: 'तानपुरा', category: 'spiritual', icon: Music, color: 'text-rose-400' },
  { id: 'flute', name: 'Bansuri Flute', nameHindi: 'बांसुरी', category: 'spiritual', icon: Music, color: 'text-pink-400' },

  // Ambient
  { id: 'white_noise', name: 'White Noise', nameHindi: 'सफ़ेद शोर', category: 'ambient', icon: Waves, color: 'text-gray-300' },
  { id: 'pink_noise', name: 'Pink Noise', nameHindi: 'गुलाबी शोर', category: 'ambient', icon: Waves, color: 'text-pink-300' },
  { id: 'brown_noise', name: 'Brown Noise', nameHindi: 'भूरा शोर', category: 'ambient', icon: Waves, color: 'text-amber-600' },

  // Music
  { id: 'soft_piano', name: 'Soft Piano', nameHindi: 'मृदु पियानो', category: 'music', icon: Music, color: 'text-white' },
  { id: 'gentle_strings', name: 'Strings', nameHindi: 'कोमल तार', category: 'music', icon: Music, color: 'text-yellow-200' },
]

// Circular volume control component
function VolumeKnob({
  value,
  onChange,
  size = 48,
  color = '#ff9159'
}: {
  value: number
  onChange: (value: number) => void
  size?: number
  color?: string
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const angle = Math.atan2(clientY - centerY, clientX - centerX)
    let normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
    normalizedAngle = Math.max(0, Math.min(1, normalizedAngle))
    onChange(normalizedAngle)
  }, [isDragging, onChange])

  const rotation = value * 270 - 135

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleMove}
    >
      {/* Background track */}
      <svg width={size} height={size} className="absolute">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${value * (Math.PI * (size - 8))} ${Math.PI * (size - 8)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>

      {/* Knob indicator */}
      <div
        className="absolute w-2 h-2 bg-white rounded-full shadow-lg"
        style={{
          top: size / 2 - 4 + Math.sin((rotation - 90) * Math.PI / 180) * (size / 2 - 8),
          left: size / 2 - 4 + Math.cos((rotation - 90) * Math.PI / 180) * (size / 2 - 8),
        }}
      />

      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-medium text-white/70">
          {Math.round(value * 100)}
        </span>
      </div>
    </div>
  )
}

// Individual mixer channel
function MixerChannel({
  channel,
  sound,
  onChange,
  onRemove,
  isAnySolo
}: {
  channel: MixerChannel
  sound: SoundDefinition
  onChange: (updates: Partial<MixerChannel>) => void
  onRemove: () => void
  isAnySolo: boolean
}) {
  const Icon = sound.icon
  const isMutedBySolo = isAnySolo && !channel.solo

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        relative p-4 rounded-xl border transition-all
        ${channel.solo
          ? 'border-orange-500/40 bg-orange-500/10'
          : channel.muted || isMutedBySolo
            ? 'border-white/5 bg-white/[0.02] opacity-50'
            : 'border-white/10 bg-white/5'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Sound icon */}
        <div className={`
          p-2 rounded-lg transition-colors
          ${channel.muted || isMutedBySolo ? 'bg-white/5' : 'bg-white/10'}
        `}>
          <Icon className={`w-5 h-5 ${sound.color}`} />
        </div>

        {/* Sound info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{sound.name}</p>
          <p className="text-[10px] text-white/40">{sound.nameHindi}</p>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={channel.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            disabled={channel.muted || isMutedBySolo}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500 disabled:opacity-30"
          />
          <span className="text-xs text-white/50 w-8 text-right">
            {Math.round(channel.volume * 100)}%
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Mute button */}
          <button
            onClick={() => onChange({ muted: !channel.muted })}
            className={`
              p-2 rounded-lg transition-colors
              ${channel.muted
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }
            `}
            title={channel.muted ? 'Unmute' : 'Mute'}
          >
            {channel.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Solo button */}
          <button
            onClick={() => onChange({ solo: !channel.solo })}
            className={`
              px-2 py-1 rounded-lg text-xs font-medium transition-colors
              ${channel.solo
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }
            `}
            title={channel.solo ? 'Unsolo' : 'Solo'}
          >
            S
          </button>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="Remove"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Sound picker for adding new sounds
function SoundPicker({
  availableSounds,
  onAdd,
  onClose
}: {
  availableSounds: SoundDefinition[]
  onAdd: (soundId: string) => void
  onClose: () => void
}) {
  const [category, setCategory] = useState<string>('all')

  const categories = ['all', 'nature', 'spiritual', 'ambient', 'music']
  const filteredSounds = category === 'all'
    ? availableSounds
    : availableSounds.filter(s => s.category === category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-0 bottom-full mb-2 p-4 rounded-2xl border border-white/10 bg-[#0d0d10]/95 backdrop-blur-xl z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-white">Add Sound</h4>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/50"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`
              flex-1 py-1.5 px-2 rounded-md text-xs font-medium capitalize transition-colors
              ${category === cat
                ? 'bg-orange-500/30 text-orange-300'
                : 'text-white/50 hover:text-white/70'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sound grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
        {filteredSounds.map((sound) => {
          const Icon = sound.icon
          return (
            <button
              key={sound.id}
              onClick={() => {
                onAdd(sound.id)
                onClose()
              }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors"
            >
              <Icon className={`w-5 h-5 ${sound.color}`} />
              <span className="text-[10px] text-white/70 text-center line-clamp-1">
                {sound.name}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

export function SoundMixer({
  channels,
  onChannelChange,
  onAddSound,
  onRemoveSound,
  masterVolume,
  onMasterVolumeChange,
  className = ''
}: SoundMixerProps) {
  const [showPicker, setShowPicker] = useState(false)

  const activeSoundIds = channels.map(c => c.soundId)
  const availableSounds = SOUND_LIBRARY.filter(s => !activeSoundIds.includes(s.id))
  const isAnySolo = channels.some(c => c.solo)

  const handleChannelUpdate = useCallback((index: number, updates: Partial<MixerChannel>) => {
    const newChannels = [...channels]
    newChannels[index] = { ...newChannels[index], ...updates }
    onChannelChange(newChannels)
  }, [channels, onChannelChange])

  const handleReset = useCallback(() => {
    const resetChannels = channels.map(c => ({
      ...c,
      volume: 0.5,
      muted: false,
      solo: false
    }))
    onChannelChange(resetChannels)
    onMasterVolumeChange(0.7)
  }, [channels, onChannelChange, onMasterVolumeChange])

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white">Sound Mixer</h3>
          <span className="text-xs text-white/40">
            {channels.length} layer{channels.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
            title="Reset all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save preset button */}
          <button
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
            title="Save preset"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Master volume */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-medium text-white">Master</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
        />
        <span className="text-sm text-orange-400 font-medium w-12 text-right">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* Channels */}
      <div className="space-y-2 mb-4">
        <AnimatePresence mode="popLayout">
          {channels.map((channel, index) => {
            const sound = SOUND_LIBRARY.find(s => s.id === channel.soundId)
            if (!sound) return null

            return (
              <MixerChannel
                key={channel.soundId}
                channel={channel}
                sound={sound}
                onChange={(updates) => handleChannelUpdate(index, updates)}
                onRemove={() => onRemoveSound(channel.soundId)}
                isAnySolo={isAnySolo}
              />
            )
          })}
        </AnimatePresence>

        {channels.length === 0 && (
          <div className="py-8 text-center text-white/40">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sounds added yet</p>
            <p className="text-xs">Click the button below to add sounds</p>
          </div>
        )}
      </div>

      {/* Add sound button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={availableSounds.length === 0}
          className={`
            w-full flex items-center justify-center gap-2 py-3 rounded-xl
            border border-dashed transition-all
            ${showPicker
              ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
              : 'border-white/20 text-white/50 hover:border-white/30 hover:text-white/70'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Sound Layer</span>
        </button>

        <AnimatePresence>
          {showPicker && (
            <SoundPicker
              availableSounds={availableSounds}
              onAdd={onAddSound}
              onClose={() => setShowPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SoundMixer
