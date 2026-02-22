'use client'

/**
 * KIAAN Vibe - Playlists
 *
 * Create and manage playlists.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListMusic,
  Plus,
  Play,
  Trash2,
  Edit2,
  Music2,
  X,
  Check,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  getAllPlaylists,
  savePlaylist,
  deletePlaylist as deletePlaylistFromDB,
} from '@/lib/kiaan-vibe/persistence'
import { getAllTracks } from '@/lib/kiaan-vibe/meditation-library'
import type { Playlist, Track } from '@/lib/kiaan-vibe/types'

export default function PlaylistsPage() {
  const { play, setQueue } = usePlayerStore()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])

  const allTracks = getAllTracks()

  const loadPlaylists = async () => {
    setLoading(true)
    try {
      const data = await getAllPlaylists()
      data.sort((a, b) => b.updatedAt - a.updatedAt)
      setPlaylists(data)
    } catch (err) {
      console.error('Failed to load playlists:', err)
    }
    setLoading(false)
  }

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists()
  }, [])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName.trim(),
      trackIds: selectedTrackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await savePlaylist(playlist)
      setPlaylists((prev) => [playlist, ...prev])
      setShowCreateModal(false)
      setNewPlaylistName('')
      setSelectedTrackIds([])
    } catch (err) {
      console.error('Failed to create playlist:', err)
    }
  }

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist || !newPlaylistName.trim()) return

    const updated: Playlist = {
      ...editingPlaylist,
      name: newPlaylistName.trim(),
      trackIds: selectedTrackIds,
      updatedAt: Date.now(),
    }

    try {
      await savePlaylist(updated)
      setPlaylists((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      )
      setEditingPlaylist(null)
      setNewPlaylistName('')
      setSelectedTrackIds([])
    } catch (err) {
      console.error('Failed to update playlist:', err)
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Delete this playlist?')) return

    try {
      await deletePlaylistFromDB(id)
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  const handlePlayPlaylist = (playlist: Playlist) => {
    const tracks = playlist.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined)

    if (tracks.length > 0) {
      setQueue(tracks, 0)
      play(tracks[0])
    }
  }

  const openEditModal = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setNewPlaylistName(playlist.name)
    setSelectedTrackIds(playlist.trackIds)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingPlaylist(null)
    setNewPlaylistName('')
    setSelectedTrackIds([])
  }

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Playlists</h1>
          <p className="text-white/60">{playlists.length} playlists</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {/* Playlists list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {playlists.map((playlist, index) => {
            const trackCount = playlist.trackIds.length
            const tracks = playlist.trackIds
              .slice(0, 4)
              .map((id) => allTracks.find((t) => t.id === id))
              .filter(Boolean)

            return (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {/* Playlist header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {playlist.name}
                    </h3>
                    <p className="text-sm text-white/50">
                      {trackCount} track{trackCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(playlist)}
                      className="p-2 text-white/50 hover:text-white transition-colors"
                      aria-label="Edit playlist"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="p-2 text-white/50 hover:text-red-400 transition-colors"
                      aria-label="Delete playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Track preview */}
                <div className="flex gap-1 mb-4">
                  {tracks.length > 0 ? (
                    tracks.map((track, i) => (
                      <div
                        key={track?.id || i}
                        className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center"
                      >
                        <Music2 className="w-5 h-5 text-white/40" />
                      </div>
                    ))
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  {trackCount > 4 && (
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-xs text-white/50">+{trackCount - 4}</span>
                    </div>
                  )}
                </div>

                {/* Play button */}
                <button
                  onClick={() => handlePlayPlaylist(playlist)}
                  disabled={trackCount === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/20 text-orange-400 font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Play
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ListMusic className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No playlists yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 transition-colors"
          >
            Create your first playlist
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingPlaylist) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] rounded-2xl bg-[#1a1a1f] border border-white/10 overflow-hidden flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  {editingPlaylist ? 'Edit Playlist' : 'New Playlist'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                  aria-label="Close playlist dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Name input */}
                <div>
                  <label htmlFor="playlist-name" className="block text-sm text-white/60 mb-2">
                    Playlist Name
                  </label>
                  <input
                    id="playlist-name"
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Playlist"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                {/* Track selection */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Select Tracks ({selectedTrackIds.length} selected)
                  </label>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {allTracks.map((track) => {
                      const isSelected = selectedTrackIds.includes(track.id)
                      return (
                        <button
                          key={track.id}
                          onClick={() => toggleTrackSelection(track.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                            ${isSelected
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                            }
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded flex items-center justify-center border
                              ${isSelected
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-white/30'
                              }
                            `}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{track.title}</p>
                            <p className="text-xs text-white/50 truncate">
                              {track.artist || 'KIAAN Vibe'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
                >
                  {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
