'use client'

/**
 * MobileFeelingMandala — The Sacred Emotion Mandala
 *
 * A circular arrangement of 12 emotional states rendered as living,
 * animated lotus petals. Each emotion is a petal of the mandala.
 * Selecting an emotion causes that petal to bloom and glow.
 *
 * "How are you feeling?" — not a dropdown, not checkboxes,
 * but a sacred mandala that breathes with the user.
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

/** A single emotional state in the mandala */
export interface EmotionalState {
  id: string
  label: string
  sanskrit: string
  color: string
  glowColor: string
  angle: number
  ring: 1 | 2
}

/** The 12 Sacred Emotional States */
export const EMOTIONAL_STATES: EmotionalState[] = [
  // Ring 1 — Primary (8 petals, larger)
  { id: 'grief',      label: 'Grief',       sanskrit: '\u0936\u094B\u0915',    color: '#4A5568', glowColor: '#718096', angle: 0,   ring: 1 },
  { id: 'fear',       label: 'Fear',        sanskrit: '\u092D\u092F',     color: '#2D3748', glowColor: '#4A5568', angle: 45,  ring: 1 },
  { id: 'anger',      label: 'Anger',       sanskrit: '\u0915\u094D\u0930\u094B\u0927',  color: '#742A2A', glowColor: '#FC8181', angle: 90,  ring: 1 },
  { id: 'confusion',  label: 'Confusion',   sanskrit: '\u092E\u094B\u0939',    color: '#2A4365', glowColor: '#63B3ED', angle: 135, ring: 1 },
  { id: 'loneliness', label: 'Loneliness',  sanskrit: '\u090F\u0915\u093E\u0915\u0940',  color: '#1A365D', glowColor: '#4299E1', angle: 180, ring: 1 },
  { id: 'anxiety',    label: 'Anxiety',     sanskrit: '\u091A\u093F\u0902\u0924\u093E',  color: '#553C9A', glowColor: '#B794F4', angle: 225, ring: 1 },
  { id: 'shame',      label: 'Shame',       sanskrit: '\u0932\u091C\u094D\u091C\u093E',  color: '#521B41', glowColor: '#D53F8C', angle: 270, ring: 1 },
  { id: 'exhaustion', label: 'Exhaustion',  sanskrit: '\u0925\u0915\u093E\u0928',   color: '#2D3748', glowColor: '#A0AEC0', angle: 315, ring: 1 },
  // Ring 2 — Nuanced (4 smaller petals)
  { id: 'overwhelm',  label: 'Overwhelm',   sanskrit: '\u0905\u092D\u093F\u092D\u0942\u0924', color: '#44337A', glowColor: '#9F7AEA', angle: 22,  ring: 2 },
  { id: 'guilt',      label: 'Guilt',       sanskrit: '\u0905\u092A\u0930\u093E\u0927',  color: '#63171B', glowColor: '#FEB2B2', angle: 112, ring: 2 },
  { id: 'sadness',    label: 'Sadness',     sanskrit: '\u0926\u0941\u0903\u0916',   color: '#1A3A5C', glowColor: '#90CDF4', angle: 202, ring: 2 },
  { id: 'doubt',      label: 'Doubt',       sanskrit: '\u0938\u0902\u0936\u092F',   color: '#3C366B', glowColor: '#A3BFFA', angle: 292, ring: 2 },
]

/** Intensity levels */
const INTENSITY_LEVELS = [
  { value: 1, label: 'A whisper',      sanskrit: '\u0938\u094D\u092A\u0930\u094D\u0936' },
  { value: 2, label: 'Present',        sanskrit: '\u0909\u092A\u0938\u094D\u0925\u093F\u0924' },
  { value: 3, label: 'Strong',         sanskrit: '\u092A\u094D\u0930\u092C\u0932' },
  { value: 4, label: 'Overwhelming',   sanskrit: '\u0905\u092D\u093F\u092D\u0942\u0924' },
  { value: 5, label: 'All-consuming',  sanskrit: '\u0938\u0930\u094D\u0935\u0935\u094D\u092F\u093E\u092A\u0940' },
]

interface MobileFeelingMandalaProps {
  /** Called when emotion and intensity are selected */
  onSelect: (emotion: EmotionalState, intensity: number) => void
  className?: string
}

/** SVG lotus petal path for a given angle and ring */
function petalPath(angle: number, ring: 1 | 2): string {
  const cx = 150
  const cy = 150
  const radius = ring === 1 ? 90 : 130
  const petalLength = ring === 1 ? 42 : 28
  const petalWidth = ring === 1 ? 18 : 12

  // Calculate petal tip position
  const rad = (angle * Math.PI) / 180
  const tipX = cx + radius * Math.cos(rad)
  const tipY = cy + radius * Math.sin(rad)

  // Calculate base positions (perpendicular to radius)
  const perpRad = rad + Math.PI / 2
  const baseRadius = radius - petalLength
  const baseCx = cx + baseRadius * Math.cos(rad)
  const baseCy = cy + baseRadius * Math.sin(rad)
  const base1X = baseCx + petalWidth * Math.cos(perpRad)
  const base1Y = baseCy + petalWidth * Math.sin(perpRad)
  const base2X = baseCx - petalWidth * Math.cos(perpRad)
  const base2Y = baseCy - petalWidth * Math.sin(perpRad)

  // Control points for bezier curves (creates teardrop shape)
  const cp1X = base1X + (tipX - base1X) * 0.6 + petalWidth * 0.3 * Math.cos(perpRad)
  const cp1Y = base1Y + (tipY - base1Y) * 0.6 + petalWidth * 0.3 * Math.sin(perpRad)
  const cp2X = base2X + (tipX - base2X) * 0.6 - petalWidth * 0.3 * Math.cos(perpRad)
  const cp2Y = base2Y + (tipY - base2Y) * 0.6 - petalWidth * 0.3 * Math.sin(perpRad)

  return `M ${baseCx} ${baseCy} Q ${cp1X} ${cp1Y} ${tipX} ${tipY} Q ${cp2X} ${cp2Y} ${baseCx} ${baseCy} Z`
}

/** Label position for a petal */
function labelPosition(angle: number, ring: 1 | 2) {
  const cx = 150
  const cy = 150
  const radius = ring === 1 ? 90 : 130
  const rad = (angle * Math.PI) / 180
  return {
    x: cx + (radius + (ring === 1 ? 14 : 10)) * Math.cos(rad),
    y: cy + (radius + (ring === 1 ? 14 : 10)) * Math.sin(rad),
  }
}

export function MobileFeelingMandala({ onSelect, className = '' }: MobileFeelingMandalaProps) {
  const reduceMotion = useReducedMotion()
  const { triggerHaptic } = useHapticFeedback()
  const [selected, setSelected] = useState<EmotionalState | null>(null)
  const [intensity, setIntensity] = useState<number>(0)
  const [showIntensity, setShowIntensity] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const handlePetalSelect = useCallback((emotion: EmotionalState) => {
    triggerHaptic('medium')
    setSelected(emotion)
    // Show intensity immediately — no artificial delay
    setShowIntensity(true)
  }, [triggerHaptic])

  const handleIntensitySelect = useCallback((value: number) => {
    triggerHaptic('selection')
    setIntensity(value)
  }, [triggerHaptic])

  const handleConfirm = useCallback(() => {
    if (selected && intensity > 0) {
      triggerHaptic('success')
      onSelect(selected, intensity)
    }
  }, [selected, intensity, onSelect, triggerHaptic])

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ touchAction: 'manipulation' }}>
      {/* The Sacred Mandala */}
      <div className="relative" style={{ width: '85vw', maxWidth: 340, aspectRatio: '1' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className="w-full h-full"
          role="group"
          aria-label="Sacred Emotion Mandala — select how you are feeling"
        >
          <defs>
            {/* Glow filter for selected petals */}
            <filter id="petal-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Center gradient */}
            <radialGradient id="center-glow">
              <stop offset="0%" stopColor="var(--sacred-divine-gold, #D4A017)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--sacred-divine-gold, #D4A017)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric guide rings (very subtle) */}
          <circle cx="150" cy="150" r="90" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

          {/* Center glow */}
          <circle cx="150" cy="150" r="35" fill="url(#center-glow)" />

          {/* Emotion Petals — no infinite animations, hit areas expanded */}
          {EMOTIONAL_STATES.map((emotion) => {
            const isSelected = selected?.id === emotion.id
            const path = petalPath(emotion.angle, emotion.ring)

            return (
              <g key={emotion.id}>
                {/* Invisible expanded hit area for reliable mobile tapping */}
                <path
                  d={path}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={20}
                  style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                  onClick={() => handlePetalSelect(emotion)}
                  role="button"
                  aria-label={`${emotion.label} (${emotion.sanskrit})`}
                  aria-pressed={isSelected}
                  tabIndex={0}
                />
                {/* Visual petal — only the selected petal animates (bloom) */}
                <motion.path
                  d={path}
                  fill={isSelected ? emotion.glowColor : emotion.color}
                  fillOpacity={isSelected ? 0.7 : 0.3}
                  stroke={isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isSelected ? 1 : 0.5}
                  filter={isSelected ? 'url(#petal-glow)' : undefined}
                  animate={
                    isSelected && !reduceMotion
                      ? { scale: 1.25, fillOpacity: 0.7 }
                      : {}
                  }
                  transition={
                    isSelected
                      ? { type: 'spring', stiffness: 200, damping: 15 }
                      : { duration: 0.2 }
                  }
                  style={{ transformOrigin: '150px 150px', pointerEvents: 'none' }}
                />
              </g>
            )
          })}

          {/* Center text */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.g
                key={selected.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <text
                  x="150"
                  y="144"
                  textAnchor="middle"
                  className="fill-[var(--sacred-divine-gold-bright,#F0C040)]"
                  style={{ fontSize: '16px', fontFamily: 'var(--font-divine, Cormorant Garamond, serif)' }}
                >
                  {selected.sanskrit}
                </text>
                <text
                  x="150"
                  y="164"
                  textAnchor="middle"
                  className="fill-[var(--sacred-text-primary,#EDE8DC)]"
                  style={{ fontSize: '13px', fontFamily: 'var(--font-divine, Cormorant Garamond, serif)', fontStyle: 'italic' }}
                >
                  {selected.label}
                </text>
              </motion.g>
            ) : (
              <motion.text
                key="prompt"
                x="150"
                y="154"
                textAnchor="middle"
                className="fill-[var(--sacred-text-secondary,#B8AE98)]"
                style={{ fontSize: '13px', fontFamily: 'var(--font-divine, Cormorant Garamond, serif)', fontStyle: 'italic' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                How are you feeling?
              </motion.text>
            )}
          </AnimatePresence>

          {/* Petal labels — only for non-selected visible petals */}
          {EMOTIONAL_STATES.map((emotion) => {
            if (selected?.id === emotion.id) return null
            const pos = labelPosition(emotion.angle, emotion.ring)
            return (
              <text
                key={`label-${emotion.id}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[var(--sacred-text-muted,#6B6355)] pointer-events-none"
                style={{ fontSize: emotion.ring === 1 ? '7px' : '6px', fontFamily: 'var(--font-ui, Outfit, sans-serif)' }}
              >
                {emotion.label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Intensity Selector — 5 Concentric Rings */}
      <AnimatePresence>
        {showIntensity && selected && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 flex flex-col items-center"
          >
            <p
              className="text-xs mb-4"
              style={{
                color: 'var(--sacred-text-secondary, #B8AE98)',
                fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                fontStyle: 'italic',
              }}
            >
              How intensely do you feel this?
            </p>

            {/* Concentric ring selector — wide hit areas, no infinite animations */}
            <div className="relative" style={{ width: 220, height: 220 }}>
              <svg viewBox="0 0 220 220" className="w-full h-full">
                {INTENSITY_LEVELS.map((level, i) => {
                  const radius = 22 + i * 22
                  const isActive = intensity >= level.value
                  const isCurrent = intensity === level.value
                  return (
                    <g key={level.value}>
                      {/* Wide invisible hit area ring for reliable tapping */}
                      <circle
                        cx="110"
                        cy="110"
                        r={radius}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={18}
                        onClick={() => handleIntensitySelect(level.value)}
                        style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                        role="button"
                        aria-label={`Intensity: ${level.label} (${level.sanskrit})`}
                        aria-pressed={isCurrent}
                        tabIndex={0}
                      />
                      {/* Visible ring */}
                      <circle
                        cx="110"
                        cy="110"
                        r={radius}
                        fill="none"
                        stroke={isActive ? (selected?.glowColor || '#D4A017') : 'rgba(255,255,255,0.08)'}
                        strokeWidth={isCurrent ? 3 : 1.5}
                        strokeOpacity={isActive ? (isCurrent ? 0.9 : 0.4) : 0.3}
                        className="pointer-events-none"
                        style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease, stroke-opacity 0.2s ease' }}
                      />
                      {/* Label */}
                      <text
                        x="110"
                        y={110 - radius - 5}
                        textAnchor="middle"
                        className="pointer-events-none"
                        style={{
                          fontSize: '8px',
                          fill: isCurrent ? (selected?.glowColor || '#D4A017') : 'var(--sacred-text-muted, #6B6355)',
                          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                          transition: 'fill 0.2s ease',
                        }}
                      >
                        {level.label}
                      </text>
                    </g>
                  )
                })}

                {/* Center dot */}
                <circle
                  cx="110"
                  cy="110"
                  r="6"
                  fill={selected?.glowColor || 'var(--sacred-divine-gold, #D4A017)'}
                  opacity={0.6}
                />
              </svg>
            </div>

            {/* Selected intensity label */}
            <AnimatePresence mode="wait">
              {intensity > 0 && (
                <motion.p
                  key={intensity}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-center"
                  style={{
                    color: selected?.glowColor || 'var(--sacred-divine-gold, #D4A017)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                    fontStyle: 'italic',
                  }}
                >
                  {INTENSITY_LEVELS[intensity - 1]?.sanskrit} — {INTENSITY_LEVELS[intensity - 1]?.label}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm button — appears after both emotion and intensity selected */}
      <AnimatePresence>
        {selected && intensity > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className="mt-6 w-full px-4"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, var(--sacred-krishna-blue, #1B4FBB), var(--sacred-peacock-teal, #0E7490))',
                color: 'var(--sacred-text-primary, #EDE8DC)',
                border: '1px solid var(--sacred-divine-gold, #D4A017)',
                boxShadow: `0 0 24px rgba(${selected.glowColor}, 0.2), 0 4px 16px rgba(0,0,0,0.3)`,
              }}
            >
              Offer to Sakha
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileFeelingMandala
