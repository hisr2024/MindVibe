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
    console.error('[Persistence] Failed to get state:', error)
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
    console.error('[Persistence] Failed to persist state:', error)
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
    console.error('[Persistence] Failed to get tracks:', error)
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
    console.error('[Persistence] Failed to get track:', error)
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
    console.error('[Persistence] Failed to save track:', error)
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
    console.error('[Persistence] Failed to delete track:', error)
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
    console.error('[Persistence] Failed to save audio blob:', error)
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
    console.error('[Persistence] Failed to get audio blob:', error)
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
    console.error('[Persistence] Failed to delete audio blob:', error)
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
    console.error('[Persistence] Failed to get playlists:', error)
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
    console.error('[Persistence] Failed to get playlist:', error)
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
    console.error('[Persistence] Failed to save playlist:', error)
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
    console.error('[Persistence] Failed to delete playlist:', error)
  }
}

// ============ Upload Helper ============

/**
 * Upload and save a track from a File
 */
export async function uploadTrack(file: File): Promise<Track | null> {
  try {
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Extract basic metadata from filename
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension

    // Save the blob
    await saveAudioBlob(id, file)

    // Create metadata
    const meta: UploadedTrackMeta = {
      id,
      title,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: Date.now(),
    }

    // Get duration (optional, may fail)
    try {
      const audio = new Audio()
      const blobUrl = URL.createObjectURL(file)
      audio.src = blobUrl

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          meta.duration = audio.duration
          URL.revokeObjectURL(blobUrl)
          resolve()
        })
        audio.addEventListener('error', () => {
          URL.revokeObjectURL(blobUrl)
          reject(new Error('Failed to load audio metadata'))
        })
      })
    } catch {
      // Duration extraction failed, continue without it
    }

    // Save metadata
    await saveTrackMeta(meta)

    // Return as Track
    const track: Track = {
      id: meta.id,
      title: meta.title,
      artist: meta.artist,
      sourceType: 'upload',
      src: `indexeddb://${id}`, // Special protocol for our uploaded tracks
      duration: meta.duration,
      createdAt: meta.createdAt,
    }

    return track
  } catch (error) {
    console.error('[Persistence] Failed to upload track:', error)
    return null
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
