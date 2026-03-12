'use client'

/**
 * SadhanaExperience — Main orchestrator for the daily sacred practice.
 * Manages the phase state machine and renders the appropriate phase component.
 */

import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSadhana } from '@/hooks/useSadhana'
import { SacredCanvas } from './visuals/SacredCanvas'
import { GoldenParticles } from './visuals/GoldenParticles'
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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14]">
      {/* Background layers */}
      <SacredCanvas phase={phase} />
      <GoldenParticles count={phase === 'complete' ? 60 : 30} />

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === 'arrival' && (
          <ArrivalPhase
            key="arrival"
            greeting={composition?.greeting ?? null}
            isComposing={isComposing}
            onMoodSelect={selectMood}
          />
        )}

        {phase === 'breathwork' && composition && (
          <BreathworkPhase
            key="breathwork"
            pattern={composition.breathingPattern}
            onComplete={nextPhase}
          />
        )}

        {phase === 'verse' && composition && (
          <VerseMeditationPhase
            key="verse"
            verse={composition.verse}
            onComplete={nextPhase}
          />
        )}

        {phase === 'reflection' && composition && (
          <ReflectionPhase
            key="reflection"
            prompt={composition.reflectionPrompt}
            value={reflectionText}
            onChange={setReflectionText}
            onComplete={nextPhase}
          />
        )}

        {phase === 'intention' && composition && (
          <IntentionPhase
            key="intention"
            intention={composition.dharmaIntention}
            value={intentionText}
            onChange={setIntentionText}
            onComplete={handleComplete}
          />
        )}

        {phase === 'complete' && composition && (
          <CompletionSeal
            key="complete"
            xpAwarded={completionResult?.xpAwarded ?? 25}
            streakCount={completionResult?.streakCount ?? 1}
            message={completionResult?.message ?? 'Your practice is sealed. Walk in dharma today.'}
            verseId={composition.verse.verseId}
          />
        )}
      </AnimatePresence>

      {/* Exit button (always visible) */}
      {phase !== 'complete' && (
        <a
          href="/dashboard"
          className="fixed top-6 right-6 z-50 text-[#d4a44c]/30 hover:text-[#d4a44c]/60 transition-colors text-sm"
          aria-label="Exit Sadhana"
        >
          Exit
        </a>
      )}
    </div>
  )
}
