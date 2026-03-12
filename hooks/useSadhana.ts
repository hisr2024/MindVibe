/**
 * useSadhana — Hook combining Zustand store with sadhana service calls.
 * Provides a clean API for the SadhanaExperience component.
 */

'use client'

import { useCallback } from 'react'
import { useSadhanaStore } from '@/stores/sadhanaStore'
import { composeSadhana, completeSadhana } from '@/services/sadhanaService'
import type { SadhanaMood } from '@/types/sadhana.types'

export function useSadhana() {
  const store = useSadhanaStore()

  /** Select mood and compose the practice */
  const selectMood = useCallback(async (mood: SadhanaMood) => {
    store.setMood(mood)
    store.setIsComposing(true)

    try {
      const hour = new Date().getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

      const composition = await composeSadhana({ mood, timeOfDay })
      store.setComposition(composition)

      /* Auto-advance to breathwork after a brief pause for greeting */
      setTimeout(() => {
        store.nextPhase()
      }, 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compose practice'
      store.setError(message)

      /* Use fallback composition so the experience still works */
      store.setComposition(getFallbackComposition(mood))
      setTimeout(() => {
        store.nextPhase()
      }, 2000)
    }
  }, [store])

  /** Complete the practice and record results */
  const complete = useCallback(async () => {
    if (!store.mood || !store.composition) return

    store.setPhase('complete')

    try {
      const result = await completeSadhana({
        mood: store.mood,
        reflectionText: store.reflectionText || undefined,
        intentionText: store.intentionText || undefined,
        durationSeconds: store.startedAt ? Math.round((Date.now() - store.startedAt) / 1000) : 300,
        verseId: store.composition.verse.verseId,
      })
      return result
    } catch {
      /* If completion API fails, still show the completion screen */
      return {
        success: true,
        xpAwarded: 25,
        streakCount: 1,
        message: 'Your practice is sealed. Walk in dharma today.',
      }
    }
  }, [store])

  return {
    ...store,
    selectMood,
    complete,
  }
}

/** Fallback composition when API is unavailable */
function getFallbackComposition(mood: SadhanaMood) {
  const isHeavy = mood === 'heavy' || mood === 'wounded'
  const isEnergetic = mood === 'radiant' || mood === 'grateful'

  return {
    greeting: isHeavy
      ? 'Even in difficulty, the soul finds its way to light. Let us walk together today.'
      : 'The divine light within you shines brightly. Let us honor it with practice.',
    breathingPattern: isHeavy
      ? { name: 'Calming Breath', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, cycles: 4, description: 'Soothing 4-7-8 pattern to calm the nervous system' }
      : isEnergetic
        ? { name: 'Energizing Breath', inhale: 4, holdIn: 2, exhale: 4, holdOut: 2, cycles: 6, description: 'Quick pattern to channel your radiant energy' }
        : { name: 'Box Breathing', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, cycles: 5, description: 'Balanced pattern for centered awareness' },
    verse: {
      chapter: 2,
      verse: 47,
      verseId: '2.47',
      english: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.',
      transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
      modernInsight: 'Focus on what you can do, not what might happen.',
      personalInterpretation: 'This verse reminds us that our power lies in action, not in controlling outcomes. Today, do what is right and release attachment to results.',
    },
    reflectionPrompt: {
      prompt: 'What outcome are you holding too tightly today?',
      guidingQuestion: 'Can you find peace in the action itself, regardless of the result?',
    },
    dharmaIntention: {
      suggestion: 'Perform one act of kindness today without expecting anything in return.',
      category: 'Nishkama Karma',
    },
    durationEstimateMinutes: 8,
    timeOfDay: new Date().getHours() < 12 ? 'morning' as const : new Date().getHours() < 17 ? 'afternoon' as const : 'evening' as const,
  }
}
