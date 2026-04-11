'use client'

/**
 * SadhanaExperience — Main orchestrator for the daily sacred practice.
 * Manages the phase state machine with cinematic transitions,
 * sacred progress path, and phase-reactive visual layers.
 */

import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSadhana } from '@/hooks/useSadhana'
import { SacredCanvas } from './visuals/SacredCanvas'
import { GoldenParticles } from './visuals/GoldenParticles'
import { SadhanaJourneyPath } from './components/SadhanaJourneyPath'
import { PhaseTransition } from './components/PhaseTransition'
import { ArrivalPhase } from './phases/ArrivalPhase'
import { BreathworkPhase } from './phases/BreathworkPhase'
import { VerseMeditationPhase } from './phases/VerseMeditationPhase'
import { ReflectionPhase } from './phases/ReflectionPhase'
import { IntentionPhase } from './phases/IntentionPhase'
import { CompletionSeal } from './phases/CompletionSeal'
import type { CompleteResponse } from '@/types/sadhana.types'

export function SadhanaExperience() {
  const {
    phase,
    composition,
    isComposing,
    reflectionText,
    intentionText,
    selectMood,
    nextPhase,
    setReflectionText,
    setIntentionText,
    complete,
  } = useSadhana()

  const [completionResult, setCompletionResult] = useState<CompleteResponse | null>(null)

  const handleComplete = useCallback(async () => {
    const result = await complete()
    if (result) setCompletionResult(result)
  }, [complete])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050714]">
      {/* Phase-reactive background */}
      <SacredCanvas phase={phase} />
      <GoldenParticles phase={phase} />

      {/* Sacred progress path */}
      <SadhanaJourneyPath currentPhase={phase} />

      {/* Phase content with cinematic transitions */}
      <AnimatePresence mode="wait">
        {phase === 'arrival' && (
          <PhaseTransition key="arrival" phase="arrival">
            <ArrivalPhase
              greeting={composition?.greeting ?? null}
              isComposing={isComposing}
              onMoodSelect={selectMood}
            />
          </PhaseTransition>
        )}

        {phase === 'breathwork' && composition && (
          <PhaseTransition key="breathwork" phase="breathwork">
            <BreathworkPhase
              pattern={composition.breathingPattern}
              onComplete={nextPhase}
            />
          </PhaseTransition>
        )}

        {phase === 'verse' && composition && (
          <PhaseTransition key="verse" phase="verse">
            <VerseMeditationPhase
              verse={composition.verse}
              onComplete={nextPhase}
            />
          </PhaseTransition>
        )}

        {phase === 'reflection' && composition && (
          <PhaseTransition key="reflection" phase="reflection">
            <ReflectionPhase
              prompt={composition.reflectionPrompt}
              value={reflectionText}
              onChange={setReflectionText}
              onComplete={nextPhase}
            />
          </PhaseTransition>
        )}

        {phase === 'intention' && composition && (
          <PhaseTransition key="intention" phase="intention">
            <IntentionPhase
              intention={composition.dharmaIntention}
              value={intentionText}
              onChange={setIntentionText}
              onComplete={handleComplete}
            />
          </PhaseTransition>
        )}

        {phase === 'complete' && composition && (
          <PhaseTransition key="complete" phase="complete">
            <CompletionSeal
              xpAwarded={completionResult?.xpAwarded ?? 25}
              streakCount={completionResult?.streakCount ?? 1}
              message={completionResult?.message ?? 'Your practice is sealed. Walk in dharma today.'}
              verseId={composition.verse.verseId}
            />
          </PhaseTransition>
        )}
      </AnimatePresence>

      {/* Exit button — styled subtly as "विराम" (pause) */}
      {phase !== 'complete' && (
        <a
          href="/dashboard"
          className="fixed top-5 right-5 z-50 text-[#d4a44c]/20 hover:text-[#d4a44c]/50 transition-colors text-xs font-light tracking-wider"
          aria-label="Exit Sadhana"
        >
          विराम
        </a>
      )}
    </div>
  )
}
