'use client'

/**
 * ViyogaSacredJourney — Main orchestrator for Viyoga's 5 Sacred Movements
 *
 * Movement I:   AAROHA   — The Ascending Entry (tender animation)
 * Movement II:  VILAP    — The Sacred Expression (Separation Map + input)
 * Movement III: DARSHAN  — Sakha's Witnessing (AI response display)
 * Movement IV:  DHYAN    — The Sacred Meditation (guided visualization)
 * Movement V:   VISARJAN — The Sacred Release Ceremony
 *
 * Uses the same /api/viyoga/chat endpoint — response generation unchanged.
 * The UI enriches the message with separation context before sending.
 */

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { SacredMovementShell } from '../shared/SacredMovementShell'
import { SacredProgressFlames } from '../shared/SacredProgressFlames'
import AarohaMovement from './movements/AarohaMovement'
import VilapMovement from './movements/VilapMovement'
import DarshanMovement from './movements/DarshanMovement'
import DhyanMovement from './movements/DhyanMovement'
import VisarjanMovement from './movements/VisarjanMovement'
import { type SeparationType } from './data/separationTypes'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'
import { sanitizeInput } from '@/lib/utils/sanitizeInput'

type ViyogaMovement = 'aaroha' | 'vilap' | 'darshan' | 'dhyan' | 'visarjan'

const MOVEMENT_ORDER: ViyogaMovement[] = ['aaroha', 'vilap', 'darshan', 'dhyan', 'visarjan']

type ViyogResult = {
  response: string
  sections: Record<string, string>
  requestedAt: string
  gitaVerses?: number
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  concernAnalysis?: Record<string, unknown> | null
  provider?: string
}

export default function ViyogaSacredJourney() {
  // Movement state
  const [movement, setMovement] = useState<ViyogaMovement>('aaroha')

  // User input state
  const [separationType, setSeparationType] = useState<SeparationType | null>(null)
  const [separatedFromName, setSeparatedFromName] = useState('')
  const [distanceLevel, setDistanceLevel] = useState(3)
  const [userExpression, setUserExpression] = useState('')
  const [releaseOffering, setReleaseOffering] = useState('')

  // API state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ViyogResult | null>(null)
  const [sessionId, setSessionId] = useState('')

  const { language } = useLanguage()

  // Initialize session
  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      setSessionId(window.crypto.randomUUID())
    }
  }, [sessionId])

  const currentMovementIndex = MOVEMENT_ORDER.indexOf(movement)

  // Advance to next movement
  const advanceMovement = useCallback(() => {
    const nextIndex = currentMovementIndex + 1
    if (nextIndex < MOVEMENT_ORDER.length) {
      setMovement(MOVEMENT_ORDER[nextIndex])
    }
  }, [currentMovementIndex])

  // Submit to API (called when Vilap → Darshan transition)
  const submitToAPI = useCallback(async () => {
    const DISTANCE_LABELS = ['Fresh', 'Present', 'Deep', 'Old', 'Eternal']
    const expression = sanitizeInput(userExpression.trim())
    const name = separatedFromName.trim() || 'what was lost'
    const typeLabel = separationType?.label || 'a separation'
    const distLabel = DISTANCE_LABELS[distanceLevel - 1] || 'Deep'

    // Enrich message with separation context
    const enrichedMessage = `[Separation type: ${typeLabel}] [From: ${name}] [Feels: ${distLabel}] ${expression || `I am experiencing ${typeLabel.toLowerCase()} — separated from ${name}.`}`

    setLoading(true)
    setError(null)
    setMovement('darshan')

    try {
      const activeSessionId = sessionId || window.crypto.randomUUID()
      if (!sessionId) setSessionId(activeSessionId)

      const response = await apiFetch('/api/viyoga/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          sessionId: activeSessionId,
          mode: 'full',
        }),
      })

      if (!response.ok) {
        if (response.status === 429) setError('Take a breath. Too many requests.')
        else if (response.status === 503) setError('Viyoga is gathering wisdom. Try again shortly.')
        else setError('Unable to process. Please try again.')
        return
      }

      const data = await response.json()
      const responseText = typeof data.assistant === 'string' ? data.assistant : ''
      const sections = data.sections && typeof data.sections === 'object' ? data.sections : {}
      const citations = Array.isArray(data.citations) ? data.citations : []

      if (!responseText) {
        setError('Viyoga could not generate a response. Please try again.')
        return
      }

      const normalized: Record<string, string> = {}
      Object.entries(sections).forEach(([key, value]) => {
        if (value) normalized[key] = value as string
      })

      setResult({
        response: responseText,
        sections: normalized,
        requestedAt: new Date().toISOString(),
        gitaVerses: data.gita_verses_used || citations.length,
        citations,
        concernAnalysis: data.concern_analysis || null,
        provider: data.provider || data.retrieval?.strategy || 'unknown',
      })
    } catch {
      setError('Unable to reach Viyoga. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [userExpression, separatedFromName, separationType, distanceLevel, sessionId])

  return (
    <SacredMovementShell
      progressIndicator={
        movement !== 'aaroha' ? (
          <SacredProgressFlames
            total={5}
            current={currentMovementIndex}
            type="flame"
          />
        ) : undefined
      }
    >
      <div aria-live="polite" aria-busy={loading}>
      <AnimatePresence mode="wait">
        {movement === 'aaroha' && (
          <motion.div key="aaroha" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AarohaMovement onComplete={() => setMovement('vilap')} />
          </motion.div>
        )}

        {movement === 'vilap' && (
          <motion.div key="vilap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <VilapMovement
              separationType={separationType}
              onSeparationTypeChange={setSeparationType}
              separatedFromName={separatedFromName}
              onNameChange={setSeparatedFromName}
              distanceLevel={distanceLevel}
              onDistanceLevelChange={setDistanceLevel}
              userExpression={userExpression}
              onExpressionChange={setUserExpression}
              onSubmit={submitToAPI}
              loading={loading}
            />
          </motion.div>
        )}

        {movement === 'darshan' && (
          <motion.div key="darshan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <DarshanMovement
              loading={loading}
              response={result}
              separatedFromName={separatedFromName}
              language={language}
              onContinue={advanceMovement}
            />
          </motion.div>
        )}

        {movement === 'dhyan' && (
          <motion.div key="dhyan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DhyanMovement
              separationType={separationType?.id || 'death'}
              separatedFromName={separatedFromName}
              onComplete={advanceMovement}
            />
          </motion.div>
        )}

        {movement === 'visarjan' && (
          <motion.div key="visarjan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <VisarjanMovement
              separationType={separationType}
              separatedFromName={separatedFromName}
              releaseOffering={releaseOffering}
              onReleaseChange={setReleaseOffering}
              onComplete={() => {/* stay on completion view */}}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="sacred-card p-3 text-center">
              <p className="font-sacred text-sm text-[#e8b54a]/80">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SacredMovementShell>
  )
}
