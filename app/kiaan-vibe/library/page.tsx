'use client'

/**
 * KIAAN Vibe - Meditation Library
 *
 * Browse meditation tracks by category.
 */

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Play,
  Clock,
  Music2,
  Brain,
  Moon,
  Wind,
  Heart,
  Sparkles,
  TreePine,
  BookOpen,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  getAllTracks,
  getTracksByCategory,
  searchTracks,
  formatDuration,
} from '@/lib/kiaan-vibe/meditation-library'
import { MEDITATION_CATEGORIES, type MeditationCategory } from '@/lib/kiaan-vibe/types'

// Category icons mapping
const CATEGORY_ICONS: Record<MeditationCategory, typeof Brain> = {
  focus: Brain,
  sleep: Moon,
  breath: Wind,
  mantra: Heart,
  ambient: Sparkles,
  nature: TreePine,
  spiritual: BookOpen,
}

export default function LibraryPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as MeditationCategory | null

  const { currentTrack, play, setQueue } = usePlayerStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(
    initialCategory
  )

  const allTracks = getAllTracks()
  const displayTracks = searchQuery
    ? searchTracks(searchQuery)
    : selectedCategory
    ? getTracksByCategory(selectedCategory)
    : allTracks

  const handlePlayTrack = (index: number) => {
    setQueue(displayTracks, index)
    play(displayTracks[index])
  }

  const handlePlayAll = () => {
    if (displayTracks.length > 0) {
      setQueue(displayTracks, 0)
      play(displayTracks[0])
    }
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meditation Library</h1>
          <p className="text-white/60">{allTracks.length} tracks</p>
        </div>
        <button
          onClick={handlePlayAll}
          disabled={displayTracks.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Play All
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${!selectedCategory && !searchQuery
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
            }
          `}
        >
          All
        </button>
        {(Object.keys(MEDITATION_CATEGORIES) as MeditationCategory[]).map((category) => {
          const config = MEDITATION_CATEGORIES[category]
          const Icon = CATEGORY_ICONS[category]
          const count = getTracksByCategory(category).length
          return (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                setSearchQuery('')
              }}
              className={`
                flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {config.name}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Track list */}
      <div className="space-y-2">
        {displayTracks.length > 0 ? (
          displayTracks.map((track, index) => {
            const isPlaying = currentTrack?.id === track.id
            const Icon = track.category ? CATEGORY_ICONS[track.category] : Music2

            return (
              <motion.button
                key={track.id}
                onClick={() => handlePlayTrack(index)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all
                  ${isPlaying
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }
                `}
              >
                {/* Icon */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-xl
                    bg-gradient-to-br ${track.category ? MEDITATION_CATEGORIES[track.category].gradient : 'from-orange-500/20 to-amber-500/10'}
                    flex items-center justify-center
                  `}
                >
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Icon className="w-6 h-6 text-white/80" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isPlaying ? 'text-orange-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/50 truncate">
                    {track.artist || 'KIAAN Vibe'}
                  </p>
                  {track.tags && track.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {track.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-white/50">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(track.duration || 0)}</span>
                </div>

                {/* Playing indicator */}
                {isPlaying && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-orange-400 rounded-full"
                        animate={{ height: [4, 12, 4] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            )
          })
        ) : (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No tracks found</p>
          </div>
        )}
      </div>
    </div>
  )
}
