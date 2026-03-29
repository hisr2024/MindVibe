'use client'

/**
 * DarshanMovement — Movement III: Sakha's Witnessing
 *
 * Displays the AI-generated wisdom response after the user submits
 * their separation context. Shows a loading cycle while waiting,
 * then reveals the WisdomResponseCard with navigation options.
 */

import { motion } from 'framer-motion'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredDivider } from '@/components/sacred/SacredDivider'
import { SacredLoadingCycle } from '../../shared/SacredLoadingCycle'
import WisdomResponseCard from '@/components/tools/WisdomResponseCard'

interface DarshanResponse {
  response: string
  sections: Record<string, string>
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  gitaVerses?: number
}

interface DarshanMovementProps {
  loading: boolean
  response: DarshanResponse | null
  separatedFromName: string
  language: string
  onContinue: () => void
}

const LOADING_MESSAGES = [
  'Listening to the silence between...',
  'Searching the timeless wisdom...',
  'Finding the verse written for this moment...',
  'The ancient wisdom is speaking...',
]

const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function DarshanMovement({
  loading,
  response,
  separatedFromName,
  language,
  onContinue,
}: DarshanMovementProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredLoadingCycle messages={LOADING_MESSAGES} interval={3500} />
      </div>
    )
  }

  if (!response) {
    return null
  }

  return (
    <motion.div
      className="flex flex-col gap-6 pb-8"
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Witnessing header */}
      <p className="font-sacred italic text-[13px] text-[#B8AE98] text-center px-4">
        Sakha has witnessed your longing
        {separatedFromName ? ` for ${separatedFromName}` : ''}
      </p>

      {/* Wisdom response */}
      <SacredCard variant="divine">
        <WisdomResponseCard
          tool="viyoga"
          sections={response.sections}
          fullResponse={response.response}
          citations={response.citations}
          gitaVersesUsed={response.gitaVerses}
          timestamp={new Date().toISOString()}
          language={language}
          secularMode={true}
        />
      </SacredCard>

      <SacredDivider />

      {/* Navigation buttons */}
      <div className="flex flex-col gap-3 px-1">
        <SacredButton
          variant="divine"
          fullWidth
          onClick={onContinue}
        >
          Continue to Sacred Meditation
        </SacredButton>

        <button
          className="font-ui text-[12px] text-[var(--sacred-text-muted)] text-center py-2
            hover:text-[#B8AE98] transition-colors"
          onClick={onContinue}
        >
          Skip to Release &rarr;
        </button>
      </div>
    </motion.div>
  )
}

export default DarshanMovement
