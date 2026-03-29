'use client'

/**
 * CompassAltarChamber — Entry chamber for the Relationship Compass
 *
 * Presents a sacred compass rose animation, relationship type selector,
 * optional partner name input, guna meter slider, and proceed CTA.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { springConfigs } from '@/lib/animations/spring-configs'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredInput } from '@/components/sacred/SacredInput'
import { RELATIONSHIP_TYPES, type RelationshipTypeData } from '../data/relationshipTypes'

interface CompassAltarChamberProps {
  relationshipType: RelationshipTypeData | null
  onRelationshipTypeChange: (type: RelationshipTypeData) => void
  partnerName: string
  onNameChange: (name: string) => void
  initialGunaReading: string
  onGunaReadingChange: (reading: string) => void
  onProceed: () => void
}

/** 8 petal angles for the compass rose SVG */
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function CompassRoseSVG({ compact }: { compact: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="mx-auto"
      animate={{ width: compact ? 48 : 120, height: compact ? 48 : 120 }}
      transition={springConfigs.smooth}
    >
      {PETAL_ANGLES.map((angle, i) => (
        <motion.path
          key={angle}
          d="M60,60 L56,30 L60,10 L64,30 Z"
          fill="#D4A017"
          fillOpacity={0.7}
          transform={`rotate(${angle} 60 60)`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: i * 0.08,
            ...springConfigs.gentle,
          }}
          style={{ transformOrigin: '60px 60px' }}
        />
      ))}
      {/* Center circle */}
      <motion.circle
        cx={60}
        cy={60}
        r={6}
        fill="#D4A017"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, ...springConfigs.bouncy }}
      />
    </motion.svg>
  )
}

export function CompassAltarChamber({
  relationshipType,
  onRelationshipTypeChange,
  partnerName,
  onNameChange,
  initialGunaReading,
  onGunaReadingChange,
  onProceed,
}: CompassAltarChamberProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [compact, setCompact] = useState(false)

  // Shrink compass rose after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => setCompact(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleTypeSelect = (type: RelationshipTypeData) => {
    triggerHaptic('selection')
    onRelationshipTypeChange(type)
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-5 px-4 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Compass Rose */}
      <CompassRoseSVG compact={compact} />

      {/* Sanskrit Title */}
      <motion.h2
        className="font-divine text-[28px] text-[#D4A017] text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...springConfigs.gentle }}
      >
        सम्बन्ध धर्म
      </motion.h2>

      {/* English Subtitle */}
      <motion.p
        className="font-sacred italic text-[14px] text-[var(--sacred-text-secondary)] -mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Relationship Compass
      </motion.p>

      {/* Relationship type prompt */}
      <motion.p
        className="font-divine italic text-[16px] text-[#D4A017] text-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        Who are you bringing to the Compass?
      </motion.p>

      {/* Horizontal scrollable type selector */}
      <motion.div
        className="w-full overflow-x-auto pb-2 -mx-4 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div className="flex gap-2 min-w-max">
          {RELATIONSHIP_TYPES.map((type) => {
            const isSelected = relationshipType?.id === type.id
            return (
              <SacredCard
                key={type.id}
                interactive
                className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-2 shadow-lg'
                    : 'border border-transparent opacity-80'
                }`}
                style={{
                  width: 80,
                  height: 90,
                  borderColor: isSelected ? type.color : undefined,
                  boxShadow: isSelected ? `0 0 12px ${type.color}40` : undefined,
                }}
                onClick={() => handleTypeSelect(type)}
              >
                <span className="text-[9px] text-[var(--sacred-text-muted)] font-divine">
                  {type.sanskrit}
                </span>
                <span className="text-[12px] font-ui text-[var(--sacred-text-primary)] mt-1">
                  {type.label}
                </span>
              </SacredCard>
            )
          })}
        </div>
      </motion.div>

      {/* Partner name input — only after type selected */}
      <AnimatePresence>
        {relationshipType && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springConfigs.gentle}
          >
            <SacredInput
              placeholder="Their name (optional)"
              value={partnerName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guna meter slider */}
      <AnimatePresence>
        {relationshipType && (
          <motion.div
            className="w-full mt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="font-sacred italic text-[14px] text-[var(--sacred-text-secondary)] text-center mb-3">
              How does this relationship feel right now?
            </p>

            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={
                initialGunaReading === 'sattva' ? 2 : initialGunaReading === 'rajas' ? 1 : 0
              }
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                const reading = val === 2 ? 'sattva' : val === 1 ? 'rajas' : 'tamas'
                onGunaReadingChange(reading)
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #0A0818, #C05621, #FDE68A)',
              }}
            />

            <div className="flex justify-between mt-1 px-1">
              <span className="font-divine text-[11px] text-[#6B7280]">तमस्</span>
              <span className="font-divine text-[11px] text-[#D97706]">रजस्</span>
              <span className="font-divine text-[11px] text-[#D4A017]">सत्त्व</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div
        className="w-full mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        <SacredButton
          variant="divine"
          fullWidth
          disabled={!relationshipType}
          onClick={onProceed}
        >
          Open the Compass
        </SacredButton>
      </motion.div>
    </motion.div>
  )
}

export default CompassAltarChamber
