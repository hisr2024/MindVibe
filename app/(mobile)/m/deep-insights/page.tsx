'use client'

/**
 * Quantum Dive — KIAAN's Deepest Experience
 *
 * Multi-dimensional analysis of a question through five lenses:
 *   Gita Wisdom, Psychology, Karma, Dharma, Universal Truth
 *
 * 3-phase sacred flow:
 *   1. INPUT   — Sacred textarea + dimension toggle pills
 *   2. LOADING — Concentric OM rings + Sanskrit mantra
 *   3. RESULTS — Dimension insight cards with optional verse blocks
 *
 * API: POST /api/kiaan/quantum-dive/analyze
 * Store: localStorage('journal_prefill') for journal hand-off
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Save, RotateCcw } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────

type Phase = 'input' | 'loading' | 'results'

interface DimensionMeta {
  id: string
  label: string
  icon: string
  color: string
  colorRGB: string
}

interface VerseBlock {
  ref: string
  sanskrit: string
  translation: string
}

interface DimensionResult {
  id: string
  label: string
  icon: string
  color: string
  colorRGB: string
  insight: string
  verse?: VerseBlock
}

interface QuantumDiveResponse {
  dimensions: DimensionResult[]
}

// ─── Dimension Catalogue ─────────────────────────────────────────────

const DIMENSIONS: DimensionMeta[] = [
  { id: 'gita',       label: 'Gita Wisdom',    icon: '\u0950',  color: '#F0C040', colorRGB: '240,192,64'  },
  { id: 'psychology', label: 'Psychology',      icon: '\u03A8',  color: '#8B9CF7', colorRGB: '139,156,247' },
  { id: 'karma',      label: 'Karma',           icon: '\u2638',  color: '#F09860', colorRGB: '240,152,96'  },
  { id: 'dharma',     label: 'Dharma',          icon: '\u2726',  color: '#60D0A0', colorRGB: '96,208,160'  },
  { id: 'universal',  label: 'Universal',       icon: '\u2727',  color: '#C084FC', colorRGB: '192,132,252' },
]

// ─── Font stacks ─────────────────────────────────────────────────────

const FONT_DIVINE   = 'Cormorant Garamond, Georgia, serif'
const FONT_SCRIPTURE = 'Crimson Text, Georgia, serif'
const FONT_UI        = 'Outfit, system-ui, sans-serif'
const FONT_SANSKRIT  = 'Noto Sans Devanagari, serif'

// ─── Loading mantras ─────────────────────────────────────────────────

const MANTRAS = [
  'ॐ असतो मा सद्गमय',
  'तमसो मा ज्योतिर्गमय',
  'मृत्योर्मा अमृतं गमय',
  'ॐ शान्तिः शान्तिः शान्तिः',
]

// ─── Component ───────────────────────────────────────────────────────

export default function MobileQuantumDivePage() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // Phase state
  const [phase, setPhase] = useState<Phase>('input')
  const [question, setQuestion] = useState('')
  const [selectedDims, setSelectedDims] = useState<Set<string>>(
    () => new Set(DIMENSIONS.map(d => d.id))
  )
  const [results, setResults] = useState<DimensionResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Loading mantra cycling
  const [mantraIndex, setMantraIndex] = useState(0)
  const mantraTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mantra cycling during loading
  useEffect(() => {
    if (phase === 'loading') {
      setMantraIndex(0)
      mantraTimerRef.current = setInterval(() => {
        setMantraIndex(prev => (prev + 1) % MANTRAS.length)
      }, 2400)
    }
    return () => {
      if (mantraTimerRef.current) clearInterval(mantraTimerRef.current)
    }
  }, [phase])

  // Toggle dimension
  const toggleDimension = useCallback((id: string) => {
    triggerHaptic('selection')
    setSelectedDims(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Require at least one dimension
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [triggerHaptic])

  // Begin dive
  const handleBeginDive = useCallback(async () => {
    if (!question.trim()) return

    triggerHaptic('medium')
    setPhase('loading')
    setError(null)

    try {
      const response = await apiFetch('/api/kiaan/quantum-dive/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          dimensions: Array.from(selectedDims),
        }),
      })

      if (!response.ok) {
        throw new Error('The dive could not be completed. Please try again.')
      }

      const data: QuantumDiveResponse = await response.json()

      // If the backend returns dimensions, use them; otherwise map from selected
      if (data.dimensions && data.dimensions.length > 0) {
        setResults(data.dimensions)
      } else {
        // Graceful degradation: build placeholder cards
        setResults(
          DIMENSIONS.filter(d => selectedDims.has(d.id)).map(d => ({
            ...d,
            insight: 'The depths hold silence on this dimension right now. Reflect within.',
          }))
        )
      }

      triggerHaptic('success')
      setPhase('results')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)

      // Fallback: produce graceful offline-style results
      setResults(
        DIMENSIONS.filter(d => selectedDims.has(d.id)).map(d => ({
          ...d,
          insight: 'We could not reach the cosmic servers. The Gita reminds us: patience is the companion of wisdom.',
          verse: {
            ref: 'Bhagavad Gita 2.47',
            sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
            translation: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.',
          },
        }))
      )

      triggerHaptic('warning')
      setPhase('results')
    }
  }, [question, selectedDims, triggerHaptic])

  // Save to journal
  const handleSaveToJournal = useCallback(() => {
    triggerHaptic('light')

    const journalContent = results
      .map(dim => {
        let entry = `**${dim.label}** (${dim.icon})\n${dim.insight}`
        if (dim.verse) {
          entry += `\n\n_${dim.verse.sanskrit}_\n"${dim.verse.translation}" — ${dim.verse.ref}`
        }
        return entry
      })
      .join('\n\n---\n\n')

    const prefill = {
      title: `Quantum Dive: ${question.slice(0, 60)}`,
      content: `**Question:** ${question}\n\n${journalContent}`,
      source: 'quantum-dive',
      timestamp: new Date().toISOString(),
    }

    try {
      localStorage.setItem('journal_prefill', JSON.stringify(prefill))
    } catch {
      // localStorage full — non-blocking
    }

    router.push('/m/journal/new')
  }, [results, question, router, triggerHaptic])

  // New question
  const handleNewQuestion = useCallback(() => {
    triggerHaptic('light')
    setQuestion('')
    setResults([])
    setError(null)
    setPhase('input')
  }, [triggerHaptic])

  // Scroll to top on phase change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [phase])

  const canSubmit = question.trim().length > 0 && selectedDims.size > 0

  return (
    <MobileAppShell
      title="Quantum Dive"
      showBack
      onBack={() => router.back()}
      showTabBar={phase !== 'loading'}
      showHeader={phase !== 'loading'}
    >
      {/* Sacred background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, #0A0D28 0%, #050714 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence mode="wait">
        {/* ════════════════════ INPUT PHASE ════════════════════ */}
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '8px 20px 120px',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{
                  fontSize: 36,
                  lineHeight: 1,
                  marginBottom: 12,
                }}
              >
                ◈
              </motion.div>
              <h1
                style={{
                  fontFamily: FONT_DIVINE,
                  fontSize: 26,
                  fontWeight: 500,
                  color: '#EDE8DC',
                  letterSpacing: '0.02em',
                  marginBottom: 6,
                }}
              >
                Quantum Dive
              </h1>
              <p
                style={{
                  fontFamily: FONT_SCRIPTURE,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: '#8B8578',
                  lineHeight: 1.5,
                  maxWidth: 280,
                  margin: '0 auto',
                }}
              >
                Multi-dimensional analysis through ancient wisdom and modern understanding
              </p>
            </div>

            {/* Sacred textarea */}
            <div
              style={{
                borderRadius: 20,
                padding: 20,
                background: 'rgba(22, 26, 66, 0.35)',
                border: '1px solid rgba(212, 160, 23, 0.12)',
                marginBottom: 24,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontFamily: FONT_DIVINE,
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: '#D4A017',
                  marginBottom: 10,
                }}
              >
                What calls for deeper understanding?
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Enter your question or describe your situation..."
                maxLength={500}
                rows={4}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: FONT_UI,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#EDE8DC',
                  caretColor: '#D4A017',
                }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontFamily: FONT_UI,
                  fontSize: 11,
                  color: '#6B6355',
                  marginTop: 4,
                }}
              >
                {question.length}/500
              </div>
            </div>

            {/* Dimension pills */}
            <div style={{ marginBottom: 28 }}>
              <p
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  color: '#6B6355',
                  marginBottom: 12,
                }}
              >
                Dimensions to explore
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DIMENSIONS.map(dim => {
                  const active = selectedDims.has(dim.id)
                  return (
                    <motion.button
                      key={dim.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleDimension(dim.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 100,
                        border: `1px solid ${active ? dim.color : 'rgba(255,255,255,0.08)'}`,
                        background: active ? `rgba(${dim.colorRGB}, 0.12)` : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          opacity: active ? 1 : 0.4,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {dim.icon}
                      </span>
                      <span
                        style={{
                          fontFamily: FONT_UI,
                          fontSize: 13,
                          fontWeight: active ? 500 : 400,
                          color: active ? dim.color : '#6B6355',
                          transition: 'color 0.2s',
                        }}
                      >
                        {dim.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(249, 115, 22, 0.08)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontFamily: FONT_UI,
                    fontSize: 13,
                    color: '#F97316',
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBeginDive}
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 16,
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                background: canSubmit
                  ? 'linear-gradient(135deg, #D4A017, #B8860B)'
                  : 'rgba(255,255,255,0.06)',
                boxShadow: canSubmit
                  ? '0 8px 32px rgba(212, 160, 23, 0.25)'
                  : 'none',
                fontFamily: FONT_DIVINE,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: canSubmit ? '#050714' : '#6B6355',
                transition: 'all 0.3s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Begin Quantum Dive ◈
            </motion.button>
          </motion.div>
        )}

        {/* ════════════════════ LOADING PHASE ════════════════════ */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050714',
              zIndex: 50,
            }}
          >
            {/* Concentric OM rings */}
            <div
              style={{
                position: 'relative',
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Ring 1 — outermost */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 192,
                  height: 192,
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 160, 23, 0.12)',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid rgba(212, 160, 23, 0.2)',
                  }}
                />
              </motion.div>

              {/* Ring 2 */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 144,
                  height: 144,
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 160, 23, 0.18)',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid rgba(212, 160, 23, 0.25)',
                  }}
                />
              </motion.div>

              {/* Ring 3 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 160, 23, 0.25)',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid rgba(212, 160, 23, 0.3)',
                  }}
                />
              </motion.div>

              {/* Ring 4 — innermost */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: '1px solid rgba(212, 160, 23, 0.35)',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid rgba(212, 160, 23, 0.45)',
                  }}
                />
              </motion.div>

              {/* OM at center */}
              <motion.span
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.7, 1, 0.7],
                  textShadow: [
                    '0 0 12px rgba(212, 160, 23, 0.3)',
                    '0 0 28px rgba(212, 160, 23, 0.6)',
                    '0 0 12px rgba(212, 160, 23, 0.3)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: FONT_SANSKRIT,
                  fontSize: 36,
                  color: '#F0C040',
                }}
              >
                ॐ
              </motion.span>
            </div>

            {/* Sanskrit mantra */}
            <div style={{ height: 48, marginTop: 32, textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={mantraIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    fontFamily: FONT_SANSKRIT,
                    fontSize: 16,
                    color: '#D4A017',
                    lineHeight: 2.0,
                  }}
                >
                  {MANTRAS[mantraIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Diving text */}
            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontFamily: FONT_DIVINE,
                fontSize: 14,
                fontStyle: 'italic',
                color: '#8B8578',
                marginTop: 8,
              }}
            >
              Diving into the Gita...
            </motion.p>
          </motion.div>
        )}

        {/* ════════════════════ RESULTS PHASE ════════════════════ */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '8px 20px 160px',
            }}
          >
            {/* Results header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  color: '#6B6355',
                  marginBottom: 8,
                }}
              >
                Quantum Dive Complete
              </p>
              <h2
                style={{
                  fontFamily: FONT_DIVINE,
                  fontSize: 20,
                  fontWeight: 500,
                  color: '#EDE8DC',
                  lineHeight: 1.4,
                  maxWidth: 300,
                  margin: '0 auto',
                }}
              >
                {question.length > 80 ? question.slice(0, 80) + '...' : question}
              </h2>
            </div>

            {/* Dimension cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.map((dim, i) => (
                <motion.div
                  key={dim.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  style={{
                    borderRadius: 18,
                    padding: '18px 18px 18px 22px',
                    background: 'rgba(22, 26, 66, 0.35)',
                    borderLeft: `3px solid ${dim.color}`,
                    border: `1px solid rgba(${dim.colorRGB || '255,255,255'}, 0.1)`,
                    borderLeftWidth: 3,
                    borderLeftColor: dim.color,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle glow */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 80,
                      height: '100%',
                      background: `linear-gradient(90deg, rgba(${dim.colorRGB || '255,255,255'}, 0.04), transparent)`,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Icon + label */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{dim.icon}</span>
                    <span
                      style={{
                        fontFamily: FONT_UI,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                        color: dim.color,
                      }}
                    >
                      {dim.label}
                    </span>
                  </div>

                  {/* Verse block (optional) */}
                  {dim.verse && (
                    <div
                      style={{
                        borderRadius: 12,
                        padding: '14px 16px',
                        marginBottom: 14,
                        background: 'rgba(5, 7, 20, 0.5)',
                        border: '1px solid rgba(212, 160, 23, 0.1)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: FONT_SANSKRIT,
                          fontSize: 15,
                          lineHeight: 2.0,
                          color: '#F0C040',
                          textAlign: 'center',
                          marginBottom: 8,
                        }}
                      >
                        {dim.verse.sanskrit}
                      </p>
                      <p
                        style={{
                          fontFamily: FONT_SCRIPTURE,
                          fontSize: 13,
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          color: '#B8AE98',
                          textAlign: 'center',
                          marginBottom: 6,
                        }}
                      >
                        &ldquo;{dim.verse.translation}&rdquo;
                      </p>
                      <p
                        style={{
                          fontFamily: FONT_UI,
                          fontSize: 10,
                          color: '#6B6355',
                          textAlign: 'right',
                        }}
                      >
                        {dim.verse.ref}
                      </p>
                    </div>
                  )}

                  {/* Insight text */}
                  <p
                    style={{
                      fontFamily: FONT_SCRIPTURE,
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: '#D6CFBF',
                      position: 'relative',
                    }}
                  >
                    {dim.insight}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: results.length * 0.12 + 0.3, duration: 0.4 }}
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 28,
              }}
            >
              {/* Save to Journal */}
              <button
                onClick={handleSaveToJournal}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(212, 160, 23, 0.3)',
                  background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.12), rgba(212, 160, 23, 0.06))',
                  cursor: 'pointer',
                  fontFamily: FONT_UI,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#D4A017',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Save size={16} />
                Save to Journal
              </button>

              {/* New Question */}
              <button
                onClick={handleNewQuestion}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  fontFamily: FONT_UI,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#B8AE98',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <RotateCcw size={16} />
                New Question
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileAppShell>
  )
}
