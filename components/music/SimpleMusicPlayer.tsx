'use client'

/**
 * Simple Music Player
 *
 * ॐ
 *
 * Clean, minimal music player with user upload support.
 * Designed for background meditation music.
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
  Trash2,
  List,
  X,
  Plus,
  Clock
} from 'lucide-react'
import musicEngine, {
  type MusicTrack,
  type PlayerState
} from '@/utils/audio/SimpleMusicEngine'

export function SimpleMusicPlayer() {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
    queueIndex: 0
  })
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [isMuted, setIsMuted] = useState(false)
  const [previewVolume, setPreviewVolume] = useState(0.7)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subscribe to state changes
  useEffect(() => {
    musicEngine.setOnStateChange(setState)
  }, [])

  // Play track
  const handlePlay = useCallback((track: MusicTrack) => {
    const allTracks = musicEngine.getAllTracks()
    const index = allTracks.findIndex(t => t.id === track.id)
    musicEngine.setQueue(allTracks, index >= 0 ? index : 0)
  }, [])

  // Toggle play/pause
  const handleToggle = useCallback(() => {
    musicEngine.toggle()
  }, [])

  // Next/Previous
  const handleNext = useCallback(() => musicEngine.playNext(), [])
  const handlePrev = useCallback(() => musicEngine.playPrevious(), [])

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    musicEngine.seek(parseFloat(e.target.value))
  }, [])

  // Volume
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Delete user track
  const handleDelete = useCallback((trackId: string) => {
    musicEngine.removeUserTrack(trackId)
  }, [])

  const presetTracks = musicEngine.getPresetTracks()
  const userTracks = musicEngine.getUserTracks()
  const allTracks = activeTab === 'my' ? userTracks : musicEngine.getAllTracks()

  return (
    <div className="rounded-2xl bg-[#0c0c10] border border-white/10 overflow-hidden">
      {/* Now Playing */}
      <div className="p-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 flex items-center justify-center flex-shrink-0">
            {state.isPlaying ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 20, 8] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-violet-400 rounded-full"
                  />
                ))}
              </div>
            ) : (
              <Music className="w-7 h-7 text-violet-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {state.currentTrack ? (
              <>
                <h2 className="text-lg font-semibold text-white truncate">
                  {state.currentTrack.title}
                </h2>
                <p className="text-sm text-white/40">
                  {state.currentTrack.artist || 'Unknown Artist'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white/40">No track selected</h2>
                <p className="text-sm text-white/30">Choose from library below</p>
              </>
            )}
          </div>

          {/* Library toggle */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`p-2.5 rounded-xl transition-colors ${
              showLibrary
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={state.duration ? state.currentTime / state.duration : 0}
              onChange={handleSeek}
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
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handlePrev}
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!state.currentTrack}
            className={`p-4 rounded-full transition-all ${
              state.currentTrack
                ? state.isPlaying
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {state.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>

          <button
            onClick={handleNext}
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
          <div className="w-28 relative h-1 bg-white/10 rounded-full">
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

      {/* Library Panel */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                All Music
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'text-violet-400 border-b-2 border-violet-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                My Music ({userTracks.length})
              </button>
            </div>

            {/* Upload Button (My Music tab) */}
            {activeTab === 'my' && (
              <div className="p-4 border-b border-white/5">
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
                  className="w-full p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-2 text-white/40 hover:text-violet-400"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload Music</span>
                </button>
                <p className="text-xs text-white/30 text-center mt-2">
                  Supports MP3, WAV, OGG, M4A
                </p>
              </div>
            )}

            {/* Track List */}
            <div className="max-h-72 overflow-y-auto">
              {allTracks.length === 0 ? (
                <div className="p-8 text-center">
                  <Music className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">
                    {activeTab === 'my' ? 'No uploaded music yet' : 'No tracks available'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {allTracks.map((track) => (
                    <motion.button
                      key={track.id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => handlePlay(track)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        state.currentTrack?.id === track.id
                          ? 'bg-violet-500/15'
                          : ''
                      }`}
                    >
                      {/* Play indicator / Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                          <Music className="w-4 h-4 text-white/40" />
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
                          {track.artist || (track.source === 'user' ? 'My Music' : 'Unknown')}
                        </p>
                      </div>

                      {/* Duration & Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">
                          {musicEngine.formatTime(track.duration)}
                        </span>
                        {track.source === 'user' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(track.id)
                            }}
                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background indicator */}
      {state.isPlaying && !showLibrary && (
        <div className="px-6 py-3 border-t border-white/5 bg-violet-500/5">
          <p className="text-xs text-violet-400 text-center">
            Playing in background
          </p>
        </div>
      )}
    </div>
  )
}

export default SimpleMusicPlayer
