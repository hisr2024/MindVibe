'use client'

/**
 * KIAAN Vibe - My Uploads
 *
 * Upload and manage your own audio files.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Music2,
  Play,
  Trash2,
  Clock,
  FileAudio,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  getAllUploadedTracks,
  uploadTrack,
  deleteUploadedTrack,
  getAudioBlobUrl,
} from '@/lib/kiaan-vibe/persistence'
import { formatDuration } from '@/lib/kiaan-vibe/meditation-library'
import type { Track, UploadedTrackMeta } from '@/lib/kiaan-vibe/types'

// Accepted audio formats
const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm']
const ACCEPTED_EXTENSIONS = '.mp3,.m4a,.wav,.ogg,.webm'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function UploadsPage() {
  const { currentTrack, play, setQueue } = usePlayerStore()
  const [uploads, setUploads] = useState<UploadedTrackMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadUploads = async () => {
    setLoading(true)
    try {
      const tracks = await getAllUploadedTracks()
      // Sort by most recent first
      tracks.sort((a, b) => b.createdAt - a.createdAt)
      setUploads(tracks)
    } catch (err) {
      console.error('Failed to load uploads:', err)
      setError('Failed to load uploads')
    }
    setLoading(false)
  }

  // Load uploads on mount
  useEffect(() => {
    loadUploads()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)

    try {
      for (const file of files) {
        // Validate file type
        if (!ACCEPTED_FORMATS.includes(file.type)) {
          setError(`Unsupported format: ${file.name}. Use MP3, M4A, WAV, or OGG.`)
          continue
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setError(`File too large: ${file.name}. Maximum size is 100MB.`)
          continue
        }

        // Upload the file
        const track = await uploadTrack(file)
        if (track) {
          setUploads((prev) => [
            {
              id: track.id,
              title: track.title,
              artist: track.artist,
              duration: track.duration,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              createdAt: track.createdAt,
            },
            ...prev,
          ])
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Upload failed. Please try again.')
    }

    setUploading(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this track? This cannot be undone.')) return

    try {
      await deleteUploadedTrack(id)
      setUploads((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Failed to delete track')
    }
  }

  const handlePlay = async (upload: UploadedTrackMeta, index: number) => {
    try {
      // Get blob URL for playback
      const blobUrl = await getAudioBlobUrl(upload.id)
      if (!blobUrl) {
        setError('Failed to load audio file')
        return
      }

      const track: Track = {
        id: upload.id,
        title: upload.title,
        artist: upload.artist,
        sourceType: 'upload',
        src: blobUrl,
        duration: upload.duration,
        createdAt: upload.createdAt,
      }

      // Create tracks array from all uploads
      const allTracks: Track[] = await Promise.all(
        uploads.map(async (u) => {
          const url = await getAudioBlobUrl(u.id)
          return {
            id: u.id,
            title: u.title,
            artist: u.artist,
            sourceType: 'upload' as const,
            src: url || '',
            duration: u.duration,
            createdAt: u.createdAt,
          }
        })
      )

      setQueue(allTracks.filter((t) => t.src), index)
      play(track)
    } catch (err) {
      console.error('Playback failed:', err)
      setError('Failed to play track')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Uploads</h1>
          <p className="text-white/60">{uploads.length} tracks</p>
        </div>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative p-8 rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200 text-center
          ${uploading
            ? 'border-orange-500/50 bg-orange-500/10'
            : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
            <p className="text-white">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white/60" />
            </div>
            <p className="text-white font-medium mb-1">Upload Audio Files</p>
            <p className="text-sm text-white/50">
              MP3, M4A, WAV, OGG up to 100MB
            </p>
            <button className="mt-4 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 transition-colors">
              <Plus className="w-4 h-4 inline mr-1" />
              Choose Files
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploads list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : uploads.length > 0 ? (
        <div className="space-y-2">
          {uploads.map((upload, index) => {
            const isPlaying = currentTrack?.id === upload.id

            return (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl transition-all
                  ${isPlaying
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }
                `}
              >
                {/* Play button */}
                <button
                  onClick={() => handlePlay(upload, index)}
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                    ${isPlaying
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }
                    transition-colors
                  `}
                >
                  {isPlaying ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-white rounded-full"
                          animate={{ height: [4, 12, 4] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isPlaying ? 'text-orange-400' : 'text-white'}`}>
                    {upload.title}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      {formatFileSize(upload.fileSize)}
                    </span>
                    {upload.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(upload.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(upload.id)}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                  aria-label="Delete track"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No uploads yet</p>
          <p className="text-sm text-white/30 mt-1">
            Upload your favorite meditation tracks
          </p>
        </div>
      )}
    </div>
  )
}
