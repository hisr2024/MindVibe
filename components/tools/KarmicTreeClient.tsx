'use client'

import { useEffect, useState } from 'react'
import { KarmaPlant, type KarmaPlantStage } from './KarmaPlant'

export interface KarmicTreeProgress {
  level: number
  xp: number
  next_level_xp: number
  progress_percent: number
  tree_stage: string
  activity: {
    moods: number
    journals: number
    chats: number
    streak: number
  }
}

export interface KarmicTreeClientProps {
  /** Full API endpoint URL to fetch tree progress (default: /api/analytics/karmic_tree) */
  apiEndpoint?: string
  /** Optional className */
  className?: string
  /** Callback when data loads */
  onLoad?: (data: KarmicTreeProgress) => void
  /** Callback on error */
  onError?: (error: string) => void
}

/** Default mocked fallback data */
const fallbackProgress: KarmicTreeProgress = {
  level: 1,
  xp: 24,
  next_level_xp: 240,
  progress_percent: 10,
  tree_stage: 'seedling',
  activity: { moods: 3, journals: 2, chats: 4, streak: 1 },
}

/**
 * Map API tree_stage to KarmaPlant stage
 */
function mapTreeStage(stage: string): KarmaPlantStage {
  switch (stage.toLowerCase()) {
    case 'seed':
      return 'seed'
    case 'seedling':
      return 'seedling'
    case 'sapling':
      return 'sapling'
    case 'branching':
      return 'branching'
    case 'canopy':
      return 'canopy'
    default:
      return 'seedling'
  }
}

/**
 * KarmicTreeClient component for fetching and displaying Karmic Tree progress.
 *
 * Features:
 * - Read-only API fetch to /api/analytics/karmic_tree
 * - Graceful fallback to mocked data
 * - KarmaPlant visualization
 * - Progress display
 * - Accessibility attributes
 */
export function KarmicTreeClient({
  apiEndpoint,
  className = '',
  onLoad,
  onError,
}: KarmicTreeClientProps) {
  const [data, setData] = useState<KarmicTreeProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Build the full API URL - apiEndpoint overrides everything if provided
  const apiUrl = apiEndpoint
    ? apiEndpoint
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/karmic_tree`

  useEffect(() => {
    const controller = new AbortController()

    const loadProgress = async () => {
      setLoading(true)
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error('API request failed')
        }

        const payload = (await response.json()) as KarmicTreeProgress
        setData(payload)
        setError(null)
        onLoad?.(payload)
      } catch (err) {
        const errorMessage = 'Live data unavailable. Showing demo progress.'
        console.warn('KarmicTreeClient fetch failed:', err)
        setError(errorMessage)
        setData(fallbackProgress)
        onError?.(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()

    return () => controller.abort()
  }, [apiUrl, onLoad, onError])

  const progress = data ?? fallbackProgress
  const plantStage = mapTreeStage(progress.tree_stage)

  return (
    <div
      className={`rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)] ${className}`}
      role="region"
      aria-label="Karmic Tree Progress"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-orange-50">Your Karmic Tree</h3>
          <p className="text-xs text-orange-100/70">Level {progress.level}</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-orange-50">
            {progress.xp} XP
          </span>
          <p className="text-xs text-orange-100/60">
            Next: {progress.next_level_xp} XP
          </p>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="flex justify-center my-6">
        {loading ? (
          <div className="h-32 w-32 animate-pulse rounded-full bg-orange-500/20" />
        ) : (
          <KarmaPlant stage={plantStage} size={128} animate={plantStage === 'canopy'} />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-orange-100/70 mb-1">
          <span>Progress</span>
          <span>{progress.progress_percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progress.progress_percent)}%` }}
            role="progressbar"
            aria-valuenow={progress.progress_percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-orange-500/10 p-2">
          <div className="text-lg font-semibold text-orange-50">
            {progress.activity.journals}
          </div>
          <div className="text-xs text-orange-100/60">Journals</div>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-2">
          <div className="text-lg font-semibold text-amber-50">
            {progress.activity.moods}
          </div>
          <div className="text-xs text-amber-100/60">Moods</div>
        </div>
        <div className="rounded-lg bg-orange-400/10 p-2">
          <div className="text-lg font-semibold text-orange-50">
            {progress.activity.chats}
          </div>
          <div className="text-xs text-orange-100/60">Chats</div>
        </div>
      </div>

      {/* Stage Label */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-50 capitalize">
          🌱 {progress.tree_stage}
        </span>
      </div>

      {/* Warning/Info for fallback data */}
      {error && (
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-400/30 p-2 text-xs text-amber-100/80 text-center">
          {error}
        </div>
      )}
    </div>
  )
}

export default KarmicTreeClient
