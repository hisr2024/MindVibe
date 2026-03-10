/**
 * useGitaVR — React hook for the Bhagavad Gita VR Experience
 *
 * Wraps the Zustand store and API service into a high-level interface.
 * Handles asking Krishna questions, navigating chapters/verses,
 * and coordinating audio + animation playback.
 */

'use client'

import { useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { askKrishna, getChapterIntro } from '@/services/gitaVRService'
import { useLipSync } from '@/app/gita-vr/components/characters/LipSyncController'
import { useGestureAnimator } from '@/app/gita-vr/components/characters/GestureAnimator'
import type { KrishnaResponse } from '@/types/gitaVR.types'

export function useGitaVR() {
  const store = useGitaVRStore()
  const { playAudio, stopAudio } = useLipSync()
  const { playGestures, resetGestures } = useGestureAnimator()

  const handleKrishnaResponse = useCallback(async (response: KrishnaResponse) => {
    store.setKrishnaResponse(response)
    store.setSubtitleText(response.answer)
    store.setArjunaState('listening')

    // Show verse if referenced
    if (response.verse_reference) {
      store.setShowVerseDisplay(true)
    }

    // Play gesture animations
    if (response.gestures.length > 0) {
      playGestures(response.gestures)
    }

    // Play audio if available
    if (response.audio_url) {
      store.setKrishnaState('speaking')
      await playAudio(response.audio_url, response.answer)
    } else {
      // No audio — show text for a duration based on word count
      store.setKrishnaState('speaking')
      const wordCount = response.answer.split(' ').length
      const displayMs = Math.max(3000, wordCount * 300)

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          store.setKrishnaState('idle')
          store.setSubtitleText('')
          resolve()
        }, displayMs)
      })
    }
  }, [store, playAudio, playGestures])

  const askQuestion = useCallback(async (question: string) => {
    if (store.isProcessingQuestion) return

    store.setIsProcessingQuestion(true)
    store.setSceneState('question')
    store.setKrishnaState('listening')
    store.setArjunaState('listening')
    store.setUserQuestion(question)

    try {
      const response = await askKrishna(
        question,
        store.currentChapter,
        'en'
      )

      store.setSceneState('teaching')
      await handleKrishnaResponse(response)
    } catch (error) {
      // Graceful fallback — show compassionate message
      store.setSubtitleText(
        'My dear friend, the connection to divine wisdom is momentarily interrupted. Please ask again.'
      )
      store.setKrishnaState('blessing')

      setTimeout(() => {
        store.setSubtitleText('')
        store.setKrishnaState('idle')
      }, 4000)
    } finally {
      store.setIsProcessingQuestion(false)
    }
  }, [store, handleKrishnaResponse])

  const navigateToChapter = useCallback(async (chapter: number) => {
    store.setCurrentChapter(chapter)
    store.setCurrentVerse(1)
    resetGestures()
    stopAudio()

    if (chapter === 11) {
      store.setSceneState('vishwaroop')
      store.setArjunaState('enlightened')
    } else {
      store.setSceneState('teaching')
      store.setArjunaState('listening')
    }

    try {
      const intro = await getChapterIntro(chapter)
      store.setSubtitleText(intro.intro_text)
      store.setKrishnaState('speaking')

      // Display for a readable duration
      const wordCount = intro.intro_text.split(' ').length
      setTimeout(() => {
        store.setSubtitleText('')
        store.setKrishnaState('idle')
      }, Math.max(4000, wordCount * 300))
    } catch {
      // Silently fail — chapter navigation still works
    }
  }, [store, resetGestures, stopAudio])

  const startExperience = useCallback(() => {
    store.setSceneState('intro')
    store.setAssetsLoaded(true)
    store.setArjunaState('distressed')

    // After intro delay, transition to teaching
    setTimeout(() => {
      store.setSceneState('teaching')
      store.setArjunaState('listening')
      store.setSubtitleText(
        'Welcome, dear seeker. I am Krishna, your eternal friend. Ask me anything, and I shall guide you with the wisdom of the Bhagavad Gita.'
      )
      store.setKrishnaState('speaking')

      setTimeout(() => {
        store.setSubtitleText('')
        store.setKrishnaState('idle')
      }, 6000)
    }, 3000)
  }, [store])

  return {
    ...store,
    askQuestion,
    navigateToChapter,
    startExperience,
  }
}
