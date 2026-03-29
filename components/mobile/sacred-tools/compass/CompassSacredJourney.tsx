'use client'

/**
 * CompassSacredJourney — Main orchestrator for Relationship Compass's 6 Sacred Chambers
 *
 * Chamber I:   COMPASS ALTAR      — Entry, relationship naming, guna meter
 * Chamber II:  GUNA MIRROR        — 3-panel pattern selection (Tamas/Rajas/Sattva)
 * Chamber III: DHARMA MAP         — SVG radar visualization
 * Chamber IV:  GITA COUNSEL       — AI response (existing API unchanged)
 * Chamber V:   DHARMIC INTENTION  — Sankalpa setting
 * Chamber VI:  COMPASS SEAL       — Completion & summary
 *
 * Uses the same /api/relationship-compass/guide endpoint — response generation unchanged.
 * The UI enriches the message with guna context before sending.
 */

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { SacredMovementShell } from '../shared/SacredMovementShell'
import { SacredProgressFlames } from '../shared/SacredProgressFlames'
import CompassAltarChamber from './chambers/CompassAltarChamber'
import GunaMirrorChamber from './chambers/GunaMirrorChamber'
import DharmaMapChamber from './chambers/DharmaMapChamber'
import GitaCounselChamber from './chambers/GitaCounselChamber'
import DharmicIntentionChamber from './chambers/DharmicIntentionChamber'
import CompassSealChamber from './chambers/CompassSealChamber'
import { type RelationshipTypeData } from './data/relationshipTypes'
import { type DharmicQuality } from './data/dharmicQualities'
import { GUNA_PATTERNS } from './data/gunaPatterns'
import { useGunaCalculation } from './hooks/useGunaCalculation'
import { useDharmaMapData } from './hooks/useDharmaMapData'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)
}

type CompassChamber = 'altar' | 'guna_mirror' | 'dharma_map' | 'gita_counsel' | 'intention' | 'seal'

const CHAMBER_ORDER: CompassChamber[] = ['altar', 'guna_mirror', 'dharma_map', 'gita_counsel', 'intention', 'seal']

type CompassResult = {
  response: string
  sections: Record<string, string>
  requestedAt: string
  gitaVerses?: number
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  contextSufficient?: boolean
  secularMode?: boolean
}

export default function CompassSacredJourney() {
  // Chamber state
  const [chamber, setChamber] = useState<CompassChamber>('altar')

  // Altar state
  const [relationshipType, setRelationshipType] = useState<RelationshipTypeData | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [initialGunaReading, setInitialGunaReading] = useState('balanced')

  // Guna Mirror state
  const [selectedPatterns, setSelectedPatterns] = useState<{
    tamas: string[]
    rajas: string[]
    sattva: string[]
  }>({ tamas: [], rajas: [], sattva: [] })

  // Intention state
  const [selectedQuality, setSelectedQuality] = useState<DharmicQuality | null>(null)
  const [intentionText, setIntentionText] = useState('')

  // API state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompassResult | null>(null)
  const [sessionId, setSessionId] = useState('')

  const { language } = useLanguage()

  // Derived data
  const gunaScores = useGunaCalculation(selectedPatterns)
  const dharmaValues = useDharmaMapData(selectedPatterns)

  // Initialize session
  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      setSessionId(window.crypto.randomUUID())
    }
  }, [sessionId])

  const currentChamberIndex = CHAMBER_ORDER.indexOf(chamber)

  const advanceChamber = useCallback(() => {
    const nextIndex = currentChamberIndex + 1
    if (nextIndex < CHAMBER_ORDER.length) {
      setChamber(CHAMBER_ORDER[nextIndex])
    }
  }, [currentChamberIndex])

  // Toggle guna pattern selection
  const togglePattern = useCallback((guna: 'tamas' | 'rajas' | 'sattva', patternId: string) => {
    setSelectedPatterns((prev) => {
      const current = prev[guna]
      const updated = current.includes(patternId)
        ? current.filter((id) => id !== patternId)
        : [...current, patternId]
      return { ...prev, [guna]: updated }
    })
  }, [])

  // Build enriched context message from guna selections
  const buildGunaContext = useCallback(() => {
    const patternTexts = (guna: 'tamas' | 'rajas' | 'sattva') => {
      const ids = selectedPatterns[guna]
      const patterns = GUNA_PATTERNS[guna]
      return ids
        .map((id) => patterns.find((p) => p.id === id)?.text)
        .filter(Boolean)
        .join('; ')
    }

    const parts: string[] = []
    if (relationshipType) parts.push(`[Relationship: ${relationshipType.label} with ${partnerName || 'someone'}]`)
    parts.push(`[Dominant energy: ${gunaScores.dominant}]`)
    if (selectedPatterns.tamas.length > 0) parts.push(`[Tamas patterns: ${patternTexts('tamas')}]`)
    if (selectedPatterns.rajas.length > 0) parts.push(`[Rajas patterns: ${patternTexts('rajas')}]`)
    if (selectedPatterns.sattva.length > 0) parts.push(`[Sattva patterns: ${patternTexts('sattva')}]`)

    return parts.join(' ')
  }, [selectedPatterns, relationshipType, partnerName, gunaScores.dominant])

  // Submit to API (called at dharma_map → gita_counsel transition)
  const submitToAPI = useCallback(async () => {
    const gunaContext = buildGunaContext()
    const enrichedMessage = sanitizeInput(
      `${gunaContext} I need guidance on navigating this ${relationshipType?.label || 'relationship'} with wisdom.`
    )

    setLoading(true)
    setError(null)
    setChamber('gita_counsel')

    try {
      const activeSessionId = sessionId || window.crypto.randomUUID()
      if (!sessionId) setSessionId(activeSessionId)

      const response = await apiFetch('/api/relationship-compass/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          sessionId: activeSessionId,
          relationshipType: relationshipType?.id || 'other',
          secularMode: false,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok && !data.response) {
        setError('Relationship Compass is gathering wisdom. Try again shortly.')
        return
      }

      const guidance = data.sections
      const fullResponse = data.response || formatGuidance(guidance)
      const citations = Array.isArray(data.citations)
        ? data.citations.map((c: { source?: string; source_file?: string; chapter?: string; verse?: string; chunk_id?: string }) => ({
            source_file: c.source_file || c.source || 'Unknown source',
            reference_if_any: c.chapter && c.verse ? `${c.chapter}:${c.verse}` : undefined,
            chunk_id: c.chunk_id || 'unknown',
          }))
        : []

      if (guidance || fullResponse) {
        setResult({
          response: fullResponse,
          sections: guidance || {},
          requestedAt: new Date().toISOString(),
          gitaVerses: citations.length,
          citations,
          contextSufficient: data.contextSufficient,
          secularMode: data.secularMode !== false,
        })
      } else {
        setError('Compass could not generate a response. Try again.')
      }
    } catch {
      setError('Unable to reach Relationship Compass. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [buildGunaContext, relationshipType, sessionId])

  function formatGuidance(guidance: Record<string, string> | undefined): string {
    if (!guidance) return ''
    return Object.entries(guidance).map(([title, content]) => `${title}\n${content}`).join('\n\n')
  }

  return (
    <SacredMovementShell
      progressIndicator={
        chamber !== 'altar' ? (
          <SacredProgressFlames
            total={6}
            current={currentChamberIndex}
            type="lotus"
          />
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {chamber === 'altar' && (
          <motion.div key="altar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CompassAltarChamber
              relationshipType={relationshipType}
              onRelationshipTypeChange={setRelationshipType}
              partnerName={partnerName}
              onNameChange={setPartnerName}
              initialGunaReading={initialGunaReading}
              onGunaReadingChange={setInitialGunaReading}
              onProceed={advanceChamber}
            />
          </motion.div>
        )}

        {chamber === 'guna_mirror' && (
          <motion.div key="guna_mirror" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GunaMirrorChamber
              selectedPatterns={selectedPatterns}
              onTogglePattern={togglePattern}
              gunaScores={gunaScores}
              onProceed={advanceChamber}
            />
          </motion.div>
        )}

        {chamber === 'dharma_map' && (
          <motion.div key="dharma_map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <DharmaMapChamber
              dharmaValues={dharmaValues}
              dominantGuna={gunaScores.dominant}
              partnerName={partnerName}
              onProceed={submitToAPI}
            />
          </motion.div>
        )}

        {chamber === 'gita_counsel' && (
          <motion.div key="gita_counsel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GitaCounselChamber
              loading={loading}
              response={result}
              language={language}
              onContinue={advanceChamber}
            />
          </motion.div>
        )}

        {chamber === 'intention' && (
          <motion.div key="intention" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <DharmicIntentionChamber
              partnerName={partnerName}
              selectedQuality={selectedQuality}
              onQualityChange={setSelectedQuality}
              intentionText={intentionText}
              onIntentionTextChange={setIntentionText}
              onSeal={advanceChamber}
            />
          </motion.div>
        )}

        {chamber === 'seal' && (
          <motion.div key="seal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CompassSealChamber
              partnerName={partnerName}
              relationshipType={relationshipType?.label || ''}
              dominantGuna={gunaScores.dominant}
              intentionText={intentionText || `In my relationship with ${partnerName || 'them'}, I choose ${selectedQuality?.label || 'clarity'}.`}
              selectedQuality={selectedQuality?.label || ''}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
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
