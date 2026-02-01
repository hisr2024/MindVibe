'use client'

/**
 * Gita Chapter Card Component
 *
 * Beautiful card for displaying Bhagavad Gita chapters
 * with theme colors and playing state
 */

import { motion } from 'framer-motion'
import { Play, Pause, BookOpen, Clock } from 'lucide-react'
import type { GitaChapter } from '@/lib/kiaan-vibe/types'

export interface GitaChapterCardProps {
  chapter: GitaChapter
  isActive: boolean
  isPlaying: boolean
  onSelect: () => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function GitaChapterCard({
  chapter,
  isActive,
  isPlaying,
  onSelect,
  variant = 'default',
  className = ''
}: GitaChapterCardProps) {

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={onSelect}
        className={`
          relative flex items-center gap-3 p-3 rounded-xl
          border transition-all duration-300
          ${isActive
            ? 'border-orange-500/30 bg-orange-500/10 shadow-lg shadow-orange-500/10'
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }
          ${className}
        `}
        whileTap={{ scale: 0.98 }}
      >
        {/* Chapter number */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center font-bold
          ${isActive ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'}
        `}>
          {chapter.number}
        </div>

        {/* Chapter info */}
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
            {chapter.nameSanskrit}
          </p>
          <p className="text-xs text-white/40 truncate">{chapter.nameEnglish}</p>
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

        {/* Duration */}
        {!isActive && (
          <span className="text-xs text-white/40">{chapter.duration}</span>
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
            ? 'border-orange-500/30 shadow-xl shadow-orange-500/20'
            : 'border-white/10 hover:border-white/20'
          }
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${chapter.color}
          transition-opacity duration-300
          ${isActive ? 'opacity-50' : 'opacity-20'}
        `} />

        {/* Animated particles when playing */}
        {isActive && isPlaying && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30"
                initial={{ x: Math.random() * 100 + '%', y: '100%' }}
                animate={{ y: '-10%', opacity: [0, 1, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold
              ${isActive ? 'bg-white/30 text-white' : 'bg-white/10 text-white/80'}
            `}>
              {chapter.number}
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-xs text-white/50">{chapter.duration}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-1">
            {chapter.nameSanskrit}
          </h3>
          <p className="text-sm text-white/70 mb-1">{chapter.nameEnglish}</p>
          <p className="text-xs text-white/50 mb-4">{chapter.nameHindi}</p>

          {/* Description */}
          <p className="text-sm text-white/60 mb-4 line-clamp-2">
            {chapter.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40">{chapter.verseCount} verses</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
              {chapter.yogaType}
            </span>
          </div>
        </div>

        {/* Play indicator */}
        <div className={`
          absolute bottom-4 right-4 w-10 h-10 rounded-full
          flex items-center justify-center transition-all
          ${isActive && isPlaying
            ? 'bg-white/20'
            : isActive
              ? 'bg-orange-500'
              : 'bg-white/10'
          }
        `}>
          {isActive && isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
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
          ? 'border-orange-500/30 shadow-lg shadow-orange-500/10'
          : 'border-white/10 hover:border-white/20'
        }
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${chapter.color}
        transition-opacity duration-300
        ${isActive ? 'opacity-40' : 'opacity-15 hover:opacity-25'}
      `} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          {/* Chapter number */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
            ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}
          `}>
            {chapter.number}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">
              {chapter.nameSanskrit}
            </h4>
            <p className="text-xs text-white/50 truncate">{chapter.nameEnglish}</p>
          </div>

          {/* Playing indicator or duration */}
          {isActive && isPlaying ? (
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
          ) : (
            <span className="text-xs text-white/40">{chapter.duration}</span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 line-clamp-2">{chapter.theme}</p>

        {/* Verse count */}
        <div className="mt-2 flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/30">{chapter.verseCount} verses</span>
        </div>
      </div>
    </motion.button>
  )
}

export default GitaChapterCard
