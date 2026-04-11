'use client'

/**
 * useKarmaReset — State + API orchestration hook for the Karma Reset flow.
 * Wraps service calls with loading/error states for each phase transition.
 */

import { useState, useCallback } from 'react'
import type {
  KarmaResetContext,
  KarmaReflectionQuestion,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
} from '../types'
import {
  getReflectionQuestion,
  getWisdom,
  completeSession,
} from '../services/karmaResetService'
import {
  getPersonalisationContext,
  buildContextString,
} from '@/lib/user-context/getPersonalisationContext'

export function useKarmaReset() {
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReflectionQuestion = useCallback(async (
    context: KarmaResetContext,
    questionIndex: 0 | 1 | 2
  ): Promise<KarmaReflectionQuestion | null> => {
    setIsLoadingQuestion(true)
    setError(null)
    try {
      const question = await getReflectionQuestion(context, questionIndex)
      return question
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to get reflection question'
      setError(msg)
      return null
    } finally {
      setIsLoadingQuestion(false)
    }
  }, [])

  const fetchWisdom = useCallback(async (
    context: KarmaResetContext,
    reflections: KarmaReflectionAnswer[]
  ): Promise<KarmaWisdomResponse | null> => {
    setIsLoadingWisdom(true)
    setError(null)
    try {
      // Enrich context with user's spiritual journey state (best-effort)
      let enrichedContext = context
      try {
        const ctx = await getPersonalisationContext()
        const enrichment = buildContextString(ctx)
        if (enrichment) {
          enrichedContext = {
            ...context,
            description: `${context.description} [Spiritual context: ${enrichment}]`,
          }
        }
      } catch {
        // Personalisation is best-effort — never block the sacred flow
      }
      const wisdom = await getWisdom(enrichedContext, reflections)
      return wisdom
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sakha is momentarily unavailable'
      setError(msg)
      return null
    } finally {
      setIsLoadingWisdom(false)
    }
  }, [])

  const finishSession = useCallback(async (
    sessionId: string,
    sankalpaSigned: boolean,
    actionDharmaCommitted: string[]
  ) => {
    setIsCompleting(true)
    try {
      const result = await completeSession(sessionId, sankalpaSigned, actionDharmaCommitted)
      return result
    } catch {
      // Ceremony plays even if API fails — return fallback
      return { success: true, xpAwarded: 25, streakCount: 1, message: 'Your karma has been met with dharma.' }
    } finally {
      setIsCompleting(false)
    }
  }, [])

  return {
    fetchReflectionQuestion,
    fetchWisdom,
    finishSession,
    isLoadingQuestion,
    isLoadingWisdom,
    isCompleting,
    error,
    clearError: () => setError(null),
  }
}
