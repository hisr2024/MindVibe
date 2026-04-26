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

/** Generate a session id that works on every Android WebView. crypto.randomUUID
 *  is only guaranteed in secure contexts (HTTPS or localhost) and is missing
 *  from older WebViews — calling it there throws and crashes the page. */
function safeSessionId(): string {
  if (typeof crypto !== 'undefined') {
    const c = crypto as Crypto & { randomUUID?: () => string }
    if (typeof c.randomUUID === 'function') {
      try {
        return c.randomUUID()
      } catch {
        // fall through to random fallback
      }
    }
    if (typeof c.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      c.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex: string[] = []
      for (let i = 0; i < bytes.length; i++) {
        hex.push(bytes[i].toString(16).padStart(2, '0'))
      }
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
        .slice(6, 8)
        .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
    }
  }
  return `kr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function KarmaResetScreen() {
  const [phase, setPhase] = useState<KarmaResetPhase>('entry')
  const [session, setSession] = useState<Partial<KarmaResetSession>>(() => ({
    sessionId: safeSessionId(),
    startedAt: new Date(),
    reflections: [],
    xpAwarded: 0,
    streakCount: 0,
  }))

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
