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
import { SacredButton } from '@/components/sacred/SacredButton'
import { GUNA_PATTERNS, type GunaPattern } from '../data/gunaPatterns'

interface GunaMirrorChamberProps {
  selectedPatterns: { tamas: string[]; rajas: string[]; sattva: string[] }
  onTogglePattern: (guna: 'tamas' | 'rajas' | 'sattva', patternId: string) => void
  gunaScores: { tamas: number; rajas: number; sattva: number; dominant: string }
  onProceed: () => void
  customQuery: string
  onCustomQueryChange: (text: string) => void
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

const CUSTOM_QUERY_MAX_LENGTH = 500

export function GunaMirrorChamber({
  selectedPatterns,
  onTogglePattern,
  gunaScores,
  onProceed,
  customQuery,
  onCustomQueryChange,
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
      {/* Custom query textarea */}
      <div className="px-4">
        <p className="font-divine text-[13px] text-[#D4A017] mb-1.5">
          Your situation <span className="text-[var(--sacred-text-muted)]">(optional)</span>
        </p>
        <textarea
          className="w-full min-h-[72px] rounded-xl p-3 font-sacred text-[14px] text-[var(--sacred-text-primary)] bg-[var(--sacred-bg-secondary)] border border-[var(--sacred-border)] focus:border-[#D4A017] focus:outline-none resize-none transition-colors"
          value={customQuery}
          onChange={(e) => onCustomQueryChange(e.target.value.slice(0, CUSTOM_QUERY_MAX_LENGTH))}
          maxLength={CUSTOM_QUERY_MAX_LENGTH}
          placeholder="Describe your situation in your own words..."
        />
        {customQuery.length > 0 && (
          <p className="font-ui text-[11px] text-[var(--sacred-text-muted)] text-right mt-1">
            {customQuery.length}/{CUSTOM_QUERY_MAX_LENGTH}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="px-4">
        <p className="font-divine text-[13px] text-[#D4A017] mb-0">
          Or select patterns you recognise
        </p>
      </div>

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
              <div className="text-center mb-3" style={{ background: panel.tint, borderRadius: 12, padding: '10px 8px' }}>
                <h3 className="font-divine text-[18px]" style={{ color: panel.color }}>
                  {panel.sanskrit} — {panel.label}
                </h3>
                <p className="font-sacred italic text-[11px] text-[var(--sacred-text-muted)] mt-0.5">
                  {panel.subtext}
                </p>
              </div>

              {/* Compact pattern chips */}
              <div className="flex flex-wrap gap-2">
                {GUNA_PATTERNS[panel.key].map((pattern: GunaPattern) => {
                  const isSelected = selectedPatterns[panel.key].includes(pattern.id)
                  return (
                    <button
                      key={pattern.id}
                      type="button"
                      title={pattern.text}
                      className={`active:scale-[0.97] transition-all duration-200 inline-flex items-center py-1.5 px-3 rounded-full font-sacred text-[12px] border cursor-pointer ${
                        isSelected
                          ? 'text-[var(--sacred-text-primary)]'
                          : 'text-[var(--sacred-text-muted)] opacity-70'
                      }`}
                      style={{
                        backgroundColor: isSelected ? panel.tint : 'var(--sacred-bg-secondary)',
                        borderColor: isSelected ? panel.color : 'var(--sacred-border)',
                        color: isSelected ? panel.color : undefined,
                      }}
                      onClick={() => handleToggle(panel.key, pattern.id)}
                    >
                      {pattern.shortLabel}
                      <span className="font-divine text-[9px] ml-1.5 opacity-60">
                        {pattern.sanskrit}
                      </span>
                    </button>
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

      {/* Guna score bars */}
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
          disabled={totalSelected === 0 && customQuery.trim().length === 0}
          onClick={onProceed}
        >
          See Your Dharma Map
        </SacredButton>
      </div>
    </motion.div>
  )
}

export default GunaMirrorChamber
