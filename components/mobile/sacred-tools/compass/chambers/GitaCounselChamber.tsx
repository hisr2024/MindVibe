'use client'

/**
 * GitaCounselChamber — The Gita Counsel
 *
 * Displays the AI-generated Gita wisdom response for the relationship
 * compass reading. Shows a sacred loading cycle while the response is
 * being generated, then renders the WisdomResponseCard.
 */

import { motion } from 'framer-motion'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredDivider } from '@/components/sacred/SacredDivider'
import WisdomResponseCard from '@/components/tools/WisdomResponseCard'
import { SacredLoadingCycle } from '../../shared/SacredLoadingCycle'

interface GitaCounselChamberProps {
  loading: boolean
  response: {
    response: string
    sections: Record<string, string>
    citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
    gitaVerses?: number
    secularMode?: boolean
  } | null
  language: string
  onContinue: () => void
}

/** Cycling messages shown while KIAAN generates wisdom */
const LOADING_MESSAGES = [
  'The Compass is finding your direction...',
  'Reading the gunas of your connection...',
  'Krishna is illuminating the path...',
  'The dharmic wisdom is flowing...',
]

export function GitaCounselChamber({
  loading,
  response,
  language,
  onContinue,
}: GitaCounselChamberProps) {
  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[300px] px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <SacredLoadingCycle messages={LOADING_MESSAGES} interval={3000} />
      </motion.div>
    )
  }

  if (!response) {
    return null
  }

  return (
    <motion.div
      className="flex flex-col gap-5 px-4 pb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SacredCard variant="divine">
        <WisdomResponseCard
          tool="relationship_compass"
          sections={response.sections}
          fullResponse={response.response}
          gitaVersesUsed={response.gitaVerses}
          timestamp={new Date().toISOString()}
          language={language}
          citations={response.citations}
          secularMode={response.secularMode}
        />
      </SacredCard>

      <SacredDivider />

      <SacredButton variant="divine" fullWidth onClick={onContinue}>
        Set Your Dharmic Intention
      </SacredButton>
    </motion.div>
  )
}

export default GitaCounselChamber
