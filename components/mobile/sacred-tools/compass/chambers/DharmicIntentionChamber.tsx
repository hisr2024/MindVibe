'use client'

/**
 * DharmicIntentionChamber — Dharmic Intention / Sankalpa Setting
 *
 * Lets the user choose a dharmic quality and compose a personal
 * intention (sankalpa) for their relationship. Sealing the intention
 * triggers a heavy haptic and advances to the final chamber.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { springConfigs } from '@/lib/animations/spring-configs'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { DHARMIC_QUALITIES, type DharmicQuality } from '../data/dharmicQualities'

interface DharmicIntentionChamberProps {
  partnerName: string
  selectedQuality: DharmicQuality | null
  onQualityChange: (quality: DharmicQuality) => void
  intentionText: string
  onIntentionTextChange: (text: string) => void
  onSeal: () => void
}

export function DharmicIntentionChamber({
  partnerName,
  selectedQuality,
  onQualityChange,
  intentionText,
  onIntentionTextChange,
  onSeal,
}: DharmicIntentionChamberProps) {
  const { triggerHaptic } = useHapticFeedback()

  const handleQualitySelect = (quality: DharmicQuality) => {
    triggerHaptic('selection')
    onQualityChange(quality)
  }

  const handleSeal = () => {
    triggerHaptic('heavy')
    onSeal()
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-5 px-4 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Title */}
      <motion.h2
        className="font-divine italic text-[18px] text-[#D4A017] text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springConfigs.gentle }}
      >
        Set your dharmic intention
      </motion.h2>

      {/* Quality selector — 2-column grid */}
      <div className="w-full grid grid-cols-2 gap-3">
        {DHARMIC_QUALITIES.map((quality) => {
          const isSelected = selectedQuality?.id === quality.id
          return (
            <SacredCard
              key={quality.id}
              interactive
              className={`flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-2 shadow-lg' : 'border border-transparent'
              }`}
              style={{
                minHeight: 90,
                borderColor: isSelected ? quality.color : undefined,
                boxShadow: isSelected ? `0 0 14px ${quality.color}40` : undefined,
              }}
              onClick={() => handleQualitySelect(quality)}
            >
              <span className="font-divine text-[16px]" style={{ color: quality.color }}>
                {quality.sanskrit}
              </span>
              <span className="font-ui text-[12px] text-[var(--sacred-text-primary)] mt-1">
                {quality.label}
              </span>
              <span className="text-[10px] text-[var(--sacred-text-muted)] mt-0.5">
                {quality.description}
              </span>
            </SacredCard>
          )
        })}
      </div>

      {/* Intention textarea — appears after quality selected */}
      <AnimatePresence>
        {selectedQuality && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springConfigs.gentle}
          >
            <textarea
              className="w-full min-h-[80px] rounded-xl p-4 font-sacred italic text-[15px] text-[var(--sacred-text-primary)] bg-[var(--sacred-bg-secondary)] border border-[var(--sacred-border)] focus:border-[#D4A017] focus:outline-none resize-none transition-colors"
              value={intentionText}
              onChange={(e) => onIntentionTextChange(e.target.value)}
              placeholder={`In my relationship with ${partnerName || 'them'}, I choose ${selectedQuality.label.toLowerCase()}.`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seal button */}
      <SacredButton
        variant="divine"
        fullWidth
        disabled={!selectedQuality}
        onClick={handleSeal}
      >
        Seal My Compass
      </SacredButton>
    </motion.div>
  )
}

export default DharmicIntentionChamber
