/**
 * useMobileJourneys — Mobile journey state orchestration hook.
 *
 * Wraps journeyEngineService calls and manages loading / error states
 * so the JourneysScreen orchestrator stays lean.
 *
 * Fixed: silent template loading failures, dashboard fallback detection
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  DashboardResponse,
  JourneyTemplate,
  JourneyResponse,
} from '@/types/journeyEngine.types'

// BUG-07: Offline catalog used when /templates fails AND we have no cached
// templates. IDs/slugs MUST match backend/scripts/seed_journey_templates.py
// so a journey started from this fallback resolves once the backend recovers.
const FALLBACK_TEMPLATES: JourneyTemplate[] = [
  { id: 'krodha-beginner-14', slug: 'krodha-beginner-14', title: 'Cooling the Fire',
    description: 'A 14-day practice to transform anger into clarity through Gita wisdom.',
    primary_enemy_tags: ['krodha'], duration_days: 14, difficulty: 2,
    is_featured: true, is_free: true, icon_name: 'flame', color_theme: '#E63946' },
  { id: 'kama-beginner-21', slug: 'kama-beginner-21', title: 'Taming Desire',
    description: 'A 21-day journey to understand and release the wanting mind.',
    primary_enemy_tags: ['kama'], duration_days: 21, difficulty: 2,
    is_featured: true, is_free: true, icon_name: 'heart', color_theme: '#F77F00' },
  { id: 'lobha-beginner-14', slug: 'lobha-beginner-14', title: 'The Open Hand',
    description: 'A 14-day practice of sacred abundance and generous giving.',
    primary_enemy_tags: ['lobha'], duration_days: 14, difficulty: 2,
    is_featured: true, is_free: true, icon_name: 'hand', color_theme: '#FCBF49' },
  { id: 'moha-intermediate-21', slug: 'moha-intermediate-21', title: 'Lifting the Veil',
    description: 'A 21-day journey through the fog of illusion toward clarity.',
    primary_enemy_tags: ['moha'], duration_days: 21, difficulty: 3,
    is_featured: true, is_free: true, icon_name: 'eye', color_theme: '#9D4EDD' },
  { id: 'mada-beginner-14', slug: 'mada-beginner-14', title: 'The Humble Warrior',
    description: 'A 14-day practice of dissolving ego through sacred humility.',
    primary_enemy_tags: ['mada'], duration_days: 14, difficulty: 2,
    is_featured: true, is_free: true, icon_name: 'crown', color_theme: '#06A77D' },
  { id: 'matsara-beginner-14', slug: 'matsara-beginner-14', title: 'Celebrating Others',
    description: 'A 14-day journey from comparison and envy toward sympathetic joy.',
    primary_enemy_tags: ['matsarya'], duration_days: 14, difficulty: 2,
    is_featured: true, is_free: true, icon_name: 'sparkles', color_theme: '#1D8FE1' },
]

interface UseMobileJourneysResult {
  dashboard: DashboardResponse | null
  templates: JourneyTemplate[]
  isLoading: boolean
  error: string | null
  isAuthError: boolean
  loadDashboard: () => Promise<void>
  loadTemplates: () => Promise<void>
  refreshData: () => Promise<void>
  startJourney: (templateId: string) => Promise<JourneyResponse | null>
  startingTemplateId: string | null
}

export function useMobileJourneys(isAuthenticated: boolean): UseMobileJourneysResult {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null)
  const isStartingRef = useRef(false)

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setIsAuthError(true)
      return
    }
    try {
      const data = await journeyEngineService.getDashboard()

      // FIX BUG 4: Detect fallback response from proxy (backend unreachable)
      if (data && '_fallback' in data && (data as { _fallback?: boolean })._fallback) {
        // Backend was unreachable — keep existing dashboard if we have one
        if (!dashboard) {
          setError('Server is waking up. Pull down to retry.')
        }
        return
      }

      setDashboard(data)
      setIsAuthError(false)
      setError(null)
    } catch (err) {
      if (err instanceof JourneyEngineError && err.isAuthError()) {
        setIsAuthError(true)
      } else {
        setError(err instanceof JourneyEngineError ? err.message : 'Failed to load dashboard')
      }
    }
  }, [isAuthenticated, dashboard])

  const loadTemplates = useCallback(async () => {
    try {
      const result = await journeyEngineService.listTemplates({ limit: 50 })

      // FIX BUG 3: Detect fallback response from proxy
      if (result && '_fallback' in result && (result as { _fallback?: boolean })._fallback) {
        if (templates.length === 0) {
          console.warn('[Journeys] Templates endpoint returned fallback — backend may be down')
          // BUG-07: hand the user a usable offline catalog instead of an
          // empty list. IDs match the backend seed, so Begin still works
          // once the backend recovers.
          setTemplates(FALLBACK_TEMPLATES)
          setError(
            'Journey catalog is temporarily unavailable. Showing offline catalog.',
          )
        }
        return
      }

      if (result?.templates) {
        setTemplates(result.templates)
        setError(null)
      }
    } catch (err) {
      // BUG-07: Surface template errors when we have no cached templates so
      // the user sees an actionable message instead of an empty list.
      console.warn(
        '[Journeys] Failed to load templates:',
        err instanceof Error ? err.message : err,
      )
      if (templates.length === 0) {
        // BUG-07: surface fallback so the user can still browse the catalog.
        setTemplates(FALLBACK_TEMPLATES)
        setError(
          'Unable to load journey templates. Showing offline catalog — pull down to retry.',
        )
      }
    }
  }, [templates.length])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([loadDashboard(), loadTemplates()])
    setIsLoading(false)
  }, [loadDashboard, loadTemplates])

  const startJourney = useCallback(async (templateId: string): Promise<JourneyResponse | null> => {
    if (isStartingRef.current) return null
    isStartingRef.current = true
    setStartingTemplateId(templateId)
    setError(null)

    try {
      const journey = await journeyEngineService.startJourney({ template_id: templateId })
      // Refresh dashboard to reflect new journey
      loadDashboard()
      return journey
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        setError(err.message)
      } else {
        setError('Failed to start journey')
      }
      return null
    } finally {
      isStartingRef.current = false
      setStartingTemplateId(null)
    }
  }, [loadDashboard])

  return {
    dashboard,
    templates,
    isLoading,
    error,
    isAuthError,
    loadDashboard,
    loadTemplates,
    refreshData,
    startJourney,
    startingTemplateId,
  }
}
