'use client'

/**
 * Gita Soundscape Card Component
 *
 * Beautiful card for Gita + Ambient sound presets
 */

import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Sun,
  Moon,
  Brain,
  Heart,
  BookOpen,
  Sparkles,
  Music2,
  Globe,
  Clock,
  Volume2,
  type LucideIcon
} from 'lucide-react'
import type { GitaSoundscape } from '@/lib/kiaan-vibe/types'

export interface GitaSoundscapeCardProps {
  soundscape: GitaSoundscape
  isActive: boolean
  isPlaying: boolean
  onSelect: () => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const ICONS: Record<string, LucideIcon> = {
  Sun,
  Moon,
  Brain,
  Heart,
  BookOpen,
  Sparkles,
  Music: Music2,
  Globe
}

export function GitaSoundscapeCard({
  soundscape,
  isActive,
  isPlaying,
  onSelect,
  variant = 'default',
  className = ''
}: GitaSoundscapeCardProps) {
  const Icon = ICONS[soundscape.icon] || Sparkles

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={onSelect}
        className={`
          relative flex items-center gap-3 p-3 rounded-xl
          border transition-all duration-300
          ${isActive
            ? 'border-orange-500/30 bg-orange-500/10'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
          }
          ${className}
        `}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${soundscape.gradient}
          ${isActive ? 'opacity-100' : 'opacity-70'}
        `}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
            {soundscape.name}
          </p>
          <p className="text-xs text-white/40 truncate">{soundscape.nameHindi}</p>
        </div>

        {/* Playing indicator */}
        {isActive && isPlaying && (
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full bg-orange-400"
                animate={{ height: [4, 12, 4] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
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
          relative overflow-hidden rounded-3xl p-6 text-left
          border transition-all duration-300
          ${isActive
            ? 'border-orange-500/40 shadow-xl'
            : 'border-white/10 hover:border-white/20'
          }
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${soundscape.gradient}
          transition-opacity duration-300
          ${isActive ? 'opacity-40' : 'opacity-20'}
        `} />

        {/* Animated orbs when playing */}
        {isActive && isPlaying && (
          <>
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-white/10 blur-2xl"
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              style={{ top: '10%', left: '10%' }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full bg-white/10 blur-2xl"
              animate={{
                x: [0, -30, 0],
                y: [0, 40, 0],
                scale: [1.2, 1, 1.2]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              style={{ bottom: '10%', right: '10%' }}
            />
          </>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              bg-gradient-to-br ${soundscape.gradient}
            `}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Time recommendation */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-xs text-white/50">{soundscape.recommendedTime}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-1">{soundscape.name}</h3>
          <p className="text-sm text-white/60 mb-1">{soundscape.nameHindi}</p>
          <p className="text-sm text-white/50 mb-4 line-clamp-2">{soundscape.description}</p>

          {/* Benefits */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {soundscape.benefits.slice(0, 3).map((benefit, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60"
              >
                {benefit}
              </span>
            ))}
          </div>

          {/* Ambient sounds preview */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40">
              {soundscape.ambientSounds.length} ambient layers
            </span>
          </div>
        </div>

        {/* Play button */}
        <div className={`
          absolute bottom-4 right-4 w-12 h-12 rounded-full
          flex items-center justify-center transition-all
          ${isActive && isPlaying
            ? 'bg-white/20'
            : isActive
              ? 'bg-orange-500 shadow-lg shadow-orange-500/30'
              : 'bg-white/10'
          }
        `}>
          {isActive && isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </div>
      </motion.button>
    )
  }

  // Default variant
  return (
    <motion.button
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-2xl p-4 text-left
        border transition-all duration-300
        ${isActive
          ? 'border-orange-500/30 shadow-lg'
          : 'border-white/10 hover:border-white/20'
        }
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${soundscape.gradient}
        transition-opacity duration-300
        ${isActive ? 'opacity-30' : 'opacity-15 hover:opacity-20'}
      `} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${soundscape.gradient}
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">
              {soundscape.name}
            </h4>
            <p className="text-xs text-white/50 truncate">{soundscape.nameHindi}</p>
          </div>

          {/* Playing indicator */}
          {isActive && isPlaying && (
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-orange-400"
                  animate={{ height: [4, 14, 4] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 line-clamp-2 mb-2">
          {soundscape.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30">
              {soundscape.ambientSounds.length} sounds
            </span>
          </div>
          <span className="text-[10px] text-white/30">
            {soundscape.theme}
          </span>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}

export default GitaSoundscapeCard
