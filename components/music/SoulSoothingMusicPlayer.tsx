'use client'

/**
 * Soul-Soothing Music Player Component
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A beautiful music player for real, natural, soul-soothing music.
 * Features:
 * - Real audio streaming (not synthesized tones)
 * - Curated playlists for different moods
 * - Smooth transitions and visualizations
 * - Background playback support
 * - Time-based recommendations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ALL_TRACKS,
  PLAYLISTS,
  getTrackById,
  getPlaylistTracks,
  formatDuration,
  getRecommendedTracks,
  type MusicTrack,
  type MusicPlaylist,
  type MusicCategory
} from '@/lib/music/soulSoothingMusicLibrary'

interface SoulSoothingMusicPlayerProps {
  className?: string
  compact?: boolean
  showPlaylist?: boolean
  autoPlay?: boolean
  defaultPlaylist?: string
}

const CATEGORY_INFO: Record<MusicCategory | 'mixed', { name: string; nameHindi: string; icon: string; color: string }> = {
  krishna_flute: { name: 'Krishna Flute', nameHindi: 'कृष्ण बांसुरी', icon: '🪈', color: 'from-blue-500 to-indigo-600' },
  nature: { name: 'Nature', nameHindi: 'प्रकृति', icon: '🌿', color: 'from-green-500 to-emerald-600' },
  temple: { name: 'Temple', nameHindi: 'मंदिर', icon: '🛕', color: 'from-amber-500 to-orange-600' },
  ragas: { name: 'Ragas', nameHindi: 'राग', icon: '🎵', color: 'from-purple-500 to-violet-600' },
  meditation: { name: 'Meditation', nameHindi: 'ध्यान', icon: '🧘', color: 'from-indigo-500 to-purple-600' },
  healing: { name: 'Healing', nameHindi: 'उपचार', icon: '✨', color: 'from-teal-500 to-cyan-600' },
  sleep: { name: 'Sleep', nameHindi: 'निद्रा', icon: '🌙', color: 'from-slate-600 to-gray-700' },
  morning: { name: 'Morning', nameHindi: 'प्रभात', icon: '🌅', color: 'from-orange-500 to-amber-600' },
  evening: { name: 'Evening', nameHindi: 'संध्या', icon: '🌆', color: 'from-rose-500 to-pink-600' },
  mixed: { name: 'Mixed', nameHindi: 'मिश्रित', icon: '🎶', color: 'from-violet-500 to-purple-600' }
}

export function SoulSoothingMusicPlayer({
  className = '',
  compact = false,
  showPlaylist = true,
  autoPlay = false,
  defaultPlaylist
}: SoulSoothingMusicPlayerProps) {
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [currentPlaylist, setCurrentPlaylist] = useState<MusicPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[]>([])
  const [playlistIndex, setPlaylistIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [view, setView] = useState<'player' | 'playlists' | 'tracks'>('player')
  const [selectedCategory, setSelectedCategory] = useState<MusicCategory | 'all'>('all')

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    const audio = audioRef.current

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleEnded = () => {
      playNext()
    }

    const handleError = () => {
      setError('Unable to play this track. Trying next...')
      setIsLoading(false)
      setTimeout(() => playNext(), 2000)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setError(null)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.pause()
    }
  }, [])

  // Load default playlist
  useEffect(() => {
    if (defaultPlaylist) {
      const playlist = PLAYLISTS.find(p => p.id === defaultPlaylist)
      if (playlist) {
        handlePlaylistSelect(playlist)
      }
    } else {
      // Load recommended tracks
      const recommended = getRecommendedTracks()
      if (recommended.length > 0) {
        setPlaylistTracks(recommended)
        setCurrentTrack(recommended[0])
      }
    }
  }, [defaultPlaylist])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Play track
  const playTrack = useCallback(async (track: MusicTrack, index?: number) => {
    if (!audioRef.current) return

    setIsLoading(true)
    setError(null)
    setCurrentTrack(track)
    if (index !== undefined) setPlaylistIndex(index)

    audioRef.current.src = track.audioUrl
    audioRef.current.load()

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('Playback error:', err)
      setError('Tap to start playback')
      setIsPlaying(false)
    }
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        if (!currentTrack && playlistTracks.length > 0) {
          await playTrack(playlistTracks[0], 0)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('Play error:', err)
      }
    }
  }, [isPlaying, currentTrack, playlistTracks, playTrack])

  // Play next track
  const playNext = useCallback(() => {
    if (playlistTracks.length === 0) return

    const nextIndex = (playlistIndex + 1) % playlistTracks.length
    playTrack(playlistTracks[nextIndex], nextIndex)
  }, [playlistIndex, playlistTracks, playTrack])

  // Play previous track
  const playPrev = useCallback(() => {
    if (playlistTracks.length === 0) return

    const prevIndex = playlistIndex === 0 ? playlistTracks.length - 1 : playlistIndex - 1
    playTrack(playlistTracks[prevIndex], prevIndex)
  }, [playlistIndex, playlistTracks, playTrack])

  // Seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }, [duration])

  // Handle playlist selection
  const handlePlaylistSelect = useCallback((playlist: MusicPlaylist) => {
    setCurrentPlaylist(playlist)
    const tracks = getPlaylistTracks(playlist.id)
    setPlaylistTracks(tracks)
    if (tracks.length > 0) {
      playTrack(tracks[0], 0)
    }
    setView('player')
  }, [playTrack])

  // Handle single track selection
  const handleTrackSelect = useCallback((track: MusicTrack) => {
    const index = playlistTracks.findIndex(t => t.id === track.id)
    playTrack(track, index >= 0 ? index : 0)
    setView('player')
  }, [playlistTracks, playTrack])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get category info
  const getCategoryInfo = (category: MusicCategory | 'mixed') => {
    return CATEGORY_INFO[category] || CATEGORY_INFO.mixed
  }

  // Compact player view
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 ${className}`}>
        {/* Thumbnail */}
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentTrack ? getCategoryInfo(currentTrack.category).color : 'from-purple-500 to-indigo-600'} flex items-center justify-center text-2xl`}>
          {currentTrack ? getCategoryInfo(currentTrack.category).icon : '🎵'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">
            {currentTrack?.title || 'Select a track'}
          </p>
          <p className="text-xs text-white/50 truncate">
            {currentTrack?.titleHindi || 'Soul-soothing music'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={playPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-400 text-white"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={playNext}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Full player view
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 backdrop-blur-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎵</span>
          <div>
            <h2 className="text-lg font-semibold text-white">Soul-Soothing Music</h2>
            <p className="text-xs text-white/50">आत्मा को शांति देने वाला संगीत</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('playlists')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === 'playlists' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            Playlists
          </button>
          <button
            onClick={() => setView('tracks')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === 'tracks' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            All Tracks
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Player View */}
        {view === 'player' && (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6"
          >
            {/* Album Art / Visualization */}
            <div className="relative mx-auto w-48 h-48 mb-6">
              <motion.div
                className={`w-full h-full rounded-2xl bg-gradient-to-br ${currentTrack ? getCategoryInfo(currentTrack.category).color : 'from-purple-500 to-indigo-600'} flex items-center justify-center`}
                animate={{
                  scale: isPlaying ? [1, 1.02, 1] : 1,
                  boxShadow: isPlaying
                    ? ['0 0 30px rgba(249, 115, 22, 0.3)', '0 0 50px rgba(249, 115, 22, 0.5)', '0 0 30px rgba(249, 115, 22, 0.3)']
                    : '0 0 20px rgba(249, 115, 22, 0.2)'
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-7xl">{currentTrack ? getCategoryInfo(currentTrack.category).icon : '🎵'}</span>
              </motion.div>

              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-orange-500 rounded-full"
                      animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                      transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-1">
                {currentTrack?.title || 'Select a track to play'}
              </h3>
              <p className="text-white/60">
                {currentTrack?.titleHindi || 'संगीत चुनें'}
              </p>
              {currentPlaylist && (
                <p className="text-xs text-orange-400 mt-2">
                  Playing from: {currentPlaylist.name}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div
                className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={playPrev}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30 transition-all"
              >
                {isLoading ? (
                  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={playNext}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-center gap-3">
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
              />
              <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-center text-red-400 text-sm mt-4">{error}</p>
            )}
          </motion.div>
        )}

        {/* Playlists View */}
        {view === 'playlists' && (
          <motion.div
            key="playlists"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 max-h-[400px] overflow-y-auto"
          >
            <div className="grid gap-3">
              {PLAYLISTS.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelect(playlist)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    currentPlaylist?.id === playlist.id
                      ? 'bg-orange-500/20 border-orange-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryInfo(playlist.category).color} flex items-center justify-center text-2xl`}>
                    {getCategoryInfo(playlist.category).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">{playlist.name}</h4>
                    <p className="text-xs text-white/50">{playlist.nameHindi}</p>
                    <p className="text-xs text-white/40 mt-1">{playlist.tracks.length} tracks • {playlist.duration} min</p>
                  </div>
                  {currentPlaylist?.id === playlist.id && isPlaying && (
                    <div className="flex items-end gap-0.5 h-4">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-orange-500 rounded-full"
                          animate={{ height: [3, 10, 3] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Tracks View */}
        {view === 'tracks' && (
          <motion.div
            key="tracks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORY_INFO).slice(0, -1).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as MusicCategory)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    selectedCategory === key ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.name}</span>
                </button>
              ))}
            </div>

            {/* Tracks list */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {ALL_TRACKS.filter(track => selectedCategory === 'all' || track.category === selectedCategory).map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleTrackSelect(track)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    currentTrack?.id === track.id
                      ? 'bg-orange-500/20 border-orange-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryInfo(track.category).color} flex items-center justify-center text-xl`}>
                    {getCategoryInfo(track.category).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">{track.title}</h4>
                    <p className="text-xs text-white/50 truncate">{track.titleHindi}</p>
                  </div>
                  <span className="text-xs text-white/40">{formatDuration(track.duration)}</span>
                  {currentTrack?.id === track.id && isPlaying && (
                    <div className="flex items-end gap-0.5 h-3">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-orange-500 rounded-full"
                          animate={{ height: [2, 8, 2] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Now Playing Mini Bar (when in other views) */}
      {view !== 'player' && currentTrack && (
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setView('player')}
            className="w-full flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryInfo(currentTrack.category).color} flex items-center justify-center text-xl`}>
              {getCategoryInfo(currentTrack.category).icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
              <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </button>
        </div>
      )}
    </div>
  )
}

export default SoulSoothingMusicPlayer
