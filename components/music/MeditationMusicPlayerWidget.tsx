'use client'

/**
 * Meditation Music Player Widget
 *
 * A flawless, robust meditation music player with:
 * - Only Meditation, Soul Soothing, and Mantras categories
 * - User upload support
 * - No audio overlapping - guaranteed single audio source
 * - Responsive play/pause/stop controls
 * - Keyboard shortcut (Ctrl/Cmd + M)
 * - Beautiful, easy-to-use UI
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Upload,
  ChevronUp,
  ChevronDown,
  Heart,
  Leaf,
  Sparkles,
  Trash2,
  Loader2
} from 'lucide-react'
import meditationAudioManager, {
  type MeditationTrack,
  type MeditationCategory,
  type PlayerState
} from '@/utils/audio/MeditationAudioManager'

// Category definitions with icons and colors
const CATEGORIES = {
  meditation: {
    name: 'Meditation',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400'
  },
  soul_soothing: {
    name: 'Soul Soothing',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/20',
    textColor: 'text-pink-400'
  },
  mantras: {
    name: 'Mantras',
    icon: Leaf,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400'
  },
  uploaded: {
    name: 'My Music',
    icon: Music,
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-500/20',
    textColor: 'text-teal-400'
  }
} as const

interface MeditationMusicPlayerWidgetProps {
  position?: 'bottom-left' | 'bottom-right'
  className?: string
}

export function MeditationMusicPlayerWidget({
  position = 'bottom-left',
  className = ''
}: MeditationMusicPlayerWidgetProps) {
  const [playerState, setPlayerState] = useState<PlayerState>(meditationAudioManager.getState())
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeCategory, setActiveCategory] = useState<MeditationCategory | 'all'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subscribe to audio manager state
  useEffect(() => {
    const unsubscribe = meditationAudioManager.subscribe(setPlayerState)
    return () => unsubscribe()
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + M to toggle player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle player visibility
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }

      // Space to play/pause when player is expanded and focused
      if (e.key === ' ' && isExpanded && playerState.currentTrack) {
        // Only if not typing in an input
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault()
          meditationAudioManager.toggle()
        }
      }

      // Escape to close expanded player
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, playerState.currentTrack])

  // Get filtered tracks based on category
  const getFilteredTracks = useCallback((): MeditationTrack[] => {
    const allTracks = meditationAudioManager.getAllTracks()
    if (activeCategory === 'all') return allTracks
    return allTracks.filter(t => t.category === activeCategory)
  }, [activeCategory])

  // Play a specific track
  const handlePlayTrack = useCallback((track: MeditationTrack) => {
    // If clicking on currently playing track, toggle play/pause
    if (playerState.currentTrack?.id === track.id) {
      meditationAudioManager.toggle()
      return
    }

    // Set queue and play
    const tracks = getFilteredTracks()
    const index = tracks.findIndex(t => t.id === track.id)
    meditationAudioManager.setQueue(tracks, index >= 0 ? index : 0)
  }, [getFilteredTracks, playerState.currentTrack])

  // Toggle play/pause
  const handleToggle = useCallback(() => {
    if (!playerState.currentTrack) {
      // Start with first track from current category
      const tracks = getFilteredTracks()
      if (tracks.length > 0) {
        meditationAudioManager.setQueue(tracks, 0)
      }
    } else {
      meditationAudioManager.toggle()
    }
  }, [playerState.currentTrack, getFilteredTracks])

  // Stop playback completely
  const handleStop = useCallback(() => {
    meditationAudioManager.stop()
  }, [])

  // Volume control
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    meditationAudioManager.setVolume(vol)
  }, [])

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    meditationAudioManager.toggleMute()
  }, [])

  // File upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    for (const file of Array.from(files)) {
      await meditationAudioManager.uploadTrack(file)
    }

    setIsUploading(false)
    setActiveCategory('uploaded')

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Delete uploaded track
  const handleDeleteTrack = useCallback((trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    meditationAudioManager.removeUploadedTrack(trackId)
  }, [])

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    meditationAudioManager.seek(parseFloat(e.target.value))
  }, [])

  // Position classes
  const positionClasses = position === 'bottom-left'
    ? 'bottom-20 left-4 md:bottom-4'
    : 'bottom-20 right-4 md:bottom-4'

  const filteredTracks = getFilteredTracks()
  const currentCategory = playerState.currentTrack?.category
    ? CATEGORIES[playerState.currentTrack.category]
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed ${positionClasses} z-50 ${className}`}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          /* ============ EXPANDED PLAYER ============ */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 md:w-96 rounded-2xl bg-[#0a0a0f]/98 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-900/40 to-purple-900/40 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">KIAAN Vibes</h2>
                    <p className="text-xs text-white/50">Soul soothing tracks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 hidden md:inline px-1.5 py-0.5 bg-white/5 rounded">
                    Ctrl+M
                  </span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Minimize player"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Now Playing Section */}
            <div className="p-4">
              <div className="flex items-center gap-4">
                {/* Album Art / Animation */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  playerState.isPlaying
                    ? `bg-gradient-to-br ${currentCategory?.color || 'from-violet-600/40 to-purple-600/30'}`
                    : 'bg-white/5'
                }`}>
                  {playerState.isLoading ? (
                    <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                  ) : playerState.isPlaying ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 24, 8] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1.5 bg-gradient-to-t from-white/70 to-white rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Music className="w-8 h-8 text-white/30" />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  {playerState.currentTrack ? (
                    <>
                      <h3 className="text-base font-semibold text-white truncate">
                        {playerState.currentTrack.title}
                      </h3>
                      <p className="text-sm text-white/40 truncate">
                        {playerState.currentTrack.artist}
                      </p>
                      {currentCategory && (
                        <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs ${currentCategory.bgColor} ${currentCategory.textColor}`}>
                          <currentCategory.icon className="w-3 h-3" />
                          {currentCategory.name}
                        </div>
                      )}
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
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={playerState.duration ? playerState.currentTime / playerState.duration : 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Seek"
                  />
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/40">
                  <span>{meditationAudioManager.formatTime(playerState.currentTime)}</span>
                  <span>{meditationAudioManager.formatTime(playerState.duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {/* Previous */}
                <button
                  onClick={() => meditationAudioManager.playPrevious()}
                  disabled={playerState.queue.length === 0}
                  className="p-2.5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Stop */}
                <button
                  onClick={handleStop}
                  disabled={!playerState.currentTrack}
                  className="p-2.5 text-white/50 hover:text-red-400 disabled:opacity-30 transition-colors"
                  aria-label="Stop"
                >
                  <Square className="w-5 h-5" />
                </button>

                {/* Play/Pause */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggle}
                  className={`p-4 rounded-full transition-all ${
                    playerState.isPlaying
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/40'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
                >
                  {playerState.isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </motion.button>

                {/* Next */}
                <button
                  onClick={() => meditationAudioManager.playNext()}
                  disabled={playerState.queue.length === 0}
                  className="p-2.5 text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={handleMuteToggle}
                  className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
                >
                  {playerState.isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="w-28 relative h-1.5 bg-white/10 rounded-full group">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={playerState.isMuted ? 0 : playerState.volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Volume"
                  />
                  <div
                    className="h-full bg-white/50 rounded-full transition-all"
                    style={{ width: `${(playerState.isMuted ? 0 : playerState.volume) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/30 w-8">
                  {Math.round((playerState.isMuted ? 0 : playerState.volume) * 100)}%
                </span>
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
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  {/* Category Tabs */}
                  <div className="p-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                        activeCategory === 'all'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                          : 'bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      All
                    </button>
                    {(Object.entries(CATEGORIES) as [MeditationCategory, typeof CATEGORIES[MeditationCategory]][]).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                          activeCategory === key
                            ? `bg-gradient-to-r ${cat.color} text-white`
                            : 'bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.name}
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
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full p-2.5 rounded-xl border border-dashed border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2 text-white/40 hover:text-violet-400 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-xs font-medium">Upload Your Audio</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Track List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredTracks.length === 0 ? (
                      <div className="p-8 text-center">
                        <Music className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/30">No tracks in this category</p>
                        {activeCategory === 'uploaded' && (
                          <p className="text-xs text-white/20 mt-1">Upload your audio above</p>
                        )}
                      </div>
                    ) : (
                      <div className="px-2 pb-2 space-y-1">
                        {filteredTracks.map((track) => {
                          const category = CATEGORIES[track.category]
                          const isCurrentTrack = playerState.currentTrack?.id === track.id
                          const isPlaying = isCurrentTrack && playerState.isPlaying

                          return (
                            <motion.button
                              key={track.id}
                              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                              onClick={() => handlePlayTrack(track)}
                              className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                                isCurrentTrack ? 'bg-violet-500/15 ring-1 ring-violet-500/30' : ''
                              }`}
                            >
                              {/* Track Icon */}
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                isPlaying
                                  ? `bg-gradient-to-br ${category.color}`
                                  : isCurrentTrack
                                    ? category.bgColor
                                    : 'bg-white/5'
                              }`}>
                                {isPlaying ? (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3].map(i => (
                                      <motion.div
                                        key={i}
                                        animate={{ height: [4, 14, 4] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-0.5 bg-white rounded-full"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <category.icon className={`w-4 h-4 ${isCurrentTrack ? category.textColor : 'text-white/40'}`} />
                                )}
                              </div>

                              {/* Track Info */}
                              <div className="flex-1 min-w-0 text-left">
                                <p className={`text-sm font-medium truncate ${
                                  isCurrentTrack ? 'text-violet-400' : 'text-white'
                                }`}>
                                  {track.title}
                                </p>
                                <p className="text-xs text-white/40 truncate">
                                  {track.artist}
                                </p>
                              </div>

                              {/* Duration / Delete */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/30">
                                  {meditationAudioManager.formatTime(track.duration)}
                                </span>
                                {track.source === 'uploaded' && (
                                  <button
                                    onClick={(e) => handleDeleteTrack(track.id, e)}
                                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                                    aria-label="Delete track"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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
          /* ============ COLLAPSED MINI PLAYER ============ */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="cursor-pointer"
          >
            <div
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 p-2 pr-4 rounded-full bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-xl hover:border-violet-500/40 transition-all group"
            >
              {/* Playing Animation */}
              {playerState.isPlaying && (
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
                  playerState.isPlaying
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              {/* Stop Button (only when playing) */}
              {playerState.isPlaying && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStop()
                  }}
                  className="p-2 text-white/50 hover:text-red-400 transition-colors"
                  aria-label="Stop"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Track Info */}
              <div className="flex flex-col min-w-0 max-w-36">
                <span className="text-xs font-medium text-white truncate">
                  {playerState.currentTrack?.title || 'KIAAN Vibes'}
                </span>
                <span className="text-[10px] text-white/40">
                  {playerState.isPlaying ? 'Playing' : 'Tap to open'}
                </span>
              </div>

              {/* Expand Indicator */}
              <ChevronUp className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MeditationMusicPlayerWidget
