'use client'

/**
 * GunaMirrorChamber — The Guna Mirror
 *
 * Three-panel horizontal scroll for selecting tamas, rajas, and sattva
 * relationship patterns. Displays live guna score bars at the bottom
 * and navigates to the Dharma Map when ready.
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { springConfigs } from '@/lib/animations/spring-configs'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { GUNA_PATTERNS, type GunaPattern } from '../data/gunaPatterns'

interface GunaMirrorChamberProps {
  selectedPatterns: { tamas: string[]; rajas: string[]; sattva: string[] }
  onTogglePattern: (guna: 'tamas' | 'rajas' | 'sattva', patternId: string) => void
  gunaScores: { tamas: number; rajas: number; sattva: number; dominant: string }
  onProceed: () => void
}

/** Guna panel metadata */
const GUNA_PANELS: {
  key: 'tamas' | 'rajas' | 'sattva'
  sanskrit: string
  label: string
  color: string
  tint: string
  subtext: string
}[] = [
  {
    key: 'tamas',
    sanskrit: 'तमस्',
    label: 'Tamas',
    color: '#6B7280',
    tint: 'rgba(55, 48, 163, 0.06)',
    subtext: 'Patterns of inertia, avoidance, and stagnation',
  },
  {
    key: 'rajas',
    sanskrit: 'रजस्',
    label: 'Rajas',
    color: '#D97706',
    tint: 'rgba(217, 119, 6, 0.06)',
    subtext: 'Patterns of agitation, control, and attachment',
  },
  {
    key: 'sattva',
    sanskrit: 'सत्त्व',
    label: 'Sattva',
    color: '#D4A017',
    tint: 'rgba(212, 160, 23, 0.06)',
    subtext: 'Patterns of harmony, truth, and growth',
  },
]

export function GunaMirrorChamber({
  selectedPatterns,
  onTogglePattern,
  gunaScores,
  onProceed,
}: GunaMirrorChamberProps) {
  const { triggerHaptic } = useHapticFeedback()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState(0)

  // Track which panel is in view via scroll-snap
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActivePanel(prev => prev === idx ? prev : idx)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleToggle = (guna: 'tamas' | 'rajas' | 'sattva', patternId: string) => {
    triggerHaptic('selection')
    onTogglePattern(guna, patternId)
  }

  const totalSelected =
    selectedPatterns.tamas.length +
    selectedPatterns.rajas.length +
    selectedPatterns.sattva.length

  return (
    <motion.div
      className="flex flex-col gap-4 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Horizontal scroll-snap panels */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex" style={{ width: '300%' }}>
          {GUNA_PANELS.map((panel) => (
            <div
              key={panel.key}
              className="min-w-full px-4"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Panel header */}
              <div className="text-center mb-4" style={{ background: panel.tint, borderRadius: 12, padding: '12px 8px' }}>
                <h3 className="font-divine text-[20px]" style={{ color: panel.color }}>
                  {panel.sanskrit} — {panel.label}
                </h3>
                <p className="font-sacred italic text-[12px] text-[var(--sacred-text-muted)] mt-1">
                  {panel.subtext}
                </p>
              </div>

              {/* Pattern cards */}
              <div className="flex flex-col gap-2">
                {GUNA_PATTERNS[panel.key].map((pattern: GunaPattern) => {
                  const isSelected = selectedPatterns[panel.key].includes(pattern.id)
                  return (
                    <SacredCard
                      key={pattern.id}
                      interactive
                      className={`flex items-center justify-between cursor-pointer transition-all duration-200 !py-3 !px-4 ${
                        isSelected ? '' : 'opacity-70'
                      }`}
                      style={{
                        minHeight: 60,
                        borderLeft: isSelected
                          ? `3px solid ${panel.color}`
                          : '2px solid transparent',
                        background: isSelected ? panel.tint : undefined,
                      }}
                      onClick={() => handleToggle(panel.key, pattern.id)}
                    >
                      <span className="font-sacred text-[14px] text-[var(--sacred-text-primary)] flex-1 pr-2">
                        {pattern.text}
                      </span>
                      <span className="font-divine text-[9px] text-[var(--sacred-text-muted)] whitespace-nowrap">
                        {pattern.sanskrit}
                      </span>
                    </SacredCard>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-1">
        {GUNA_PANELS.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: i === activePanel ? '#D4A017' : 'var(--sacred-text-muted)',
              opacity: i === activePanel ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      {/* Guna score bars — fixed at bottom */}
      <div className="px-4 flex flex-col gap-2 mt-2">
        {GUNA_PANELS.map((panel) => (
          <div key={panel.key} className="flex items-center gap-2">
            <span className="font-divine text-[10px] w-12 text-right" style={{ color: panel.color }}>
              {panel.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--sacred-bg-secondary)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: panel.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(gunaScores[panel.key] ?? 0) * 100}%` }}
                transition={springConfigs.smooth}
              />
            </div>
          </div>
        ))}
        <p className="font-ui text-[12px] text-[var(--sacred-text-muted)] text-center mt-1">
          {gunaScores.dominant === 'balanced'
            ? 'Balanced energy'
            : `Predominantly ${gunaScores.dominant}`}
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 mt-2">
        <SacredButton
          variant="divine"
          fullWidth
          disabled={totalSelected === 0}
          onClick={onProceed}
        >
          See Your Dharma Map
        </SacredButton>
      </div>
    </motion.div>
  )
}

export default GunaMirrorChamber
