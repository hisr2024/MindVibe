/**
 * useMobileJourneys — Mobile journey state orchestration hook.
 *
 * Wraps journeyEngineService calls and manages loading / error states
 * so the JourneysScreen orchestrator stays lean.
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
  }, [isAuthenticated])

  const loadTemplates = useCallback(async () => {
    try {
      const result = await journeyEngineService.listTemplates({ limit: 50 })
      if (result?.templates) {
        setTemplates(result.templates)
      }
    } catch {
      // Templates are non-critical — silent fail, keep existing
    }
  }, [])

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
