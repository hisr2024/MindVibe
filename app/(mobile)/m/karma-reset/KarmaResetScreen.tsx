'use client'

/**
 * KarmaResetScreen — State machine orchestrator for the mobile
 * Karma Reset experience. Controls phase transitions with lotus-bloom
 * animations and coordinates all sub-phase components.
 *
 * State machine: entry → context → reflection → wisdom → sankalpa → seal
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KarmaCanvas } from './visuals/KarmaCanvas'
import { EntryPhase } from './phases/EntryPhase'
import { ContextPhase } from './phases/ContextPhase'
import { ReflectionPhase } from './phases/ReflectionPhase'
import { WisdomPhase } from './phases/WisdomPhase'
import { SankalphaPhase } from './phases/SankalphaPhase'
import { SealPhase } from './phases/SealPhase'
import type {
  KarmaResetPhase,
  KarmaResetSession,
  KarmaResetContext,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
  SankalpaSeal,
} from './types'

/** Lotus-bloom clip-path transition */
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
    opacity: 0,
    y: -20,
  },
}

export function KarmaResetScreen() {
  const [phase, setPhase] = useState<KarmaResetPhase>('entry')
  const [session, setSession] = useState<Partial<KarmaResetSession>>({
    sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : `kr-${Date.now()}`,
    startedAt: new Date(),
    reflections: [],
    xpAwarded: 0,
    streakCount: 0,
  })

  const updateSession = useCallback((updates: Partial<KarmaResetSession>) => {
    setSession((prev) => ({ ...prev, ...updates }))
  }, [])

  // Phase event handlers
  const handleEntryComplete = useCallback(() => {
    setPhase('context')
  }, [])

  const handleContextComplete = useCallback((ctx: KarmaResetContext) => {
    updateSession({ context: ctx })
    setPhase('reflection')
  }, [updateSession])

  const handleReflectionComplete = useCallback((refs: KarmaReflectionAnswer[]) => {
    updateSession({ reflections: refs })
    setPhase('wisdom')
  }, [updateSession])

  const handleWisdomComplete = useCallback((wisdom: KarmaWisdomResponse) => {
    updateSession({ wisdom })
    setPhase('sankalpa')
  }, [updateSession])

  const handleSankalphaComplete = useCallback((sankalpa: SankalpaSeal) => {
    updateSession({ sankalpa, completedAt: new Date() })
    setPhase('seal')
  }, [updateSession])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050714',
        overflow: 'hidden',
      }}
    >
      {/* Phase-reactive sacred background */}
      <KarmaCanvas phase={phase} category={session.context?.category} />

      {/* Phase content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          variants={phaseTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.0, 0.8, 0.2, 1.0] }}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: phase === 'entry' || phase === 'seal' ? 'hidden' : 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {phase === 'entry' && (
            <EntryPhase onComplete={handleEntryComplete} />
          )}
          {phase === 'context' && (
            <ContextPhase onComplete={handleContextComplete} />
          )}
          {phase === 'reflection' && session.context && (
            <ReflectionPhase
              context={session.context as KarmaResetContext}
              onComplete={handleReflectionComplete}
            />
          )}
          {phase === 'wisdom' && session.context && session.reflections && (
            <WisdomPhase
              context={session.context as KarmaResetContext}
              reflections={session.reflections as KarmaReflectionAnswer[]}
              onComplete={handleWisdomComplete}
            />
          )}
          {phase === 'sankalpa' && session.wisdom && session.context && (
            <SankalphaPhase
              wisdom={session.wisdom as KarmaWisdomResponse}
              context={session.context as KarmaResetContext}
              onComplete={handleSankalphaComplete}
            />
          )}
          {phase === 'seal' && (
            <SealPhase session={session as KarmaResetSession} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
