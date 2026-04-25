/**
 * KIAAN Vibe Music Player - IndexedDB Persistence
 *
 * Stores:
 * - Player state (volume, position, current track, etc.)
 * - Uploaded audio files as blobs
 * - Track metadata
 * - Playlists
 */

import type {
  PersistedPlayerState,
  UploadedTrackMeta,
  Playlist,
  Track,
} from './types'

const DB_NAME = 'kiaan-vibe-player'
const DB_VERSION = 1

// Store names
const STORES = {
  PLAYER_STATE: 'player-state',
  TRACKS: 'tracks',
  AUDIO_BLOBS: 'audio-blobs',
  PLAYLISTS: 'playlists',
} as const

// Singleton database connection
let db: IDBDatabase | null = null

/**
 * Open or create the database
 */
async function openDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Player state store
      if (!database.objectStoreNames.contains(STORES.PLAYER_STATE)) {
        database.createObjectStore(STORES.PLAYER_STATE)
      }

      // Tracks metadata store
      if (!database.objectStoreNames.contains(STORES.TRACKS)) {
        const trackStore = database.createObjectStore(STORES.TRACKS, {
          keyPath: 'id',
        })
        trackStore.createIndex('createdAt', 'createdAt', { unique: false })
        trackStore.createIndex('title', 'title', { unique: false })
      }

      // Audio blobs store
      if (!database.objectStoreNames.contains(STORES.AUDIO_BLOBS)) {
        database.createObjectStore(STORES.AUDIO_BLOBS)
      }

      // Playlists store
      if (!database.objectStoreNames.contains(STORES.PLAYLISTS)) {
        const playlistStore = database.createObjectStore(STORES.PLAYLISTS, {
          keyPath: 'id',
        })
        playlistStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

// ============ Player State ============

const PLAYER_STATE_KEY = 'current'

/**
 * Get persisted player state
 */
export async function getPersistedState(): Promise<PersistedPlayerState | null> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYER_STATE, 'readonly')
      const store = tx.objectStore(STORES.PLAYER_STATE)
      const request = store.get(PLAYER_STATE_KEY)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get state:', error)
    return null
  }
}

/**
 * Persist player state
 */
export async function persistState(state: PersistedPlayerState): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYER_STATE, 'readwrite')
      const store = tx.objectStore(STORES.PLAYER_STATE)
      const request = store.put(state, PLAYER_STATE_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to persist state:', error)
  }
}

// ============ Tracks ============

/**
 * Get all uploaded track metadata
 */
export async function getAllUploadedTracks(): Promise<UploadedTrackMeta[]> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.TRACKS, 'readonly')
      const store = tx.objectStore(STORES.TRACKS)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get tracks:', error)
    return []
  }
}

/**
 * Get track metadata by ID
 */
export async function getTrackMeta(id: string): Promise<UploadedTrackMeta | null> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.TRACKS, 'readonly')
      const store = tx.objectStore(STORES.TRACKS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get track:', error)
    return null
  }
}

/**
 * Save track metadata
 */
export async function saveTrackMeta(meta: UploadedTrackMeta): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.TRACKS, 'readwrite')
      const store = tx.objectStore(STORES.TRACKS)
      const request = store.put(meta)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to save track:', error)
  }
}

/**
 * Delete track metadata
 */
export async function deleteTrackMeta(id: string): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.TRACKS, 'readwrite')
      const store = tx.objectStore(STORES.TRACKS)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to delete track:', error)
  }
}

// ============ Audio Blobs ============

/**
 * Save audio blob
 */
export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.AUDIO_BLOBS, 'readwrite')
      const store = tx.objectStore(STORES.AUDIO_BLOBS)
      const request = store.put(blob, id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to save audio blob:', error)
  }
}

/**
 * Get audio blob
 */
export async function getAudioBlob(id: string): Promise<Blob | null> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.AUDIO_BLOBS, 'readonly')
      const store = tx.objectStore(STORES.AUDIO_BLOBS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get audio blob:', error)
    return null
  }
}

/**
 * Get audio blob as Object URL
 */
export async function getAudioBlobUrl(id: string): Promise<string | null> {
  const blob = await getAudioBlob(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

/**
 * Delete audio blob
 */
export async function deleteAudioBlob(id: string): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.AUDIO_BLOBS, 'readwrite')
      const store = tx.objectStore(STORES.AUDIO_BLOBS)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to delete audio blob:', error)
  }
}

// ============ Playlists ============

/**
 * Get all playlists
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYLISTS, 'readonly')
      const store = tx.objectStore(STORES.PLAYLISTS)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get playlists:', error)
    return []
  }
}

/**
 * Get playlist by ID
 */
export async function getPlaylist(id: string): Promise<Playlist | null> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYLISTS, 'readonly')
      const store = tx.objectStore(STORES.PLAYLISTS)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to get playlist:', error)
    return null
  }
}

/**
 * Save playlist
 */
export async function savePlaylist(playlist: Playlist): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYLISTS, 'readwrite')
      const store = tx.objectStore(STORES.PLAYLISTS)
      const request = store.put(playlist)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to save playlist:', error)
  }
}

/**
 * Delete playlist
 */
export async function deletePlaylist(id: string): Promise<void> {
  try {
    const database = await openDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORES.PLAYLISTS, 'readwrite')
      const store = tx.objectStore(STORES.PLAYLISTS)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('[Persistence] Failed to delete playlist:', error)
  }
}

// ============ Upload Helper ============

/**
 * Comprehensive list of audio MIME types we accept for upload.
 *
 * Browsers report wildly inconsistent MIME types for the same file
 * (e.g. m4a may be `audio/mp4`, `audio/x-m4a`, `audio/aac`, or empty).
 * We accept the union of every common variant. Files with an empty
 * MIME type are accepted too — `audioFileLooksValid()` falls back to
 * extension-based validation.
 */
export const ACCEPTED_AUDIO_MIME_TYPES: readonly string[] = [
  // MP3
  'audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3',
  // MP4 / AAC / M4A
  'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/x-aac', 'audio/aacp',
  // WAV
  'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/x-pn-wav', 'audio/vnd.wave',
  // OGG / Vorbis / Opus
  'audio/ogg', 'audio/oga', 'audio/vorbis', 'audio/opus', 'audio/x-opus',
  // FLAC
  'audio/flac', 'audio/x-flac',
  // WebM
  'audio/webm', 'audio/weba',
  // 3GPP
  'audio/3gpp', 'audio/3gpp2', 'audio/amr', 'audio/amr-wb',
  // MIDI
  'audio/midi', 'audio/x-midi', 'audio/mid',
  // WMA
  'audio/x-ms-wma', 'audio/ms-wma',
  // Generic / catch-all
  'audio/basic', 'audio/L16', 'audio/L24',
]

/**
 * Common audio file extensions we accept (lowercase, with leading dot).
 * Used as a fallback when the browser's MIME detection is unreliable.
 */
export const ACCEPTED_AUDIO_EXTENSIONS: readonly string[] = [
  '.mp3', '.m4a', '.m4b', '.mp4', '.aac', '.aacp',
  '.wav', '.wave',
  '.ogg', '.oga', '.opus',
  '.flac',
  '.webm', '.weba',
  '.3gp', '.3gpp', '.amr',
  '.mid', '.midi',
  '.wma',
  '.aiff', '.aif',
]

/**
 * Comma-separated `accept` attribute string for `<input type="file">`.
 * Includes both MIME types AND extensions (browsers honor either).
 */
export const ACCEPTED_AUDIO_ACCEPT_ATTR: string = [
  ...ACCEPTED_AUDIO_MIME_TYPES,
  ...ACCEPTED_AUDIO_EXTENSIONS,
  'audio/*', // Final wildcard catches anything browser identifies as audio
].join(',')

/**
 * Validate a File looks like an audio file we can play.
 * Accepts if EITHER the MIME type matches OR the extension matches.
 * This is intentionally permissive — the audio element decides at play time
 * whether the codec is supported, and a friendly error is shown if not.
 */
export function audioFileLooksValid(file: File): boolean {
  if (!file) return false
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('audio/')) return true
  if (ACCEPTED_AUDIO_MIME_TYPES.includes(mime)) return true
  const lower = file.name.toLowerCase()
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Maximum upload size — 250MB covers long mantra recordings without abuse. */
export const MAX_UPLOAD_SIZE = 250 * 1024 * 1024

/**
 * Upload and save a track from a File. Accepts the full spectrum of
 * audio formats listed in ACCEPTED_AUDIO_MIME_TYPES / ACCEPTED_AUDIO_EXTENSIONS.
 *
 * Throws (rather than returning null) so callers can surface specific errors
 * like "file too large" or "unsupported format" to the user.
 */
export async function uploadTrack(file: File): Promise<Track> {
  if (!file) {
    throw new Error('No file provided')
  }
  if (file.size === 0) {
    throw new Error(`${file.name} is empty (0 bytes).`)
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    const mb = (MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(0)
    throw new Error(`${file.name} is too large. Maximum ${mb}MB.`)
  }
  if (!audioFileLooksValid(file)) {
    throw new Error(`${file.name} does not look like an audio file.`)
  }

  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // Pretty-print the title from the filename: drop the extension and
  // turn separators into spaces so "om_chant.mp3" → "om chant".
  const fileName = file.name
  const title = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim() || fileName

  // Save the blob first — even if metadata extraction fails, the audio is safe.
  await saveAudioBlob(id, file)

  // Build base metadata
  const meta: UploadedTrackMeta = {
    id,
    title,
    fileName,
    fileSize: file.size,
    mimeType: file.type || 'audio/unknown',
    createdAt: Date.now(),
  }

  // Try to extract duration via a hidden <audio> element.
  // This is best-effort: some formats (e.g. raw WAV without a header,
  // certain WebM variants) don't expose duration, but the file still plays.
  if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio()
      audio.preload = 'metadata'
      const blobUrl = URL.createObjectURL(file)
      audio.src = blobUrl

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(blobUrl)
          audio.removeEventListener('loadedmetadata', onMeta)
          audio.removeEventListener('error', onErr)
        }
        const onMeta = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            meta.duration = audio.duration
          }
          cleanup()
          resolve()
        }
        const onErr = () => { cleanup(); resolve() } // Resolve, not reject
        audio.addEventListener('loadedmetadata', onMeta)
        audio.addEventListener('error', onErr)
        // Hard timeout — never block the upload UI on a slow decoder.
        setTimeout(() => { cleanup(); resolve() }, 4000)
      })
    } catch {
      // Duration extraction failed — continue without it.
    }
  }

  await saveTrackMeta(meta)

  return {
    id: meta.id,
    title: meta.title,
    artist: meta.artist,
    sourceType: 'upload',
    src: `indexeddb://${id}`, // Resolved by the player store at play time.
    duration: meta.duration,
    createdAt: meta.createdAt,
  }
}

/**
 * Delete an uploaded track (metadata + blob)
 */
export async function deleteUploadedTrack(id: string): Promise<void> {
  await deleteTrackMeta(id)
  await deleteAudioBlob(id)
}

const persistence = {
  getPersistedState,
  persistState,
  getAllUploadedTracks,
  getTrackMeta,
  saveTrackMeta,
  deleteTrackMeta,
  saveAudioBlob,
  getAudioBlob,
  getAudioBlobUrl,
  deleteAudioBlob,
  getAllPlaylists,
  getPlaylist,
  savePlaylist,
  deletePlaylist,
  uploadTrack,
  deleteUploadedTrack,
}
export default persistence
