'use client'

/**
 * MobileKarmicWheel — The Dharma Chakra of Karmic Awareness
 *
 * An 8-spoke Sudarshana Chakra visualization where each spoke
 * represents a karma category. Users tap spokes to set their
 * karmic weight (0-4), creating a unique "karmic fingerprint"
 * polygon. Horizontal scroll chips provide specific patterns.
 *
 * The Gita says: "The intricacies of action are very hard to
 * understand" (BG 4.17). This wheel makes them visible.
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

/** A karma category on the wheel */
export interface KarmaCategory {
  id: string
  label: string
  sanskrit: string
  description: string
  color: string
  angle: number
}

/** The 8 Karma Categories */
export const KARMA_CATEGORIES: KarmaCategory[] = [
  { id: 'speech',        label: 'Speech',        sanskrit: '\u0935\u093E\u0915\u094D',   description: 'Words spoken \u2014 kind, harsh, honest, misleading', color: '#2563EB', angle: 0 },
  { id: 'action',        label: 'Action',        sanskrit: '\u0915\u0930\u094D\u092E',   description: 'Physical deeds \u2014 helpful, harmful, neglected',  color: '#D97706', angle: 45 },
  { id: 'thought',       label: 'Thought',       sanskrit: '\u092E\u0928\u0938\u094D',   description: 'Mental patterns \u2014 clarity, agitation, attachment', color: '#7C3AED', angle: 90 },
  { id: 'intention',     label: 'Intention',     sanskrit: '\u0938\u0902\u0915\u0932\u094D\u092A', description: 'The why behind actions \u2014 dharmic, ego, duty', color: '#0E7490', angle: 135 },
  { id: 'relationships', label: 'Relationships', sanskrit: '\u0938\u0902\u092C\u0902\u0927', description: 'How you showed up for others today',  color: '#B91C1C', angle: 180 },
  { id: 'duty',          label: 'Duty',          sanskrit: '\u0927\u0930\u094D\u092E',   description: 'Responsibilities met, avoided, or exceeded', color: '#065F46', angle: 225 },
  { id: 'desires',       label: 'Desires',       sanskrit: '\u0915\u093E\u092E\u0928\u093E', description: 'Attachment to outcomes and possessions',  color: '#9D174D', angle: 270 },
  { id: 'self',          label: 'Self-Mastery',  sanskrit: '\u0906\u0924\u094D\u092E',   description: 'Discipline, honesty with self, ego patterns', color: '#4338CA', angle: 315 },
]

/** Intensity labels for the 5-ring selector */
const WEIGHT_LABELS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Light' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Heavy' },
  { value: 4, label: 'Very Heavy' },
]

/** Pre-written karmic patterns by category */
export const KARMIC_PATTERNS: Record<string, string[]> = {
  speech: [
    'Spoke harshly to someone I love',
    'Withheld truth from fear',
    'Used words to uplift others',
    'Made a promise I must keep',
    'Gossiped or judged others',
  ],
  action: [
    'Acted from fear rather than dharma',
    'Helped without expectation of return',
    'Procrastinated on important duty',
    'Made amends for a past action',
    'Acted against my own values',
  ],
  thought: [
    'Mind caught in comparison',
    'Clarity and focus today',
    'Dwelling on past regrets',
    'Thoughts of envy arose',
    'Practiced mental discipline',
  ],
  intention: [
    'Acted to impress, not to serve',
    'Chose dharma over convenience',
    'Masked true intentions',
    'Aligned action with purpose',
    'Let ego guide a decision',
  ],
  relationships: [
    'Neglected someone who needed me',
    'Showed up fully for a loved one',
    'Avoided a difficult conversation',
    'Forgave without being asked',
    'Took someone for granted',
  ],
  duty: [
    'Fulfilled my responsibilities today',
    'Avoided what I knew was right',
    'Went beyond what was expected',
    'Let fear stop me from acting',
    'Chose comfort over duty',
  ],
  desires: [
    'Clung to an outcome',
    'Practiced acceptance',
    'Consumed more than needed',
    'Released attachment to result',
    'Compared my life to others',
  ],
  self: [
    'Was honest with myself today',
    'Let ego drive my reaction',
    'Practiced self-restraint',
    'Avoided accountability',
    'Showed patience under pressure',
  ],
}

interface MobileKarmicWheelProps {
  /** Called when wheel positions or patterns change */
  onChange: (positions: Record<string, number>, patterns: string[]) => void
  className?: string
}

export function MobileKarmicWheel({ onChange, className = '' }: MobileKarmicWheelProps) {
  const reduceMotion = useReducedMotion()
  const { triggerHaptic } = useHapticFeedback()

  const [positions, setPositions] = useState<Record<string, number>>(() =>
    Object.fromEntries(KARMA_CATEGORIES.map(c => [c.id, 0]))
  )
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [activeSpoke, setActiveSpoke] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(false)

  // Calculate polygon points for the karmic web
  const webPoints = useMemo(() => {
    const cx = 150, cy = 150, maxR = 110
    return KARMA_CATEGORIES.map(cat => {
      const weight = positions[cat.id] || 0
      const r = (weight / 4) * maxR
      const rad = (cat.angle * Math.PI) / 180
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
      }
    })
  }, [positions])

  const webPath = webPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Active categories (weight > 0)
  const activeCategories = KARMA_CATEGORIES.filter(c => positions[c.id] > 0)

  const handleSpokeSelect = useCallback((category: KarmaCategory) => {
    triggerHaptic('selection')
    setActiveSpoke(category.id)
    setShowSelector(true)
  }, [triggerHaptic])

  const handleWeightSet = useCallback((value: number) => {
    if (!activeSpoke) return
    triggerHaptic('light')
    setPositions(prev => {
      const next = { ...prev, [activeSpoke]: value }
      // Notify parent
      setTimeout(() => onChange(next, selectedPatterns), 0)
      return next
    })
    setShowSelector(false)
    setActiveSpoke(null)
  }, [activeSpoke, onChange, selectedPatterns, triggerHaptic])

  const handlePatternToggle = useCallback((pattern: string) => {
    triggerHaptic('selection')
    setSelectedPatterns(prev => {
      const next = prev.includes(pattern)
        ? prev.filter(p => p !== pattern)
        : [...prev, pattern]
      setTimeout(() => onChange(positions, next), 0)
      return next
    })
  }, [onChange, positions, triggerHaptic])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* The Karmic Wheel */}
      <div className="relative" style={{ width: '85vw', maxWidth: 340, aspectRatio: '1' }}>
        <svg viewBox="0 0 300 300" className="w-full h-full" role="group" aria-label="Karmic Wheel \u2014 tap each spoke to set your karmic weight">
          <defs>
            <radialGradient id="web-fill">
              <stop offset="0%" stopColor="var(--sacred-divine-gold, #D4A017)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--sacred-cosmic-void, #050714)" stopOpacity="0.05" />
            </radialGradient>
            <filter id="spoke-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric guide circles */}
          {[1, 2, 3, 4].map(level => (
            <circle
              key={level}
              cx="150" cy="150"
              r={level * 27.5}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
              strokeDasharray={level === 4 ? 'none' : '2 6'}
            />
          ))}

          {/* Outer ring */}
          <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(212,160,23,0.2)" strokeWidth="1" />

          {/* Spoke lines */}
          {KARMA_CATEGORIES.map(cat => {
            const rad = (cat.angle * Math.PI) / 180
            return (
              <line
                key={`spoke-${cat.id}`}
                x1="150" y1="150"
                x2={150 + 120 * Math.cos(rad)}
                y2={150 + 120 * Math.sin(rad)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
              />
            )
          })}

          {/* Karmic web polygon */}
          {activeCategories.length >= 2 && (
            <motion.path
              d={webPath}
              fill="url(#web-fill)"
              stroke="var(--sacred-divine-gold, #D4A017)"
              strokeWidth="1"
              strokeOpacity="0.4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Category nodes at spoke tips */}
          {KARMA_CATEGORIES.map(cat => {
            const rad = (cat.angle * Math.PI) / 180
            const weight = positions[cat.id] || 0
            const nodeR = weight > 0 ? 110 : 120
            const nx = 150 + nodeR * Math.cos(rad)
            const ny = 150 + nodeR * Math.sin(rad)
            const isActive = activeSpoke === cat.id
            const hasWeight = weight > 0

            // Weight indicator position
            const indicatorR = (weight / 4) * 110
            const ix = 150 + indicatorR * Math.cos(rad)
            const iy = 150 + indicatorR * Math.sin(rad)

            return (
              <g key={cat.id}>
                {/* Weight indicator dot on the spoke */}
                {hasWeight && (
                  <motion.circle
                    cx={ix} cy={iy} r="4"
                    fill={cat.color}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    filter="url(#spoke-glow)"
                  />
                )}

                {/* Category tap target */}
                <motion.circle
                  cx={nx} cy={ny}
                  r={isActive ? 16 : 12}
                  fill={hasWeight ? `${cat.color}30` : 'rgba(255,255,255,0.04)'}
                  stroke={isActive ? cat.color : hasWeight ? `${cat.color}60` : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive ? 2 : 1}
                  onClick={() => handleSpokeSelect(cat)}
                  style={{ cursor: 'pointer' }}
                  whileTap={{ scale: 0.85 }}
                  role="button"
                  aria-label={`${cat.label} (${cat.sanskrit}) \u2014 weight: ${WEIGHT_LABELS[weight]?.label || 'None'}`}
                  tabIndex={0}
                />

                {/* Category icon/label */}
                <text
                  x={nx}
                  y={ny + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: '8px',
                    fill: hasWeight ? cat.color : 'var(--sacred-text-muted, #6B6355)',
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                    fontWeight: hasWeight ? 600 : 400,
                  }}
                >
                  {cat.sanskrit}
                </text>

                {/* English label outside */}
                <text
                  x={150 + 138 * Math.cos(rad)}
                  y={150 + 138 * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: '7px',
                    fill: 'var(--sacred-text-muted, #6B6355)',
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  }}
                >
                  {cat.label}
                </text>
              </g>
            )
          })}

          {/* Center — Sudarshana Chakra (spinning slowly) */}
          <motion.g
            animate={!reduceMotion ? { rotate: 360 } : {}}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '150px 150px' }}
          >
            {/* Simple 12-spoke wheel */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180
              return (
                <line
                  key={`chakra-${i}`}
                  x1={150 + 6 * Math.cos(a)}
                  y1={150 + 6 * Math.sin(a)}
                  x2={150 + 14 * Math.cos(a)}
                  y2={150 + 14 * Math.sin(a)}
                  stroke={i % 2 === 0 ? 'var(--sacred-divine-gold, #D4A017)' : 'var(--sacred-peacock-teal, #0E7490)'}
                  strokeWidth="1"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                />
              )
            })}
            <circle cx="150" cy="150" r="5" fill="var(--sacred-divine-gold, #D4A017)" fillOpacity="0.4" />
          </motion.g>
        </svg>
      </div>

      {/* Weight selector — appears when a spoke is tapped */}
      <AnimatePresence>
        {showSelector && activeSpoke && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mt-4 w-full px-4"
          >
            <div
              className="rounded-[20px] p-4"
              style={{
                background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                border: `1px solid ${KARMA_CATEGORIES.find(c => c.id === activeSpoke)?.color || '#D4A017'}30`,
              }}
            >
              <p
                className="text-center mb-3"
                style={{
                  color: KARMA_CATEGORIES.find(c => c.id === activeSpoke)?.color,
                  fontSize: '14px',
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                }}
              >
                {KARMA_CATEGORIES.find(c => c.id === activeSpoke)?.label} — How heavy is this karma today?
              </p>

              <div className="flex justify-between gap-1">
                {WEIGHT_LABELS.map(level => {
                  const isCurrent = positions[activeSpoke] === level.value
                  const catColor = KARMA_CATEGORIES.find(c => c.id === activeSpoke)?.color || '#D4A017'
                  return (
                    <motion.button
                      key={level.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleWeightSet(level.value)}
                      className="flex-1 py-2.5 rounded-xl text-center transition-all"
                      style={{
                        background: isCurrent ? `${catColor}25` : 'rgba(255,255,255,0.03)',
                        border: isCurrent ? `1px solid ${catColor}60` : '1px solid rgba(255,255,255,0.06)',
                        color: isCurrent ? catColor : 'var(--sacred-text-secondary, #B8AE98)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                      }}
                      aria-label={level.label}
                      aria-pressed={isCurrent}
                    >
                      {level.label}
                    </motion.button>
                  )
                })}
              </div>

              <p
                className="text-center mt-2"
                style={{
                  fontSize: '10px',
                  color: 'var(--sacred-text-muted, #6B6355)',
                  fontStyle: 'italic',
                }}
              >
                {KARMA_CATEGORIES.find(c => c.id === activeSpoke)?.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Karmic pattern chips — for categories with weight > 0 */}
      {activeCategories.length > 0 && (
        <div className="mt-6 w-full">
          <p
            className="px-4 mb-2"
            style={{
              fontSize: '10px',
              color: 'var(--sacred-text-muted, #6B6355)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            }}
          >
            Select karmic patterns that resonate
          </p>

          <div className="overflow-x-auto scrollbar-none px-4">
            <div className="flex gap-2 pb-2">
              {activeCategories.flatMap(cat =>
                (KARMIC_PATTERNS[cat.id] || []).map(pattern => {
                  const isSelected = selectedPatterns.includes(pattern)
                  return (
                    <motion.button
                      key={pattern}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePatternToggle(pattern)}
                      className="shrink-0 px-3 py-2 rounded-full whitespace-nowrap transition-all"
                      style={{
                        background: isSelected ? `${cat.color}20` : 'rgba(22,26,66,0.6)',
                        border: isSelected ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                        color: isSelected ? cat.color : 'var(--sacred-text-secondary, #B8AE98)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                        boxShadow: isSelected ? `0 0 8px ${cat.color}30` : 'none',
                      }}
                    >
                      {pattern}
                    </motion.button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileKarmicWheel
