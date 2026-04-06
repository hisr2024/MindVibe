'use client'

/**
 * useJournalEntries — fetch + search + filter for the Browse and Calendar tabs.
 *
 * Entries are stored as metadata + opaque encrypted content. This hook never
 * decrypts; callers that need plaintext (entry detail view) must call
 * decryptContent() themselves.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

export interface JournalEntrySummary {
  id: string
  title: string
  mood: string
  tags: string[]
  wordCount?: number
  createdAt: string
  updatedAt: string
  /** Opaque envelope. Do NOT render in list views. */
  encryptedContent?: string
}

interface RawEntry {
  id?: string
  blob_json?: string
  created_at?: string
  updated_at?: string
  title?: string
  mood?: string
  tags?: string[]
  content?: string
}

function parseEntry(raw: RawEntry): JournalEntrySummary | null {
  let payload: Record<string, unknown> = {}
  if (raw.blob_json) {
    try {
      payload = JSON.parse(raw.blob_json)
    } catch {
      payload = {}
    }
  }
  const title = (payload.title as string) ?? raw.title ?? 'Untitled reflection'
  const mood = (payload.mood as string) ?? raw.mood ?? ''
  const tags = (payload.tags as string[]) ?? raw.tags ?? []
  const encryptedContent = (payload.content as string) ?? raw.content ?? ''
  const createdAt = (payload.created_at as string) ?? raw.created_at ?? new Date().toISOString()
  const updatedAt = (payload.updated_at as string) ?? raw.updated_at ?? createdAt
  const id = (payload.id as string) ?? raw.id ?? `${createdAt}-${title.slice(0, 8)}`
  return { id, title, mood, tags, encryptedContent, createdAt, updatedAt }
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
      const res = await fetch('/api/journal/entries?limit=50&offset=0')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: RawEntry[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.entries)
          ? data.entries
          : Array.isArray(data?.items)
            ? data.items
            : []
      const parsed = list.map(parseEntry).filter(Boolean) as JournalEntrySummary[]
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
