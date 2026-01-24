'use client'

/**
 * Sound Scene Card Component
 *
 * Beautiful, immersive cards for sound scene presets:
 * - Animated gradient backgrounds
 * - Mood-based visual themes
 * - Play/pause with smooth transitions
 * - Active state with glow effects
 */

import { motion } from 'framer-motion'
import {
  CloudRain,
  Waves,
  TreePine,
  Mountain,
  Moon,
  Sun,
  Flame,
  Wind,
  Sparkles,
  Heart,
  Brain,
  Zap,
  Music,
  Bell,
  type LucideIcon
} from 'lucide-react'

export interface SoundScene {
  id: string
  name: string
  nameHindi: string
  description: string
  icon: LucideIcon
  theme: 'nature' | 'spiritual' | 'focus' | 'sleep' | 'healing'
  sounds: string[]
  duration?: string
}

export interface SoundSceneCardProps {
  scene: SoundScene
  isActive: boolean
  isPlaying: boolean
  onSelect: () => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const THEME_STYLES = {
  nature: {
    gradient: 'from-emerald-600/80 via-green-500/60 to-teal-400/40',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    accent: 'text-emerald-400'
  },
  spiritual: {
    gradient: 'from-violet-600/80 via-purple-500/60 to-indigo-400/40',
    glow: 'shadow-[0_0_60px_rgba(139,92,246,0.3)]',
    border: 'border-violet-500/30',
    icon: 'text-violet-300',
    bg: 'bg-violet-950/30',
    accent: 'text-violet-400'
  },
  focus: {
    gradient: 'from-blue-600/80 via-cyan-500/60 to-sky-400/40',
    glow: 'shadow-[0_0_60px_rgba(14,165,233,0.3)]',
    border: 'border-blue-500/30',
    icon: 'text-blue-300',
    bg: 'bg-blue-950/30',
    accent: 'text-blue-400'
  },
  sleep: {
    gradient: 'from-indigo-700/80 via-slate-600/60 to-purple-500/40',
    glow: 'shadow-[0_0_60px_rgba(99,102,241,0.3)]',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-300',
    bg: 'bg-indigo-950/30',
    accent: 'text-indigo-400'
  },
  healing: {
    gradient: 'from-rose-600/80 via-pink-500/60 to-orange-400/40',
    glow: 'shadow-[0_0_60px_rgba(244,63,94,0.3)]',
    border: 'border-rose-500/30',
    icon: 'text-rose-300',
    bg: 'bg-rose-950/30',
    accent: 'text-rose-400'
  }
}

// Pre-defined sound scenes
export const SOUND_SCENES: SoundScene[] = [
  {
    id: 'morning-peace',
    name: 'Morning Peace',
    nameHindi: 'प्रातः शांति',
    description: 'Gentle birds and soft breeze to start your day',
    icon: Sun,
    theme: 'nature',
    sounds: ['birds', 'wind', 'river'],
    duration: 'Infinite'
  },
  {
    id: 'temple-dawn',
    name: 'Temple Dawn',
    nameHindi: 'मंदिर प्रभात',
    description: 'Sacred bells and Om chanting for spiritual awakening',
    icon: Bell,
    theme: 'spiritual',
    sounds: ['temple_bells', 'om_chant', 'birds'],
    duration: 'Infinite'
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    nameHindi: 'गहन एकाग्रता',
    description: 'Brown noise with subtle rain for concentration',
    icon: Brain,
    theme: 'focus',
    sounds: ['brown_noise', 'rain'],
    duration: 'Infinite'
  },
  {
    id: 'rainforest',
    name: 'Rainforest',
    nameHindi: 'वर्षावन',
    description: 'Immersive jungle rain with wildlife sounds',
    icon: CloudRain,
    theme: 'nature',
    sounds: ['rain', 'thunder', 'birds', 'crickets'],
    duration: 'Infinite'
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    nameHindi: 'समुद्र लहरें',
    description: 'Rhythmic waves for relaxation and sleep',
    icon: Waves,
    theme: 'sleep',
    sounds: ['ocean', 'wind'],
    duration: 'Infinite'
  },
  {
    id: 'mountain-stream',
    name: 'Mountain Stream',
    nameHindi: 'पर्वत धारा',
    description: 'Flowing water and peaceful forest ambiance',
    icon: Mountain,
    theme: 'nature',
    sounds: ['river', 'birds', 'wind'],
    duration: 'Infinite'
  },
  {
    id: 'deep-sleep',
    name: 'Deep Sleep',
    nameHindi: 'गहरी नींद',
    description: 'Delta waves with gentle rain for restorative sleep',
    icon: Moon,
    theme: 'sleep',
    sounds: ['rain', 'pink_noise'],
    duration: '8 hours'
  },
  {
    id: 'cozy-fireplace',
    name: 'Cozy Fireplace',
    nameHindi: 'आरामदायक चूल्हा',
    description: 'Crackling fire with soft rain outside',
    icon: Flame,
    theme: 'healing',
    sounds: ['fire', 'rain'],
    duration: 'Infinite'
  },
  {
    id: 'meditation-temple',
    name: 'Meditation Temple',
    nameHindi: 'ध्यान मंदिर',
    description: 'Singing bowls and tanpura for deep meditation',
    icon: Sparkles,
    theme: 'spiritual',
    sounds: ['singing_bowl', 'tanpura', 'om_chant'],
    duration: '30 min'
  },
  {
    id: 'forest-night',
    name: 'Forest Night',
    nameHindi: 'वन रात्रि',
    description: 'Crickets, owls, and gentle wind under stars',
    icon: TreePine,
    theme: 'sleep',
    sounds: ['crickets', 'wind', 'birds'],
    duration: 'Infinite'
  },
  {
    id: 'energy-boost',
    name: 'Energy Boost',
    nameHindi: 'ऊर्जा वृद्धि',
    description: 'Uplifting tones to energize your morning',
    icon: Zap,
    theme: 'focus',
    sounds: ['flute', 'birds', 'river'],
    duration: '15 min'
  },
  {
    id: 'heart-healing',
    name: 'Heart Healing',
    nameHindi: 'हृदय उपचार',
    description: '528 Hz frequency with gentle nature sounds',
    icon: Heart,
    theme: 'healing',
    sounds: ['singing_bowl', 'rain', 'flute'],
    duration: '20 min'
  }
]

export function SoundSceneCard({
  scene,
  isActive,
  isPlaying,
  onSelect,
  variant = 'default',
  className = ''
}: SoundSceneCardProps) {
  const Icon = scene.icon
  const style = THEME_STYLES[scene.theme]

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={onSelect}
        className={`
          relative flex items-center gap-3 p-3 rounded-xl
          border transition-all duration-300
          ${isActive
            ? `${style.border} ${style.bg} ${style.glow}`
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }
          ${className}
        `}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`
          p-2 rounded-lg
          ${isActive
            ? `bg-gradient-to-br ${style.gradient}`
            : 'bg-white/10'
          }
        `}>
          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
        </div>

        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/80'}`}>
            {scene.name}
          </p>
          <p className="text-[10px] text-white/40">{scene.nameHindi}</p>
        </div>

        {isActive && isPlaying && (
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-0.5 rounded-full ${style.accent}`}
                animate={{
                  height: [4, 12, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                style={{ background: 'currentColor' }}
              />
            ))}
          </div>
        )}
      </motion.button>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.button
        onClick={onSelect}
        className={`
          relative overflow-hidden rounded-3xl p-6
          border transition-all duration-300
          ${isActive
            ? `${style.border} ${style.glow}`
            : 'border-white/10 hover:border-white/20'
          }
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${style.gradient}
          transition-opacity duration-300
          ${isActive ? 'opacity-100' : 'opacity-30'}
        `} />

        {/* Animated particles when active */}
        {isActive && isPlaying && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/40"
                initial={{ x: Math.random() * 100 + '%', y: '100%' }}
                animate={{ y: '-10%', opacity: [0, 1, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`
              p-3 rounded-2xl
              ${isActive ? 'bg-white/20' : 'bg-white/10'}
            `}>
              <Icon className={`w-8 h-8 ${isActive ? 'text-white' : style.icon}`} />
            </div>

            {scene.duration && (
              <span className="text-xs px-2 py-1 rounded-full bg-black/30 text-white/70">
                {scene.duration}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-white mb-1">{scene.name}</h3>
          <p className="text-sm text-white/60 mb-1">{scene.nameHindi}</p>
          <p className="text-sm text-white/50 mb-4">{scene.description}</p>

          {/* Sound tags */}
          <div className="flex flex-wrap gap-1.5">
            {scene.sounds.slice(0, 3).map((sound) => (
              <span
                key={sound}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 capitalize"
              >
                {sound.replace('_', ' ')}
              </span>
            ))}
            {scene.sounds.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                +{scene.sounds.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Playing indicator */}
        {isActive && isPlaying && (
          <motion.div
            className="absolute bottom-4 right-4 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-white/60"
                animate={{ height: [8, 24, 8] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.button>
    )
  }

  // Default variant
  return (
    <motion.button
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-2xl p-4
        border transition-all duration-300 text-left
        ${isActive
          ? `${style.border} ${style.glow}`
          : 'border-white/10 hover:border-white/20'
        }
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${style.gradient}
        transition-opacity duration-300
        ${isActive ? 'opacity-80' : 'opacity-20 hover:opacity-30'}
      `} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`
            p-2 rounded-xl
            ${isActive ? 'bg-white/20' : 'bg-white/10'}
          `}>
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : style.icon}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white text-sm">{scene.name}</h4>
            <p className="text-[10px] text-white/50">{scene.nameHindi}</p>
          </div>

          {isActive && isPlaying && (
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-white/60"
                  animate={{ height: [4, 14, 4] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-white/50 line-clamp-2">{scene.description}</p>
      </div>
    </motion.button>
  )
}

export default SoundSceneCard
