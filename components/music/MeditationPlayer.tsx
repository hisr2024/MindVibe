'use client'

/**
 * Meditation Player - Natural Ultra HD Music
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Clean, minimal player for natural meditation music.
 * No gimmicks - just beautiful music.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Music,
  Clock,
  ChevronRight
} from 'lucide-react'
import meditationAudio, {
  MEDITATION_TRACKS,
  MEDITATION_PLAYLISTS,
  CATEGORY_INFO,
  type MeditationTrack,
  type MeditationPlaylist,
  type MeditationCategory,
  type PlayerState
} from '@/utils/audio/MeditationAudioEngine'

interface MeditationPlayerProps {
  className?: string
}

export function MeditationPlayer({ className = '' }: MeditationPlayerProps) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentPlaylist: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
    error: null
  })
  const [isMuted, setIsMuted] = useState(false)
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists'>('playlists')
  const [selectedCategory, setSelectedCategory] = useState<MeditationCategory | null>(null)

  // Subscribe to state changes
  useEffect(() => {
    meditationAudio.setStateChangeCallback(setState)
    setState(meditationAudio.getState())
  }, [])

  // Play track
  const handlePlayTrack = useCallback(async (trackId: string) => {
    await meditationAudio.playTrack(trackId)
  }, [])

  // Play playlist
  const handlePlayPlaylist = useCallback(async (playlistId: string) => {
    await meditationAudio.playPlaylist(playlistId)
  }, [])

  // Toggle play/pause
  const handleToggle = useCallback(async () => {
    await meditationAudio.toggle()
  }, [])

  // Next/Previous
  const handleNext = useCallback(async () => {
    await meditationAudio.next()
  }, [])

  const handlePrevious = useCallback(async () => {
    await meditationAudio.previous()
  }, [])

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value)
    meditationAudio.seek(position)
  }, [])

  // Volume
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    meditationAudio.setVolume(vol)
    setIsMuted(vol === 0)
  }, [])

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      meditationAudio.setVolume(state.volume || 0.7)
      setIsMuted(false)
    } else {
      meditationAudio.setVolume(0)
      setIsMuted(true)
    }
  }, [isMuted, state.volume])

  // Format time
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get tracks for display
  const displayTracks = selectedCategory
    ? meditationAudio.getTracksByCategory(selectedCategory)
    : MEDITATION_TRACKS

  const categories = Object.keys(CATEGORY_INFO) as MeditationCategory[]

  return (
    <div className={`rounded-2xl bg-[#0d0d12] border border-white/10 overflow-hidden ${className}`}>
      {/* Now Playing Section */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-start gap-4">
          {/* Album Art Placeholder */}
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center flex-shrink-0">
            {state.currentTrack ? (
              <Music className="w-8 h-8 text-violet-400" />
            ) : (
              <Music className="w-8 h-8 text-white/20" />
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            {state.currentTrack ? (
              <>
                <h3 className="text-base font-semibold text-white truncate">
                  {state.currentTrack.title}
                </h3>
                <p className="text-sm text-white/40 truncate">
                  {state.currentTrack.titleHindi}
                </p>
                {state.currentTrack.artist && (
                  <p className="text-xs text-white/30 mt-1">{state.currentTrack.artist}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${CATEGORY_INFO[state.currentTrack.category].color}20`,
                      color: CATEGORY_INFO[state.currentTrack.category].color
                    }}
                  >
                    {CATEGORY_INFO[state.currentTrack.category].name}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white/40">No track playing</h3>
                <p className="text-sm text-white/20">Select a track or playlist below</p>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {state.currentTrack && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={state.duration ? state.currentTime / state.duration : 0}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-violet-400
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div
                className="absolute top-0 left-0 h-1.5 bg-violet-500 rounded-full pointer-events-none"
                style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-white/30">{formatTime(state.currentTime)}</span>
              <span className="text-xs text-white/30">{formatTime(state.duration)}</span>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {/* Previous */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevious}
            disabled={!state.currentPlaylist}
            className={`p-2 rounded-lg transition-colors ${
              state.currentPlaylist
                ? 'text-white/60 hover:text-white'
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!state.currentTrack}
            className={`p-4 rounded-full transition-all ${
              state.currentTrack
                ? state.isPlaying
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {state.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </motion.button>

          {/* Next */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            disabled={!state.currentPlaylist}
            className={`p-2 rounded-lg transition-colors ${
              state.currentPlaylist
                ? 'text-white/60 hover:text-white'
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors"
          >
            {isMuted || state.volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="w-32 relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : state.volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white/60"
            />
            <div
              className="absolute top-0 left-0 h-1 bg-white/40 rounded-full pointer-events-none"
              style={{ width: `${(isMuted ? 0 : state.volume) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/30 w-8">{Math.round((isMuted ? 0 : state.volume) * 100)}%</span>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'playlists'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <ListMusic className="w-4 h-4 inline mr-2" />
          Playlists
        </button>
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tracks'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Music className="w-4 h-4 inline mr-2" />
          All Tracks
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'playlists' ? (
            <motion.div
              key="playlists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {MEDITATION_PLAYLISTS.map((playlist) => (
                <motion.button
                  key={playlist.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handlePlayPlaylist(playlist.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    state.currentPlaylist?.id === playlist.id
                      ? 'bg-violet-500/20 border border-violet-500/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{playlist.name}</h4>
                    <p className="text-xs text-white/40">{playlist.nameHindi}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/30">{playlist.tracks.length} tracks</span>
                      <span className="text-xs text-white/20">•</span>
                      <span className="text-xs text-white/30">{playlist.duration} min</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="tracks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Category Filter */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-white/5 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {CATEGORY_INFO[cat].name}
                  </button>
                ))}
              </div>

              {/* Track List */}
              <div className="space-y-2">
                {displayTracks.map((track) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handlePlayTrack(track.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      state.currentTrack?.id === track.id
                        ? 'bg-violet-500/20 border border-violet-500/30'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${CATEGORY_INFO[track.category].color}20` }}
                    >
                      {state.currentTrack?.id === track.id && state.isPlaying ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [3, 10, 3] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              className="w-0.5 rounded-full"
                              style={{ backgroundColor: CATEGORY_INFO[track.category].color }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Music
                          className="w-4 h-4"
                          style={{ color: CATEGORY_INFO[track.category].color }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                      <p className="text-xs text-white/40 truncate">{track.titleHindi}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <Clock className="w-3 h-3" />
                      <span>{Math.floor(track.duration / 60)}m</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audio Files Note */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <p className="text-xs text-white/30 text-center">
          Add meditation music files to <code className="text-white/40">/public/audio/meditation/</code>
        </p>
      </div>
    </div>
  )
}

export default MeditationPlayer
