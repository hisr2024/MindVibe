'use client'

/**
 * CompassSealChamber — The Compass Seal (completion)
 *
 * Displays a blooming compass rose, a word-by-word title reveal,
 * a summary card with the relationship reading, and navigation
 * buttons to home, journal, or Sakha.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { springConfigs } from '@/lib/animations/spring-configs'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredDivider } from '@/components/sacred/SacredDivider'

interface CompassSealChamberProps {
  partnerName: string
  relationshipType: string
  dominantGuna: string
  intentionText: string
  selectedQuality: string
}

/** 8 petal angles for the compass rose bloom */
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Guna color mapping */
const GUNA_COLORS: Record<string, string> = {
  tamas: '#3730A3',
  rajas: '#D97706',
  sattva: '#D4A017',
  balanced: '#D4A017',
}

function CompassBloomSVG() {
  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24 mx-auto">
      {PETAL_ANGLES.map((angle, i) => (
        <motion.ellipse
          key={angle}
          cx={60}
          cy={28}
          rx={8}
          ry={28}
          fill="#D4A017"
          fillOpacity={0.6}
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
      {/* Center */}
      <motion.circle
        cx={60}
        cy={60}
        r={8}
        fill="#D4A017"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, ...springConfigs.bouncy }}
      />
    </svg>
  )
}

export function CompassSealChamber({
  partnerName,
  relationshipType,
  dominantGuna,
  intentionText,
  selectedQuality,
}: CompassSealChamberProps) {
  const router = useRouter()

  const gunaColor = GUNA_COLORS[dominantGuna] ?? GUNA_COLORS.balanced

  // Format the current date
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  // Title words for staggered reveal
  const titleWords = ['Your', 'Compass', 'is', 'Set']

  return (
    <motion.div
      className="flex flex-col items-center gap-5 px-4 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Blooming compass rose */}
      <CompassBloomSVG />

      {/* Word-by-word title */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {titleWords.map((word, i) => (
          <motion.span
            key={i}
            className="font-divine text-[24px] text-[#D4A017]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.15, ...springConfigs.gentle }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Summary card */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <SacredCard variant="divine" className="flex flex-col gap-2">
          <p className="font-ui text-[13px] text-[var(--sacred-text-primary)]">
            Relationship: {partnerName || 'Unnamed'} ({relationshipType})
          </p>
          <p className="font-ui text-[13px]" style={{ color: gunaColor }}>
            Dominant Energy: {dominantGuna.charAt(0).toUpperCase() + dominantGuna.slice(1)}
          </p>
          {selectedQuality && (
            <p className="font-ui text-[13px] text-[var(--sacred-text-primary)]">
              Quality: {selectedQuality}
            </p>
          )}
          {intentionText && (
            <p className="font-sacred italic text-[14px] text-[var(--sacred-text-primary)] mt-1">
              Intention: {intentionText}
            </p>
          )}
          <p className="text-[10px] text-[var(--sacred-text-muted)] mt-1">
            Date: {formattedDate}
          </p>
        </SacredCard>
      </motion.div>

      <SacredDivider />

      {/* Action buttons */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <SacredButton variant="ghost" fullWidth onClick={() => router.push('/m')}>
          Return to Home
        </SacredButton>
        <SacredButton variant="ghost" fullWidth onClick={() => router.push('/m/journal')}>
          Journal This
        </SacredButton>
        <SacredButton variant="ghost" fullWidth onClick={() => router.push('/m/kiaan')}>
          Talk to Sakha
        </SacredButton>
      </motion.div>
    </motion.div>
  )
}

export default CompassSealChamber
