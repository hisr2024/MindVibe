'use client'

/**
 * Spiritual Music Player - Clean & Minimal
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Simple, soul-soothing spiritual music player with playlist support.
 * Authentic Sanatan sounds for meditation and reflection.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flower2,
  Wind,
  Waves,
  TreePine,
  Moon,
  Heart,
  Sun,
  Sunset,
  Church,
  CloudRain,
  Trees,
  Droplets,
  Sparkles,
  Brain,
  HandHeart,
  SkipForward,
  SkipBack,
  ListMusic,
  X,
  Clock
} from 'lucide-react'
import spiritualAudio, {
  SPIRITUAL_MOODS,
  MEDITATION_PLAYLISTS,
  type SpiritualMood,
  type PlaylistTrack
} from '@/utils/audio/SpiritualAudioEngine'

// Mood icons mapping
const MOOD_ICONS: Record<SpiritualMood, typeof Flower2> = {
  peace: Flower2,
  devotion: Heart,
  meditation: Moon,
  krishna: Wind,
  nature: TreePine,
  sleep: Waves,
  morning: Sun,
  evening: Sunset,
  temple: Church,
  rainy_day: CloudRain,
  forest_night: Trees,
  sacred_river: Droplets,
  healing: Sparkles,
  focus: Brain,
  gratitude: HandHeart
}

interface SpiritualMusicPlayerProps {
  className?: string
  compact?: boolean
  showPlaylists?: boolean
}

export function SpiritualMusicPlayer({
  className = '',
  compact = false,
  showPlaylists = true
}: SpiritualMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMood, setCurrentMood] = useState<SpiritualMood | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistTrack | null>(null)
  const [playlistIndex, setPlaylistIndex] = useState(0)
  const [isPlaylistMode, setIsPlaylistMode] = useState(false)

  // Sync state with audio engine
  useEffect(() => {
    const state = spiritualAudio.getState()
    setIsPlaying(state.isPlaying)
    setCurrentMood(state.currentMood)
    setVolume(state.volume)
    setIsPlaylistMode(state.isPlaylistMode)
    setCurrentPlaylist(state.currentPlaylist)
    setPlaylistIndex(state.playlistIndex)

    // Set callback for playlist changes
    spiritualAudio.setPlaylistChangeCallback((mood, index) => {
      setCurrentMood(mood)
      setPlaylistIndex(index)
    })
  }, [])

  // Handle mood selection
  const handleMoodSelect = useCallback(async (mood: SpiritualMood) => {
    try {
      // Exit playlist mode if selecting individual mood
      if (isPlaylistMode) {
        spiritualAudio.stopPlaylist()
        setIsPlaylistMode(false)
        setCurrentPlaylist(null)
      }

      if (currentMood === mood && isPlaying) {
        await spiritualAudio.stop()
        setIsPlaying(false)
        setCurrentMood(null)
      } else {
        await spiritualAudio.play(mood)
        setIsPlaying(true)
        setCurrentMood(mood)
      }
    } catch (error) {
      console.error('Audio error:', error)
    }
  }, [currentMood, isPlaying, isPlaylistMode])

  // Handle playlist selection
  const handlePlaylistSelect = useCallback(async (playlist: PlaylistTrack) => {
    try {
      await spiritualAudio.playPlaylist(playlist.id)
      setCurrentPlaylist(playlist)
      setIsPlaylistMode(true)
      setIsPlaying(true)
      setPlaylistIndex(0)
      setCurrentMood(playlist.moods[0])
      setShowPlaylistPanel(false)
    } catch (error) {
      console.error('Playlist error:', error)
    }
  }, [])

  // Handle play/pause toggle
  const handleToggle = useCallback(async () => {
    try {
      if (isPlaying) {
        await spiritualAudio.stop()
        setIsPlaying(false)
        setCurrentMood(null)
        if (isPlaylistMode) {
          setIsPlaylistMode(false)
          setCurrentPlaylist(null)
        }
      } else if (currentMood) {
        await spiritualAudio.play(currentMood)
        setIsPlaying(true)
      } else {
        await spiritualAudio.play('peace')
        setIsPlaying(true)
        setCurrentMood('peace')
      }
    } catch (error) {
      console.error('Audio error:', error)
    }
  }, [isPlaying, currentMood, isPlaylistMode])

  // Handle next/prev in playlist
  const handleNext = useCallback(async () => {
    if (isPlaylistMode) {
      await spiritualAudio.nextInPlaylist()
    }
  }, [isPlaylistMode])

  const handlePrev = useCallback(async () => {
    if (isPlaylistMode) {
      await spiritualAudio.prevInPlaylist()
    }
  }, [isPlaylistMode])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    spiritualAudio.setVolume(newVolume)
  }, [])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      spiritualAudio.setVolume(volume || 0.5)
      setIsMuted(false)
    } else {
      spiritualAudio.setVolume(0)
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const moods = Object.values(SPIRITUAL_MOODS)

  if (compact) {
    return (
      <div className={`rounded-2xl bg-[#0d0d12]/90 border border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className={`p-3 rounded-xl transition-all ${
              isPlaying
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>

          <div className="flex-1 min-w-0">
            {currentMood ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">
                  {SPIRITUAL_MOODS[currentMood].name}
                </span>
                <span className="text-xs text-white/40">
                  {SPIRITUAL_MOODS[currentMood].nameHindi}
                </span>
              </div>
            ) : (
              <span className="text-sm text-white/40">Select a mood</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg text-white/40 hover:text-white/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-violet-400"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl bg-[#0d0d12]/90 border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Flower2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Spiritual Sounds</h3>
              <p className="text-xs text-white/40">आध्यात्मिक ध्वनि</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Playlist button */}
            {showPlaylists && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPlaylistPanel(!showPlaylistPanel)}
                className={`p-2 rounded-xl transition-all ${
                  showPlaylistPanel || isPlaylistMode
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-white/5 text-white/40 hover:text-white/60'
                }`}
              >
                <ListMusic className="w-5 h-5" />
              </motion.button>
            )}

            {/* Playing indicator */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="w-0.5 bg-violet-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-violet-400 ml-1">Playing</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Playlist info bar */}
        <AnimatePresence>
          {isPlaylistMode && currentPlaylist && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">{currentPlaylist.name}</span>
                  <span className="text-xs text-white/40">
                    {playlistIndex + 1}/{currentPlaylist.moods.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playlist Panel */}
      <AnimatePresence>
        {showPlaylistPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/5 bg-white/[0.02]"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/70">Playlists</h4>
                <button
                  onClick={() => setShowPlaylistPanel(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {MEDITATION_PLAYLISTS.map((playlist) => (
                  <motion.button
                    key={playlist.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlaylistSelect(playlist)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      currentPlaylist?.id === playlist.id
                        ? 'bg-violet-500/20 border border-violet-500/30'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-white truncate">{playlist.name}</h5>
                        <p className="text-xs text-white/40">{playlist.nameHindi}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="w-3 h-3" />
                        <span>{playlist.duration}m</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 line-clamp-1">{playlist.description}</p>
                    <div className="flex gap-1 mt-2">
                      {playlist.moods.slice(0, 4).map((mood, i) => {
                        const MoodIcon = MOOD_ICONS[mood]
                        return (
                          <div
                            key={i}
                            className="p-1 rounded bg-white/5"
                            title={SPIRITUAL_MOODS[mood].name}
                          >
                            <MoodIcon className="w-3 h-3 text-white/40" />
                          </div>
                        )
                      })}
                      {playlist.moods.length > 4 && (
                        <div className="p-1 rounded bg-white/5 text-[10px] text-white/40">
                          +{playlist.moods.length - 4}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Grid */}
      <div className="p-5">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {moods.map((mood) => {
            const Icon = MOOD_ICONS[mood.id]
            const isActive = currentMood === mood.id && isPlaying

            return (
              <motion.button
                key={mood.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMoodSelect(mood.id)}
                className={`relative overflow-hidden rounded-xl p-3 text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent"
                  />
                )}

                <div className="relative z-10">
                  <div
                    className={`p-2 rounded-lg w-fit mb-2 transition-colors ${
                      isActive ? 'bg-violet-500/30' : 'bg-white/10'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${mood.primaryColor}30` : undefined
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? mood.primaryColor : 'rgba(255,255,255,0.6)' }}
                    />
                  </div>

                  <h4 className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                    {mood.name}
                  </h4>
                  <p className="text-[10px] text-white/30">{mood.nameHindi}</p>
                </div>

                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Volume Control */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
          {/* Prev (playlist mode) */}
          {isPlaylistMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/60 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </motion.button>
          )}

          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className={`p-3 rounded-xl transition-all ${
              isPlaying
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>

          {/* Next (playlist mode) */}
          {isPlaylistMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/60 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>
          )}

          {/* Volume slider */}
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={handleMuteToggle}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'text-white/30' : 'text-white/60 hover:text-white/80'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-violet-400
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-violet-500/30
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full pointer-events-none"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>

            <span className="text-xs text-white/40 w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpiritualMusicPlayer
