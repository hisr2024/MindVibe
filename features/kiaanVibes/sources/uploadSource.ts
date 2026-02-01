import type { Track } from '../types'

export const MAX_UPLOAD_SIZE_MB = 50
const DB_NAME = 'kiaan-vibes-audio'
const STORE_NAME = 'uploads'
const DB_VERSION = 1

const ACCEPTED_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a'
])

interface UploadRecord {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  lastModified: number
  blob: Blob
}

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = operation(store)

    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error)

    transaction.oncomplete = () => db.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const validateUpload = (file: File): string | null => {
  const sizeMb = file.size / (1024 * 1024)
  if (!ACCEPTED_TYPES.has(file.type)) {
    return 'Unsupported file type. Please upload an MP3, WAV, or M4A file.'
  }
  if (sizeMb > MAX_UPLOAD_SIZE_MB) {
    return `File is too large. Max size is ${MAX_UPLOAD_SIZE_MB}MB.`
  }
  return null
}

export const saveUpload = async (file: File, userId?: string): Promise<Track> => {
  // TODO: Replace IndexedDB storage with backend persistence when available.
  const record: UploadRecord = {
    id: `upload-${Date.now()}-${file.name}`,
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    lastModified: file.lastModified,
    blob: file
  }

  await withStore('readwrite', (store) => store.add(record))

  return {
    id: record.id,
    title: record.name,
    subtitle: 'My Uploads',
    fileBlob: record.blob,
    sourceType: 'upload',
    meta: {
      userId: userId ?? 'local',
      uploadedAt: record.uploadedAt,
      size: record.size,
      fileType: record.type
    }
  }
}

export const loadUploads = async (): Promise<Track[]> => {
  // TODO: Replace IndexedDB storage with backend persistence when available.
  const records = await withStore<UploadRecord[]>('readonly', (store) => store.getAll())
  return records.map((record) => ({
    id: record.id,
    title: record.name,
    subtitle: 'My Uploads',
    fileBlob: record.blob,
    sourceType: 'upload',
    meta: {
      uploadedAt: record.uploadedAt,
      size: record.size,
      fileType: record.type
    }
  }))
}

export const deleteUpload = async (trackId: string): Promise<void> => {
  await withStore('readwrite', (store) => store.delete(trackId))
}
