'use client'

/**
 * KIAAN Vibe Library — Mobile-native browse & play experience.
 * Sacred design system with category filtering, track grid, and featured section.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Music2, Upload, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { GitaBanner } from '@/components/mobile/vibe/GitaBanner'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import {
  getAllTracks,
  getTracksByCategory,
  searchTracks,
  formatDuration,
} from '@/lib/kiaan-vibe/meditation-library'
import {
  getAllUploadedTracks,
  uploadTrack,
  deleteUploadedTrack,
  audioFileLooksValid,
  ACCEPTED_AUDIO_ACCEPT_ATTR,
  MAX_UPLOAD_SIZE,
} from '@/lib/kiaan-vibe/persistence'
import type { MeditationCategory, Track, UploadedTrackMeta } from '@/lib/kiaan-vibe/types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all',       label: 'All',       icon: '\u2726' },
  { id: 'uploads',   label: 'My Music',  icon: '\u266b' },
  { id: 'gita',      label: 'Gita',      icon: '\u2638\uFE0F' },
  { id: 'mantra',    label: 'Mantra',    icon: '\uD83D\uDD49' },
  { id: 'ambient',   label: 'Ambient',   icon: '\u25CE' },
  { id: 'nature',    label: 'Nature',    icon: '\u27E1' },
  { id: 'breath',    label: 'Breath',    icon: '\u2601' },
  { id: 'focus',     label: 'Focus',     icon: '\u25C8' },
  { id: 'sleep',     label: 'Sleep',     icon: '\u263D' },
  { id: 'spiritual', label: 'Spiritual', icon: '\u2727' },
]

/** Convert uploaded track metadata into a player-ready Track. */
function uploadToTrack(u: UploadedTrackMeta): Track {
  return {
    id: u.id,
    title: u.title,
    artist: u.artist || 'My Music',
    sourceType: 'upload',
    src: `indexeddb://${u.id}`,
    duration: u.duration,
    createdAt: u.createdAt,
  }
}

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
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploads, setUploads] = useState<UploadedTrackMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { triggerHaptic } = useHapticFeedback()
  const { currentTrack, isPlaying, play, setQueue, gitaLang, setGitaLang } = usePlayerStore()

  // Load uploaded tracks once on mount and refresh whenever an upload finishes.
  useEffect(() => {
    let cancelled = false
    getAllUploadedTracks()
      .then((list) => {
        if (cancelled) return
        list.sort((a, b) => b.createdAt - a.createdAt)
        setUploads(list)
      })
      .catch(() => { /* surfaces via empty list */ })
    return () => { cancelled = true }
  }, [])

  const uploadedTracks = useMemo<Track[]>(
    () => uploads.map(uploadToTrack),
    [uploads],
  )

  const filteredTracks = useMemo<Track[]>(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const fromUploads = uploadedTracks.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q),
      )
      return [...fromUploads, ...searchTracks(searchQuery)]
    }
    if (selectedCategory === 'uploads') {
      return uploadedTracks
    }
    if (selectedCategory === 'all') {
      // Surface the user's own music FIRST so they always see it.
      return [...uploadedTracks, ...getAllTracks()]
    }
    return getTracksByCategory(selectedCategory as MeditationCategory)
  }, [selectedCategory, searchQuery, uploadedTracks])

  const allTracks = useMemo<Track[]>(
    () => [...uploadedTracks, ...getAllTracks()],
    [uploadedTracks],
  )

  // Featured tracks = first 6 from all
  const featuredTracks = useMemo(() => allTracks.slice(0, 6), [allTracks])

  const handlePlayTrack = useCallback((track: Track, trackList: Track[]) => {
    triggerHaptic('medium')
    const index = trackList.findIndex(t => t.id === track.id)
    setQueue(trackList, index >= 0 ? index : 0)
    play(track)
  }, [triggerHaptic, setQueue, play])

  const handleUploadClick = useCallback(() => {
    triggerHaptic('selection')
    setUploadError(null)
    fileInputRef.current?.click()
  }, [triggerHaptic])

  const handleFilesSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadError(null)
    let lastError: string | null = null

    for (const file of Array.from(files)) {
      try {
        if (!audioFileLooksValid(file)) {
          lastError = `${file.name} isn't a recognised audio format.`
          continue
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          lastError = `${file.name} is too large (max ${(MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(0)}MB).`
          continue
        }
        const track = await uploadTrack(file)
        setUploads((prev) => [
          {
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'audio/unknown',
            createdAt: track.createdAt,
          },
          ...prev,
        ])
      } catch (err) {
        lastError = err instanceof Error ? err.message : `Upload failed: ${file.name}`
      }
    }

    if (lastError) setUploadError(lastError)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    triggerHaptic('medium')
  }, [triggerHaptic])

  const handleDeleteUpload = useCallback(async (id: string) => {
    triggerHaptic('selection')
    try {
      await deleteUploadedTrack(id)
      setUploads((prev) => prev.filter((u) => u.id !== id))
    } catch {
      setUploadError('Could not delete this track. Please try again.')
    }
  }, [triggerHaptic])

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
              {cat.id === 'uploads' && uploads.length > 0 && (
                <span
                  className="ml-1 text-[10px] px-1.5 rounded-full font-[family-name:var(--font-ui)]"
                  style={{
                    background: selectedCategory === cat.id ? 'rgba(5,7,20,0.25)' : 'rgba(212,160,23,0.18)',
                    color: selectedCategory === cat.id ? '#050714' : '#D4A017',
                  }}
                >
                  {uploads.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Hidden file input for native picker — accepts the broadest set of audio formats */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_AUDIO_ACCEPT_ATTR}
          multiple
          onChange={handleFilesSelected}
          className="hidden"
          aria-hidden="true"
        />

        {/* Upload card — always visible so users can drop their own music in */}
        <div className="mb-4">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all"
            style={{
              background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
              border: '1px dashed rgba(212,160,23,0.4)',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,160,23,0.12)' }}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-[#D4A017] animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-[#D4A017]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#EDE8DC] font-[family-name:var(--font-ui)]" style={{ fontWeight: 500 }}>
                {uploading ? 'Uploading…' : 'Upload your own music'}
              </p>
              <p className="text-[11px] text-[#6B6355] truncate font-[family-name:var(--font-ui)]">
                MP3 · M4A · AAC · WAV · OGG · Opus · FLAC · WebM · up to {(MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(0)}MB
              </p>
            </div>
            {!uploading && (
              <Plus className="w-5 h-5 text-[#D4A017] flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Upload error toast */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              key="upload-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(220,38,38,0.10)',
                border: '1px solid rgba(220,38,38,0.25)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-[12px] text-red-300 font-[family-name:var(--font-ui)]">
                {uploadError}
              </p>
              <button
                onClick={() => setUploadError(null)}
                className="text-red-300/80 hover:text-red-300 px-1"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gita Banner (shown when 'all' or 'gita' selected, no search) */}
        {(selectedCategory === 'all' || selectedCategory === 'gita') && !searchQuery && (
          <>
            <GitaBanner onPress={() => router.push('/m/kiaan-vibe/chapters')} />
            {/* Gita language selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4 scrollbar-none">
              <span className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase flex-shrink-0 font-[family-name:var(--font-ui)]">
                Gita Language
              </span>
              {Object.values(SUPPORTED_LANGUAGES).map(lang => {
                const isSelected = lang.code === gitaLang
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { setGitaLang(lang.code); triggerHaptic('selection') }}
                    aria-pressed={isSelected}
                    className="flex-shrink-0 h-7 px-3 rounded-full text-[11px] transition-all font-[family-name:var(--font-ui)]"
                    style={{
                      color: isSelected ? '#D4A017' : '#B8AE98',
                      backgroundColor: isSelected ? 'rgba(212,160,23,0.15)' : 'transparent',
                      border: isSelected
                        ? '1px solid rgba(212,160,23,0.5)'
                        : '1px solid rgba(212,160,23,0.15)',
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    {lang.nativeName}
                  </button>
                )
              })}
            </div>
          </>
        )}

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

        {/* Uploads list — selectable category with delete control per row */}
        {selectedCategory === 'uploads' && !searchQuery && (
          uploads.length > 0 ? (
            <div className="space-y-2">
              {uploads.map((u) => {
                const track = uploadToTrack(u)
                const isCurrent = currentTrack?.id === u.id
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{
                      background: isCurrent
                        ? 'linear-gradient(145deg, rgba(212,160,23,0.18), rgba(212,160,23,0.06))'
                        : 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                      border: isCurrent
                        ? '1px solid rgba(212,160,23,0.4)'
                        : '1px solid rgba(212,160,23,0.08)',
                    }}
                  >
                    <button
                      onClick={() => handlePlayTrack(track, uploadedTracks)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(212,160,23,0.12)' }}
                      >
                        <Music2 className="w-5 h-5 text-[#D4A017]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#EDE8DC] truncate font-[family-name:var(--font-ui)]" style={{ fontWeight: 500 }}>
                          {u.title}
                        </p>
                        <p className="text-[11px] text-[#6B6355] truncate font-[family-name:var(--font-ui)]">
                          {u.duration ? formatDuration(u.duration) : 'Unknown duration'}
                          {' · '}
                          {(u.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteUpload(u.id)}
                      className="p-2 text-[#6B6355] hover:text-red-400 transition-colors"
                      aria-label={`Delete ${u.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music2 className="w-10 h-10 text-[#D4A017]/40 mx-auto mb-3" />
              <p className="text-sm text-[#B8AE98] font-[family-name:var(--font-divine)]">
                No uploads yet
              </p>
              <p className="text-xs text-[#6B6355] mt-1 font-[family-name:var(--font-ui)]">
                Tap “Upload your own music” above to add tracks
              </p>
            </div>
          )
        )}

        {/* Standard 2-column track grid for everything except gita and uploads */}
        {selectedCategory !== 'gita' && selectedCategory !== 'uploads' && (
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
        )}

        {/* Gita category: show browse CTA instead of track grid */}
        {selectedCategory === 'gita' && !searchQuery && (
          <div className="text-center py-8">
            <p className="text-sm text-[#B8AE98] font-[family-name:var(--font-scripture)] italic mb-3">
              Explore the complete Bhagavad Gita above
            </p>
            <button
              onClick={() => router.push('/m/kiaan-vibe/chapters')}
              className="px-6 py-2.5 rounded-full text-[13px] font-[family-name:var(--font-ui)]"
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.1))',
                border: '1px solid rgba(212,160,23,0.3)',
                color: '#D4A017',
                fontWeight: 500,
              }}
            >
              Browse All 18 Chapters {'\u2192'}
            </button>
          </div>
        )}

        {/* Empty state — only for non-gita / non-uploads views */}
        {selectedCategory !== 'gita' && selectedCategory !== 'uploads' && filteredTracks.length === 0 && (
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
