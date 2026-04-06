'use client'

/**
 * useKIAANJournalInsight — fetch KIAAN weekly reflection + prompts.
 *
 * Both endpoints return metadata-only insights; they never touch decrypted
 * content. See app/api/journal/kiaan-insight/route.ts.
 */

import { useCallback, useEffect, useState } from 'react'

export interface JournalInsight {
  reflection: string
  dominantMood: string | null
  entryCount: number
  moodPattern: Array<{ mood: string; percentage: number }>
  verse?: { reference: string; sanskrit: string; translation: string; theme: string }
}

export interface JournalPrompt {
  id: string
  text: string
  suggestedMood?: string
}

export function useKIAANJournalInsight() {
  const [insight, setInsight] = useState<JournalInsight | null>(null)
  const [prompts, setPrompts] = useState<JournalPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (forceRegenerate = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const [insightRes, promptsRes] = await Promise.all([
        fetch(`/api/journal/kiaan-insight${forceRegenerate ? '?force=1' : ''}`),
        fetch('/api/journal/prompts'),
      ])
      if (!insightRes.ok) throw new Error(`insight ${insightRes.status}`)
      if (!promptsRes.ok) throw new Error(`prompts ${promptsRes.status}`)
      const insightData = await insightRes.json()
      const promptsData = await promptsRes.json()
      setInsight(insightData)
      setPrompts(Array.isArray(promptsData?.prompts) ? promptsData.prompts : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    insight,
    prompts,
    isLoading,
    error,
    refresh: () => load(true),
  }
}
