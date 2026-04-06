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
        }
        return
      }

      if (result?.templates) {
        setTemplates(result.templates)
      }
    } catch (err) {
      // FIX BUG 3: Surface template errors when we have no cached templates
      console.warn(
        '[Journeys] Failed to load templates:',
        err instanceof Error ? err.message : err,
      )
      if (templates.length === 0) {
        setError('Unable to load journey templates. Pull down to retry.')
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
