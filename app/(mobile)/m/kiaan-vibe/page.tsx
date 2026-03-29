'use client'

/**
 * KIAAN Vibe Library — Mobile-native browse & play experience.
 * Sacred design system with category filtering, track grid, and featured section.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Music2 } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  getAllTracks,
  getTracksByCategory,
  searchTracks,
  formatDuration,
} from '@/lib/kiaan-vibe/meditation-library'
import type { MeditationCategory, Track } from '@/lib/kiaan-vibe/types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all',       label: 'All',       icon: '✦' },
  { id: 'mantra',    label: 'Mantra',    icon: '🕉' },
  { id: 'ambient',   label: 'Ambient',   icon: '◎' },
  { id: 'nature',    label: 'Nature',    icon: '⟡' },
  { id: 'breath',    label: 'Breath',    icon: '☁' },
  { id: 'focus',     label: 'Focus',     icon: '◈' },
  { id: 'sleep',     label: 'Sleep',     icon: '☽' },
  { id: 'spiritual', label: 'Spiritual', icon: '✧' },
]

function TrackCard({ track, isCurrentTrack, isPlaying, onPlay }: {
  track: Track
  isCurrentTrack: boolean
  isPlaying: boolean
  onPlay: () => void
}) {
  return (
    <motion.button
      onClick={onPlay}
      className="relative rounded-2xl overflow-hidden text-left group"
      style={{
        background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
        border: isCurrentTrack
          ? '1px solid rgba(212,160,23,0.4)'
          : '1px solid rgba(212,160,23,0.08)',
        borderTop: isCurrentTrack
          ? '2px solid rgba(212,160,23,0.6)'
          : '2px solid rgba(212,160,23,0.15)',
      }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Album art area */}
      <div className="aspect-square w-full flex items-center justify-center relative"
        style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(14,116,144,0.05))' }}
      >
        <Music2 className="w-10 h-10 text-[#D4A017]/40" />

        {/* Category badge */}
        {track.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] tracking-[0.1em] uppercase text-[#D4A017] bg-[#050714]/80 rounded-full border border-[#D4A017]/15 font-[family-name:var(--font-ui)]">
            {track.category}
          </span>
        )}

        {/* Play overlay on hover/press */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-active:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-[#D4A017] flex items-center justify-center">
            {isCurrentTrack && isPlaying ? (
              <div className="flex items-center gap-0.5">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1 bg-white rounded-full" animate={{ height: [4, 14, 4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
            )}
          </div>
        </div>

        {/* Current playing ring */}
        {isCurrentTrack && isPlaying && (
          <motion.div className="absolute inset-0 border-2 border-[#D4A017]/40 rounded-t-2xl"
            animate={{ borderColor: ['rgba(212,160,23,0.2)', 'rgba(212,160,23,0.5)', 'rgba(212,160,23,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Track info */}
      <div className="p-3">
        <p className="text-[13px] text-[#EDE8DC] truncate font-[family-name:var(--font-ui)]" style={{ fontWeight: 500 }}>
          {track.title}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-[#6B6355] truncate font-[family-name:var(--font-ui)]">
            {track.artist || 'KIAAN Vibe'}
          </p>
          {track.duration && (
            <span className="text-[10px] text-[#6B6355] font-[family-name:var(--font-ui)]">
              {formatDuration(track.duration)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

export default function MobileKiaanVibePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { triggerHaptic } = useHapticFeedback()
  const { currentTrack, isPlaying, play, setQueue } = usePlayerStore()

  const filteredTracks = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTracks(searchQuery)
    }
    if (selectedCategory === 'all') {
      return getAllTracks()
    }
    return getTracksByCategory(selectedCategory as MeditationCategory)
  }, [selectedCategory, searchQuery])

  const allTracks = useMemo(() => getAllTracks(), [])

  // Featured tracks = first 6 from all
  const featuredTracks = useMemo(() => allTracks.slice(0, 6), [allTracks])

  const handlePlayTrack = useCallback((track: Track, trackList: Track[]) => {
    triggerHaptic('medium')
    const index = trackList.findIndex(t => t.id === track.id)
    setQueue(trackList, index >= 0 ? index : 0)
    play(track)
  }, [triggerHaptic, setQueue, play])

  return (
    <MobileAppShell title="KIAAN Vibe" showBack>
      <div className="px-4 pb-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-[family-name:var(--font-divine)] text-2xl text-[#EDE8DC]" style={{ fontWeight: 500 }}>
            KIAAN Vibe
          </h1>
          <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#6B6355] mt-0.5">
            Sacred Sounds for the Soul
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6355]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mantras, nature, ambient..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl text-sm bg-[rgba(22,26,66,0.5)] border border-[#D4A017]/10 text-[#EDE8DC] placeholder-[#6B6355] focus:outline-none focus:border-[#D4A017]/30 font-[family-name:var(--font-ui)]"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSearchQuery(''); triggerHaptic('selection') }}
              className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] transition-all flex items-center gap-1.5 font-[family-name:var(--font-ui)] ${
                selectedCategory === cat.id
                  ? 'bg-[#D4A017] text-[#050714] font-medium'
                  : 'bg-transparent border border-[#D4A017]/20 text-[#D4A017]'
              }`}
              style={{ fontWeight: selectedCategory === cat.id ? 500 : 400 }}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured section (only when 'all' and no search) */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-6">
            <h2 className="text-[11px] text-[#D4A017] tracking-[0.12em] uppercase mb-3 font-[family-name:var(--font-ui)]">
              ✦ Sacred Picks
            </h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none">
              {featuredTracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(track, allTracks)}
                  className="flex-shrink-0 w-[200px] rounded-2xl overflow-hidden text-left"
                  style={{
                    background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                    border: '1px solid rgba(212,160,23,0.1)',
                  }}
                >
                  <div className="h-[120px] flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.1), rgba(14,116,144,0.06))' }}>
                    <Music2 className="w-12 h-12 text-[#D4A017]/30" />
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] text-[#EDE8DC] truncate font-[family-name:var(--font-ui)]" style={{ fontWeight: 500 }}>
                      {track.title}
                    </p>
                    <p className="text-[10px] text-[#6B6355] truncate mt-0.5">
                      {track.artist || 'KIAAN Vibe'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Track grid (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          {filteredTracks.map(track => (
            <TrackCard
              key={track.id}
              track={track}
              isCurrentTrack={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              onPlay={() => handlePlayTrack(track, filteredTracks)}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredTracks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-[#6B6355] font-[family-name:var(--font-divine)]">No tracks found</p>
            <p className="text-xs text-[#6B6355]/60 mt-1 font-[family-name:var(--font-ui)]">
              Try a different search or category
            </p>
          </div>
        )}
      </div>
    </MobileAppShell>
  )
}
