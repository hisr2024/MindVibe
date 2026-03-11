/**
 * useGitaVR — React hook for the Bhagavad Gita VR Experience
 *
 * Wraps the Zustand store and API service into a high-level interface.
 * Handles asking Krishna questions, navigating chapters/verses,
 * and coordinating audio + animation playback.
 */

'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { askKrishna, getChapterIntro } from '@/services/gitaVRService'
import { useLipSync } from '@/app/gita-vr/components/characters/LipSyncController'
import { useGestureAnimator } from '@/app/gita-vr/components/characters/GestureAnimator'
import type { KrishnaResponse } from '@/types/gitaVR.types'

export function useGitaVR() {
  // Use getState() for imperative writes inside callbacks to avoid
  // subscribing to the entire store (which causes infinite re-render loops
  // when setSceneState triggers a state change → store ref changes →
  // useCallback recreates → useEffect re-fires → setSceneState again).
  const getStore = useCallback(() => useGitaVRStore.getState(), [])

  const { playAudio, stopAudio } = useLipSync()
  const { playGestures, resetGestures } = useGestureAnimator()
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup all pending timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      fn()
      // Remove from active timers
      timersRef.current = timersRef.current.filter((t) => t !== id)
    }, ms)
    timersRef.current.push(id)
    return id
  }, [])

  const handleKrishnaResponse = useCallback(async (response: KrishnaResponse) => {
    const s = getStore()
    s.setKrishnaResponse(response)
    s.setSubtitleText(response.answer ?? '')
    s.setArjunaState('listening')

    // Show verse if referenced
    if (response.verse_reference) {
      s.setShowVerseDisplay(true)
    }

    // Play gesture animations
    if (response.gestures && response.gestures.length > 0) {
      playGestures(response.gestures)
    }

    // Play audio if available
    if (response.audio_url) {
      s.setKrishnaState('speaking')
      await playAudio(response.audio_url, response.answer)
    } else {
      // No audio — show text for a duration based on word count
      s.setKrishnaState('speaking')
      const wordCount = (response.answer ?? '').split(' ').length
      const displayMs = Math.max(3000, wordCount * 300)

      await new Promise<void>((resolve) => {
        scheduleTimeout(() => {
          getStore().setKrishnaState('idle')
          getStore().setSubtitleText('')
          resolve()
        }, displayMs)
      })
    }
  }, [getStore, playAudio, playGestures, scheduleTimeout])

  const askQuestion = useCallback(async (question: string) => {
    const s = getStore()
    if (s.isProcessingQuestion) return

    s.setIsProcessingQuestion(true)
    s.setSceneState('question')
    s.setKrishnaState('listening')
    s.setArjunaState('listening')
    s.setUserQuestion(question)

    try {
      const response = await askKrishna(
        question,
        getStore().currentChapter,
        'en'
      )

      getStore().setSceneState('teaching')
      await handleKrishnaResponse(response)
    } catch {
      // Graceful fallback — show compassionate message
      getStore().setSubtitleText(
        'My dear friend, the connection to divine wisdom is momentarily interrupted. Please ask again.'
      )
      getStore().setKrishnaState('blessing')

      scheduleTimeout(() => {
        getStore().setSubtitleText('')
        getStore().setKrishnaState('idle')
      }, 4000)
    } finally {
      getStore().setIsProcessingQuestion(false)
    }
  }, [getStore, handleKrishnaResponse, scheduleTimeout])

  const navigateToChapter = useCallback(async (chapter: number) => {
    const s = getStore()
    s.setCurrentChapter(chapter)
    s.setCurrentVerse(1)
    resetGestures()
    stopAudio()

    if (chapter === 11) {
      s.setSceneState('vishwaroop')
      s.setArjunaState('enlightened')
    } else {
      s.setSceneState('teaching')
      s.setArjunaState('listening')
    }

    try {
      const intro = await getChapterIntro(chapter)
      getStore().setSubtitleText(intro.intro_text ?? '')
      getStore().setKrishnaState('speaking')

      // Display for a readable duration
      const wordCount = (intro.intro_text ?? '').split(' ').length
      scheduleTimeout(() => {
        getStore().setSubtitleText('')
        getStore().setKrishnaState('idle')
      }, Math.max(4000, wordCount * 300))
    } catch {
      // Silently fail — chapter navigation still works
    }
  }, [getStore, resetGestures, stopAudio, scheduleTimeout])

  const startExperience = useCallback(() => {
    const s = getStore()
    s.setSceneState('intro')
    s.setAssetsLoaded(true)
    s.setArjunaState('distressed')

    // After intro delay, transition to teaching
    scheduleTimeout(() => {
      const st = getStore()
      st.setSceneState('teaching')
      st.setArjunaState('listening')
      st.setSubtitleText(
        'Welcome, dear seeker. I am Krishna, your eternal friend. Ask me anything, and I shall guide you with the wisdom of the Bhagavad Gita.'
      )
      st.setKrishnaState('speaking')

      scheduleTimeout(() => {
        getStore().setSubtitleText('')
        getStore().setKrishnaState('idle')
      }, 6000)
    }, 3000)
  }, [getStore, scheduleTimeout])

  return {
    askQuestion,
    navigateToChapter,
    startExperience,
  }
}
