'use client'

/**
 * KIAAN Vibe Music Player - Home Page
 *
 * The main landing page for the music player featuring:
 * - Now Playing section
 * - Quick access to categories
 * - Recent tracks
 * - Navigation to Gita, Library, Uploads, Playlists
 */

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  BookOpen,
  Music2,
  Upload,
  ListMusic,
  Play,
  Clock,
  Sparkles,
  Moon,
  Wind,
  Heart,
  TreePine,
  Brain,
  Volume2,
} from 'lucide-react'

// Dynamic import for framer-motion to reduce initial bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => {
    const { motion } = mod
    return { default: motion.div }
  }),
  { ssr: false }
)
const MotionButton = dynamic(
  () => import('framer-motion').then(mod => {
    const { motion } = mod
    return { default: motion.button }
  }),
  { ssr: false }
)
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { getAllTracks, getTracksByCategory, formatDuration } from '@/lib/kiaan-vibe/meditation-library'
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

export default function KiaanVibePage() {
  const { currentTrack, play, setQueue } = usePlayerStore()
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null)

  const allTracks = getAllTracks()
  const displayTracks = selectedCategory
    ? getTracksByCategory(selectedCategory)
    : allTracks.slice(0, 6)

  const handlePlayTrack = (trackIndex: number) => {
    const tracks = selectedCategory ? getTracksByCategory(selectedCategory) : allTracks
    setQueue(tracks, trackIndex)
    play(tracks[trackIndex])
  }

  const handlePlayCategory = (category: MeditationCategory) => {
    const tracks = getTracksByCategory(category)
    if (tracks.length > 0) {
      setQueue(tracks, 0)
      play(tracks[0])
    }
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          KIAAN Vibe
        </h1>
        <p className="text-white/60">
          Meditation music for inner peace
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          href="/kiaan-vibe/gita"
          className="group p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all"
        >
          <BookOpen className="w-8 h-8 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Bhagavad Gita</h3>
          <p className="text-xs text-white/50">All languages</p>
        </Link>

        <Link
          href="/kiaan-vibe/gita/voice"
          className="group p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 hover:border-amber-500/40 transition-all relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-orange-500/30 text-[10px] font-bold text-orange-300 uppercase tracking-wider">
            New
          </div>
          <Volume2 className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Divine Voices</h3>
          <p className="text-xs text-white/50">Sanskrit recitation</p>
        </Link>

        <Link
          href="/kiaan-vibe/library"
          className="group p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          <Music2 className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Library</h3>
          <p className="text-xs text-white/50">Meditation tracks</p>
        </Link>

        <Link
          href="/kiaan-vibe/uploads"
          className="group p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all"
        >
          <Upload className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">My Uploads</h3>
          <p className="text-xs text-white/50">Your music</p>
        </Link>

        <Link
          href="/kiaan-vibe/playlists"
          className="group p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all"
        >
          <ListMusic className="w-8 h-8 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Playlists</h3>
          <p className="text-xs text-white/50">Your collections</p>
        </Link>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${!selectedCategory
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
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
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
              </button>
            )
          })}
        </div>
      </div>

      {/* Track List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {selectedCategory ? MEDITATION_CATEGORIES[selectedCategory].name : 'Featured Tracks'}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => handlePlayCategory(selectedCategory)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 transition-colors"
            >
              <Play className="w-4 h-4" />
              Play All
            </button>
          )}
        </div>

        <div className="space-y-2">
          {displayTracks.map((track, index) => {
            const isPlaying = currentTrack?.id === track.id
            return (
              <MotionButton
                key={track.id}
                onClick={() => handlePlayTrack(index)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all
                  ${isPlaying
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }
                `}
                whileTap={{ scale: 0.98 }}
              >
                {/* Album art / icon */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden
                    bg-gradient-to-br ${track.category ? MEDITATION_CATEGORIES[track.category].gradient : 'from-orange-500 to-amber-600'}
                    flex items-center justify-center
                  `}
                >
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music2 className="w-6 h-6 text-white/80" />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isPlaying ? 'text-orange-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/50 truncate">
                    {track.artist || 'KIAAN Vibe'}
                  </p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-white/50">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(track.duration || 0)}</span>
                </div>

                {/* Play indicator */}
                {isPlaying && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <MotionDiv
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
              </MotionButton>
            )
          })}
        </div>

        {!selectedCategory && (
          <Link
            href="/kiaan-vibe/library"
            className="block mt-4 text-center text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            View all tracks →
          </Link>
        )}
      </div>
    </div>
  )
}
