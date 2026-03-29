'use client'

/**
 * NityaSadhanaScreen — Main state machine orchestrator for the mobile
 * Nitya Sadhana experience. Controls phase transitions with lotus-bloom
 * animations and coordinates all sub-phase components.
 *
 * State machine: arrival → breathwork → verse → reflection → intention → complete
 * Reuses: useSadhana hook, sadhanaStore, sadhanaService (exact desktop parity)
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSadhana } from '@/hooks/useSadhana'
import type { SadhanaPhase } from '@/types/sadhana.types'
import type { CompleteResponse } from '@/types/sadhana.types'

import { MobileSacredCanvas } from './visuals/MobileSacredCanvas'
import { MobileGoldenParticles } from './visuals/MobileGoldenParticles'
import { MobileArrivalPhase } from './phases/MobileArrivalPhase'
import { MobileBreathworkPhase } from './phases/MobileBreathworkPhase'
import { MobileVerseMeditationPhase } from './phases/MobileVerseMeditationPhase'
import { MobileReflectionPhase } from './phases/MobileReflectionPhase'
import { MobileIntentionPhase } from './phases/MobileIntentionPhase'
import { MobileCompletionSeal } from './phases/MobileCompletionSeal'

const PHASE_PARTICLE_DENSITY: Record<SadhanaPhase, number> = {
  loading: 0.1,
  arrival: 0.2,
  breathwork: 0.3,
  verse: 0.4,
  reflection: 0.2,
  intention: 0.5,
  complete: 0,
}

/** Lotus-bloom clip-path transition wrapper */
const phaseTransition = {
  initial: {
    clipPath: 'circle(0% at 50% 50%)',
    opacity: 0,
  },
  animate: {
    clipPath: 'circle(100% at 50% 50%)',
    opacity: 1,
  },
  exit: {
    clipPath: 'circle(0% at 50% 50%)',
    opacity: 0,
  },
}

export function NityaSadhanaScreen() {
  const {
    phase,
    mood,
    composition,
    reflectionText,
    intentionText,
    selectMood,
    complete,
    nextPhase,
    setReflectionText,
    setIntentionText,
    reset,
  } = useSadhana()

  const [completionResult, setCompletionResult] = useState<CompleteResponse | null>(null)

  // Reset on mount
  useEffect(() => {
    reset()
  }, [reset])

  const handleMoodSelect = useCallback(async (moodChoice: Parameters<typeof selectMood>[0]) => {
    await selectMood(moodChoice)
  }, [selectMood])

  const handleBreathworkComplete = useCallback(() => {
    nextPhase() // breathwork → verse
  }, [nextPhase])

  const handleVerseComplete = useCallback(() => {
    nextPhase() // verse → reflection
  }, [nextPhase])

  const handleReflectionComplete = useCallback(() => {
    nextPhase() // reflection → intention
  }, [nextPhase])

  const handleIntentionComplete = useCallback(async () => {
    const result = await complete()
    if (result) setCompletionResult(result)
  }, [complete])

  const getMoodColor = () => {
    if (!mood) return undefined
    const moodColors: Record<string, string> = {
      radiant: 'rgba(240,192,64,0.08)',
      peaceful: 'rgba(103,232,249,0.08)',
      grateful: 'rgba(110,231,183,0.08)',
      seeking: 'rgba(196,181,253,0.08)',
      heavy: 'rgba(147,197,253,0.08)',
      wounded: 'rgba(252,165,165,0.08)',
    }
    return moodColors[mood] || undefined
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Sacred background canvas */}
      <MobileSacredCanvas phase={phase} moodColor={getMoodColor()} />

      {/* Golden particles */}
      {phase !== 'complete' && (
        <MobileGoldenParticles density={PHASE_PARTICLE_DENSITY[phase]} />
      )}

      {/* Phase content with lotus-bloom transitions */}
      <AnimatePresence mode="wait">
        {phase === 'arrival' && (
          <motion.div
            key="arrival"
            {...phaseTransition}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileArrivalPhase onMoodSelect={handleMoodSelect} />
          </motion.div>
        )}

        {phase === 'breathwork' && composition && (
          <motion.div
            key="breathwork"
            {...phaseTransition}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileBreathworkPhase
              pattern={composition.breathingPattern}
              onComplete={handleBreathworkComplete}
            />
          </motion.div>
        )}

        {phase === 'verse' && composition && (
          <motion.div
            key="verse"
            {...phaseTransition}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileVerseMeditationPhase
              verse={composition.verse}
              onComplete={handleVerseComplete}
            />
          </motion.div>
        )}

        {phase === 'reflection' && composition && (
          <motion.div
            key="reflection"
            {...phaseTransition}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileReflectionPhase
              prompt={composition.reflectionPrompt}
              reflectionText={reflectionText}
              onReflectionChange={setReflectionText}
              onComplete={handleReflectionComplete}
            />
          </motion.div>
        )}

        {phase === 'intention' && composition && (
          <motion.div
            key="intention"
            {...phaseTransition}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileIntentionPhase
              intention={composition.dharmaIntention}
              intentionText={intentionText}
              onIntentionChange={setIntentionText}
              onComplete={handleIntentionComplete}
            />
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div
            key="complete"
            {...phaseTransition}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <MobileCompletionSeal result={completionResult} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
