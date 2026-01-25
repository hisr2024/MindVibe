'use client'

/**
 * Spiritual Vibes - Global Floating Music Player
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A soul-soothing music player accessible from anywhere in the app.
 * Features:
 * - Preloaded spiritual & nature tracks
 * - User upload support
 * - Keyboard shortcut (Ctrl/Cmd + M)
 * - Beautiful floating interface
 * - Categories: Nature, Meditation, Sacred, Sleep
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Upload,
  ChevronUp,
  ChevronDown,
  Leaf,
  Moon,
  Heart,
  Sparkles,
  Wind,
  Headphones
} from 'lucide-react'
import musicEngine, {
  type MusicTrack,
  type PlayerState,
  type SoundType
} from '@/utils/audio/SimpleMusicEngine'

// Track categories for filtering
const TRACK_CATEGORIES = {
  all: { name: 'All Vibes', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
  nature: { name: 'Nature Sounds', icon: Leaf, color: 'from-green-500 to-emerald-500' },
  meditation: { name: 'Meditation', icon: Heart, color: 'from-pink-500 to-rose-500' },
  sacred: { name: 'Sacred Sounds', icon: Wind, color: 'from-amber-500 to-orange-500' },
  sleep: { name: 'Sleep & Rest', icon: Moon, color: 'from-indigo-500 to-blue-500' },
  healing: { name: 'Healing', icon: Headphones, color: 'from-teal-500 to-cyan-500' }
} as const

type Category = keyof typeof TRACK_CATEGORIES

// Map sound types to categories
const SOUND_TYPE_CATEGORIES: Record<SoundType, Category> = {
  rain: 'nature',
  ocean: 'nature',
  forest: 'nature',
  river: 'nature',
  crickets: 'nature',
  thunder: 'nature',
  meditation: 'meditation',
  relaxation: 'meditation',
  healing_528: 'healing',
  spiritual: 'meditation',
  singing_bowls: 'healing',
  chakra: 'healing',
  zen: 'meditation',
  sleep: 'sleep',
  night_rain: 'sleep',
  ocean_night: 'sleep',
  flute: 'meditation',
  piano: 'meditation',
  sitar: 'meditation',
  om: 'sacred',
  temple_bells: 'sacred',
  gayatri: 'sacred',
  vedic: 'sacred',
  alpha: 'healing',
  theta: 'healing'
}

// Categorize preset tracks
function getCategoryForTrack(track: MusicTrack): Category {
  if (track.soundType && SOUND_TYPE_CATEGORIES[track.soundType]) {
    return SOUND_TYPE_CATEGORIES[track.soundType]
  }
  return 'meditation'
}

interface SpiritualVibesPlayerProps {
  position?: 'bottom-left' | 'bottom-right'
  className?: string
}

export function SpiritualVibesPlayer({
  position = 'bottom-left',
  className = ''
}: SpiritualVibesPlayerProps) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
    queueIndex: 0
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [isMuted, setIsMuted] = useState(false)
  const [previewVolume, setPreviewVolume] = useState(0.7)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subscribe to state changes
  useEffect(() => {
    musicEngine.setOnStateChange(setState)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + M to toggle player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
      // Space to play/pause when expanded
      if (e.key === ' ' && isExpanded && state.currentTrack) {
        e.preventDefault()
        musicEngine.toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, state.currentTrack])

  // Filter tracks by category
  const getFilteredTracks = useCallback(() => {
    const allTracks = musicEngine.getAllTracks()
    if (activeCategory === 'all') return allTracks
    return allTracks.filter(track => {
      // Note: User tracks only show in 'all' category (handled above)
      if (track.source === 'user') return false
      return getCategoryForTrack(track) === activeCategory
    })
  }, [activeCategory])

  // Play track
  const handlePlay = useCallback((track: MusicTrack) => {
    const tracks = getFilteredTracks()
    const index = tracks.findIndex(t => t.id === track.id)
    musicEngine.setQueue(tracks, index >= 0 ? index : 0)
  }, [getFilteredTracks])

  // Toggle play/pause
  const handleToggle = useCallback(() => {
    if (!state.currentTrack) {
      // Start playing first track
      const tracks = getFilteredTracks()
      if (tracks.length > 0) {
        musicEngine.setQueue(tracks, 0)
      }
    } else {
      musicEngine.toggle()
    }
  }, [state.currentTrack, getFilteredTracks])

  // Volume control
  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    musicEngine.setVolume(vol)
    setPreviewVolume(vol)
    setIsMuted(vol === 0)
  }, [])

  const handleMute = useCallback(() => {
    if (isMuted) {
      musicEngine.setVolume(previewVolume || 0.7)
      setIsMuted(false)
    } else {
      musicEngine.setVolume(0)
      setIsMuted(true)
    }
  }, [isMuted, previewVolume])

  // File upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      await musicEngine.addUserTrack(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Position classes
  const positionClasses = position === 'bottom-left'
    ? 'bottom-24 left-4 md:bottom-4'
    : 'bottom-24 right-4 md:bottom-4'

  const filteredTracks = getFilteredTracks()
  const userTracks = musicEngine.getUserTracks()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed ${positionClasses} z-40 ${className}`}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 md:w-96 rounded-2xl bg-[#0a0a0f]/98 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Spiritual Vibes</h2>
                    <p className="text-xs text-white/50">Soul-soothing music</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 hidden md:inline">Ctrl+M</span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Now Playing */}
            <div className="p-4">
              <div className="flex items-center gap-4">
                {/* Album Art / Animation */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  state.isPlaying
                    ? 'bg-gradient-to-br from-violet-600/40 to-purple-600/30'
                    : 'bg-white/5'
                }`}>
                  {state.isPlaying ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 24, 8] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1.5 bg-gradient-to-t from-violet-400 to-purple-300 rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Music className="w-8 h-8 text-white/30" />
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
                        {state.currentTrack.artist || 'Spiritual Vibes'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-white/40">No track playing</h3>
                      <p className="text-sm text-white/30">Select from library below</p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={state.duration ? state.currentTime / state.duration : 0}
                    onChange={(e) => musicEngine.seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/30">
                  <span>{musicEngine.formatTime(state.currentTime)}</span>
                  <span>{musicEngine.formatTime(state.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => musicEngine.playPrevious()}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggle}
                  className={`p-4 rounded-full transition-all ${
                    state.isPlaying
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/40'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {state.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </motion.button>

                <button
                  onClick={() => musicEngine.playNext()}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={handleMute} className="p-1.5 text-white/40 hover:text-white/60">
                  {isMuted || state.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="w-32 relative h-1 bg-white/10 rounded-full">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : state.volume}
                    onChange={handleVolume}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="h-full bg-white/40 rounded-full"
                    style={{ width: `${(isMuted ? 0 : state.volume) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/30 w-8">{Math.round((isMuted ? 0 : state.volume) * 100)}%</span>
              </div>
            </div>

            {/* Library Toggle */}
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="w-full p-3 border-t border-white/5 flex items-center justify-center gap-2 text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              {showLibrary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-sm">{showLibrary ? 'Hide' : 'Show'} Library ({filteredTracks.length} tracks)</span>
            </button>

            {/* Library Panel */}
            <AnimatePresence>
              {showLibrary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  {/* Category Tabs */}
                  <div className="p-2 flex gap-1 overflow-x-auto scrollbar-hide">
                    {Object.entries(TRACK_CATEGORIES).map(([key, { name, icon: Icon, color }]) => (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key as Category)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                          activeCategory === key
                            ? `bg-gradient-to-r ${color} text-white`
                            : 'bg-white/5 text-white/50 hover:text-white/70'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {name}
                      </button>
                    ))}
                  </div>

                  {/* Upload Button */}
                  <div className="px-3 pb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-2.5 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-2 text-white/40 hover:text-violet-400"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-xs font-medium">Upload Your Music</span>
                    </button>
                  </div>

                  {/* Track List */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredTracks.length === 0 ? (
                      <div className="p-6 text-center">
                        <Music className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-sm text-white/30">No tracks in this category</p>
                      </div>
                    ) : (
                      <div className="px-2 pb-2">
                        {filteredTracks.map((track) => {
                          const category = track.source === 'user' ? 'all' : getCategoryForTrack(track)
                          const catInfo = TRACK_CATEGORIES[category]
                          const Icon = catInfo.icon

                          return (
                            <motion.button
                              key={track.id}
                              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                              onClick={() => handlePlay(track)}
                              className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                                state.currentTrack?.id === track.id ? 'bg-violet-500/15' : ''
                              }`}
                            >
                              {/* Icon */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                state.currentTrack?.id === track.id && state.isPlaying
                                  ? 'bg-violet-500/30'
                                  : 'bg-white/5'
                              }`}>
                                {state.currentTrack?.id === track.id && state.isPlaying ? (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3].map(i => (
                                      <motion.div
                                        key={i}
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-0.5 bg-violet-400 rounded-full"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Icon className="w-4 h-4 text-white/40" />
                                )}
                              </div>

                              {/* Track info */}
                              <div className="flex-1 min-w-0 text-left">
                                <p className={`text-sm font-medium truncate ${
                                  state.currentTrack?.id === track.id ? 'text-violet-400' : 'text-white'
                                }`}>
                                  {track.title}
                                </p>
                                <p className="text-xs text-white/40 truncate">
                                  {track.artist || (track.source === 'user' ? 'My Upload' : 'Spiritual Vibes')}
                                </p>
                              </div>

                              {/* Duration */}
                              <span className="text-xs text-white/30">
                                {musicEngine.formatTime(track.duration)}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Collapsed Mini Player */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 p-2 pr-4 rounded-full bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-xl hover:border-violet-500/30 transition-all">
              {/* Animated equalizer when playing */}
              {state.isPlaying && (
                <div className="flex items-center gap-0.5 px-2">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-4 rounded-full bg-gradient-to-t from-violet-500 to-purple-400"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              )}

              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle()
                }}
                className={`p-2.5 rounded-full transition-all ${
                  state.isPlaying
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Track info (compact) */}
              <div className="flex flex-col min-w-0 max-w-32">
                <span className="text-xs font-medium text-white truncate">
                  {state.currentTrack?.title || 'Spiritual Vibes'}
                </span>
                <span className="text-[10px] text-white/40">
                  {state.isPlaying ? 'Playing' : 'Tap to open'}
                </span>
              </div>

              {/* Expand indicator */}
              <ChevronUp className="w-4 h-4 text-white/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SpiritualVibesPlayer
