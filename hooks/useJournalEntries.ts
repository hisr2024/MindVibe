'use client'

/**
 * useJournalEntries — fetch + search + filter for the Browse and Calendar
 * tabs. Consumes the real backend `JournalEntryOut` response shape from
 * `GET /api/journal/entries` (see backend/routes/journal.py::list_entries
 * and backend/schemas/journal.py::JournalEntryOut).
 *
 * Titles are decrypted eagerly (they are short) so the list view can
 * render them. Content stays as an opaque EncryptedPayload until the
 * entry detail view decrypts it.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { decryptPayload, type EncryptedPayload } from '@/lib/crypto/journal'

export interface JournalEntrySummary {
  id: string
  title: string
  mood: string
  tags: string[]
  createdAt: string
  updatedAt: string
  /** Opaque encrypted content payload. Do NOT render in list views. */
  encryptedContent: EncryptedPayload | null
}

interface RawEntry {
  id?: string
  encrypted_title?: EncryptedPayload | Record<string, unknown> | null
  encrypted_content?: EncryptedPayload | Record<string, unknown> | null
  moods?: string[] | null
  tags?: string[] | null
  client_updated_at?: string
  created_at?: string
  updated_at?: string
}

function coercePayload(value: unknown): EncryptedPayload | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.ciphertext !== 'string' || typeof v.iv !== 'string') return null
  return {
    ciphertext: v.ciphertext,
    iv: v.iv,
    salt: typeof v.salt === 'string' ? v.salt : '',
    auth_tag: typeof v.auth_tag === 'string' ? v.auth_tag : '',
    algorithm: typeof v.algorithm === 'string' ? v.algorithm : 'AES-GCM',
    key_version: typeof v.key_version === 'string' ? v.key_version : undefined,
  }
}

async function parseEntry(raw: RawEntry): Promise<JournalEntrySummary | null> {
  const id = raw.id
  if (!id) return null
  const encryptedTitle = coercePayload(raw.encrypted_title)
  const encryptedContent = coercePayload(raw.encrypted_content)
  const title = encryptedTitle ? await decryptPayload(encryptedTitle) : ''
  const createdAt = raw.created_at ?? raw.client_updated_at ?? new Date().toISOString()
  const updatedAt = raw.updated_at ?? createdAt
  const mood = Array.isArray(raw.moods) && raw.moods.length > 0 ? raw.moods[0] : ''
  return {
    id,
    title: title || 'Untitled reflection',
    mood,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    encryptedContent,
    createdAt,
    updatedAt,
  }
}

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntrySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [moodFilter, setMoodFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/journal/entries?limit=50')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: RawEntry[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { entries?: unknown })?.entries)
          ? ((data as { entries: RawEntry[] }).entries)
          : []
      const parsed = (await Promise.all(list.map(parseEntry))).filter(
        (e): e is JournalEntrySummary => e !== null
      )
      parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setEntries(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries')
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (moodFilter !== 'all' && e.mood !== moodFilter) return false
      if (!q) return true
      if (e.title.toLowerCase().includes(q)) return true
      if (e.tags.some((t) => t.toLowerCase().includes(q))) return true
      return false
    })
  }, [entries, search, moodFilter])

  return {
    entries,
    filtered,
    isLoading,
    error,
    reload: load,
    search,
    setSearch,
    moodFilter,
    setMoodFilter,
  }
}
